// Webhook Stripe -> API Conversions de Meta.
// À chaque paiement confirmé, envoie l'achat à Meta depuis le serveur, avec les coordonnées de la cliente hachées.
// Uniquement si elle avait accepté la publicité : index.html transmet alors une référence « m1_… »
// dans client_reference_id (voir suivi.js). Sans cette référence, rien n'est envoyé.
// Variables à définir dans Vercel (jamais dans le code) :
//   STRIPE_WEBHOOK_SECRET, META_PIXEL_ID, META_CAPI_TOKEN, META_TEST_EVENT_CODE (facultatif, pour les tests)
const crypto = require("node:crypto");

const VERSION_API_META = "v23.0";

function lireCorps(req) {
  return new Promise((ok, echec) => {
    const morceaux = [];
    req.on("data", (m) => morceaux.push(m));
    req.on("end", () => ok(Buffer.concat(morceaux)));
    req.on("error", echec);
  });
}

function signatureValide(corps, entete, secret) {
  if (!entete || !secret) return false;
  const parties = entete.split(",").map((p) => p.split("="));
  const horodatage = parties.find(([cle]) => cle === "t")?.[1];
  const signatures = parties.filter(([cle]) => cle === "v1").map(([, valeur]) => valeur);
  if (!horodatage || Math.abs(Date.now() / 1000 - Number(horodatage)) > 300) return false;
  const attendue = crypto.createHmac("sha256", secret).update(`${horodatage}.${corps.toString("utf8")}`).digest("hex");
  return signatures.some((s) => s.length === attendue.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(attendue)));
}

function hache(valeur) {
  const propre = String(valeur ?? "").trim().toLowerCase();
  return propre ? [crypto.createHash("sha256").update(propre).digest("hex")] : undefined;
}

function lireReference(ref) {
  if (!ref || !ref.startsWith("m1_")) return null;
  const [, fbp, ...reste] = ref.split("_");
  const fbc = reste.join("_").match(/^fb-(\d)-(\d+)-(.+)$/);
  return {
    fbp: fbp && fbp !== "0" ? fbp.replace(/-/g, ".") : undefined,
    fbc: fbc ? `fb.${fbc[1]}.${fbc[2]}.${fbc[3]}` : undefined,
  };
}

function repondre(res, code, texte) {
  res.statusCode = code;
  res.end(texte);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return repondre(res, 405, "méthode non autorisée");

  const corps = await lireCorps(req);
  if (!signatureValide(corps, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET)) {
    return repondre(res, 400, "signature invalide");
  }

  const evenement = JSON.parse(corps.toString("utf8"));
  const session = evenement.data?.object;
  if (evenement.type !== "checkout.session.completed" || session?.payment_status !== "paid") {
    return repondre(res, 200, "ignoré");
  }

  const suivi = lireReference(session.client_reference_id);
  if (!suivi) return repondre(res, 200, "publicité non acceptée : rien envoyé");

  const client = session.customer_details || {};
  const adresse = client.address || {};
  const [prenom, ...nom] = (client.name || "").trim().split(/\s+/);

  const envoi = {
    data: [{
      event_name: "Purchase",
      event_time: evenement.created,
      event_id: session.id,
      action_source: "website",
      event_source_url: "https://andersonparis.fr/merci",
      user_data: {
        em: hache(client.email),
        ph: hache((client.phone || "").replace(/\D/g, "")),
        fn: hache(prenom),
        ln: hache(nom.join(" ")),
        ct: hache((adresse.city || "").replace(/\s/g, "")),
        zp: hache((adresse.postal_code || "").replace(/\s/g, "")),
        country: hache(adresse.country),
        external_id: hache(session.customer || client.email),
        fbp: suivi.fbp,
        fbc: suivi.fbc,
      },
      custom_data: {
        currency: (session.currency || "eur").toUpperCase(),
        value: session.amount_total / 100,
        content_ids: ["lumina-regard"],
        content_type: "product",
        order_id: session.id,
      },
    }],
  };
  if (process.env.META_TEST_EVENT_CODE) envoi.test_event_code = process.env.META_TEST_EVENT_CODE;

  const reponse = await fetch(
    `https://graph.facebook.com/${VERSION_API_META}/${process.env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(process.env.META_CAPI_TOKEN || "")}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(envoi) }
  );
  if (!reponse.ok) {
    console.error("API Conversions Meta :", reponse.status, await reponse.text());
    return repondre(res, 502, "échec de l'envoi à Meta");
  }
  return repondre(res, 200, "achat envoyé à Meta");
};
