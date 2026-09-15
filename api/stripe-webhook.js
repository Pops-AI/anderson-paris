import crypto from 'node:crypto';
 
const KLAVIYO_REVISION = '2024-10-15';
 
/**
 * Vérifie la signature Stripe sans dépendance externe.
 * En-tête reçu : t=1700000000,v1=abcdef...
 */
function verifieSignature(rawBody, header, secret, toleranceSec = 300) {
  if (!header) return false;
 
  let timestamp = null;
  const signatures = [];
 
  for (const partie of header.split(',')) {
    const [cle, valeur] = partie.split('=');
    if (cle === 't') timestamp = valeur;
    if (cle === 'v1') signatures.push(valeur);
  }
 
  if (!timestamp || signatures.length === 0) return false;
 
  // Protection contre le rejeu
  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(age) || Math.abs(age) > toleranceSec) return false;
 
  const attendu = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
 
  const bufAttendu = Buffer.from(attendu, 'hex');
 
  return signatures.some((sig) => {
    let bufRecu;
    try {
      bufRecu = Buffer.from(sig, 'hex');
    } catch {
      return false;
    }
    return (
      bufRecu.length === bufAttendu.length &&
      crypto.timingSafeEqual(bufRecu, bufAttendu)
    );
  });
}
 
/**
 * Enregistre la commande dans Supabase.
 *
 * La déduplication est garantie par la BASE, pas par ce code : la contrainte
 * `unique (store_id, source, external_id)` sur `events` et
 * `unique (store_id, external_id)` sur `orders` rendent un rejeu impossible.
 * Un renvoi Stripe du même événement est donc rejeté par PostgreSQL (23505),
 * traité ici comme un succès : la commande est déjà enregistrée.
 *
 * Silencieux si Supabase n'est pas configuré : le flux Klaviyo, qui fait
 * vivre la relation client, ne doit jamais tomber parce que la base de
 * mesure est absente.
 */
async function enregistrerDansSupabase(session, evenement, montantCentimes, devise, adresse) {
  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) return { ok: false, raison: 'non configuré' };

  const entetes = {
    apikey: cle,
    Authorization: `Bearer ${cle}`,
    'content-type': 'application/json',
    // Ne renvoie pas la ligne écrite : inutile ici, et évite de faire
    // transiter des données personnelles dans les journaux Vercel.
    Prefer: 'return=minimal',
  };

  // 23505 = violation de contrainte unique : l'événement est déjà connu.
  const estDoublon = async (reponse) => {
    if (reponse.status !== 409) return false;
    const texte = await reponse.text();
    return texte.includes('23505');
  };

  const resultats = {};

  // 1. La commande. customer_email est stocké pour le SAV ; la vue
  //    analytics_orders l'exclut, donc analytics ne le voit jamais.
  try {
    const r = await fetch(`${url}/rest/v1/orders`, {
      method: 'POST',
      headers: entetes,
      body: JSON.stringify({
        store_id: 'anderson-paris',
        external_id: session.id,
        status: 'paid',
        amount_cents: montantCentimes,
        currency: devise,
        customer_email: session.customer_details?.email || null,
        country: adresse.country || null,
      }),
    });
    resultats.order = r.ok ? 'créée' : (await estDoublon(r)) ? 'déjà connue' : `échec ${r.status}`;
  } catch (e) {
    resultats.order = `injoignable: ${e.message}`;
  }

  // 2. L'événement brut, pour l'historique et la reprise après incident.
  try {
    const r = await fetch(`${url}/rest/v1/events`, {
      method: 'POST',
      headers: entetes,
      body: JSON.stringify({
        store_id: 'anderson-paris',
        source: 'stripe',
        external_id: evenement.id || session.id,
        type: 'purchase',
        payload: {
          amount_cents: montantCentimes,
          currency: devise,
          country: adresse.country || null,
          payment_method: session.payment_method_types?.[0] || null,
        },
        processed_at: new Date().toISOString(),
      }),
    });
    resultats.event = r.ok ? 'créé' : (await estDoublon(r)) ? 'déjà connu' : `échec ${r.status}`;
  } catch (e) {
    resultats.event = `injoignable: ${e.message}`;
  }

  return { ok: true, ...resultats };
}

/**
 * NOTE — pourquoi il n'y a PAS de confirmation d'achat vers PostHog ici.
 *
 * Un webhook serveur n'a aucun accès au choix exprimé dans le bandeau : il
 * est stocké dans le navigateur de la cliente. Envoyer l'achat depuis ici
 * transmettrait donc les données de TOUTES les commandes, y compris celles
 * des clientes ayant refusé la mesure d'audience — en contradiction directe
 * avec confidentialite.html, qui promet « déposé uniquement si vous
 * l'acceptez ».
 *
 * Le partage des rôles est donc :
 *   - PostHog  : mesure du parcours, côté navigateur, sous consentement.
 *                Un achat peut y manquer ; c'est le prix du consentement.
 *   - Supabase : source de vérité des ventes, côté serveur, exhaustive.
 *                Base légale : exécution du contrat, pas le consentement.
 *
 * Le bilan quotidien lit les ventes dans Supabase, jamais dans PostHog.
 */

// Vercel ignore la valeur de retour d'un `export default`.
// Il faut exporter des méthodes HTTP nommées pour le style Web/fetch.
export function GET() {
  return new Response('Méthode non autorisée', { status: 405 });
}
 
export async function POST(request) {
  const secretStripe = process.env.STRIPE_WEBHOOK_SECRET;
  const cleKlaviyo = process.env.KLAVIYO_PRIVATE_KEY;
 
  if (!secretStripe || !cleKlaviyo) {
    console.error('Variables d\'environnement manquantes');
    return new Response('Configuration serveur incomplète', { status: 500 });
  }
 
  // Corps brut obligatoire : la moindre reformulation casse la signature
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');
 
  if (!verifieSignature(rawBody, signature, secretStripe)) {
    console.error('Signature Stripe invalide');
    return new Response('Signature invalide', { status: 400 });
  }
 
  let evenement;
  try {
    evenement = JSON.parse(rawBody);
  } catch {
    return new Response('JSON illisible', { status: 400 });
  }
 
  // On ignore poliment tout ce qui n'est pas une commande finalisée
  if (evenement.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ ignore: evenement.type }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
 
  const session = evenement.data?.object ?? {};
 
  const email =
    session.customer_details?.email || session.customer_email || null;
 
  if (!email) {
    console.error('Commande sans email', session.id);
    // 200 volontaire : inutile que Stripe retente, l'email ne réapparaîtra pas
    return new Response(JSON.stringify({ ok: false, raison: 'email absent' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
 
  const nomComplet = (session.customer_details?.name || '').trim();
  const prenom = nomComplet ? nomComplet.split(/\s+/)[0] : '';
  const nom = nomComplet ? nomComplet.split(/\s+/).slice(1).join(' ') : '';
 
  const adresse =
    session.collected_information?.shipping_details?.address ||
    session.shipping_details?.address ||
    session.customer_details?.address ||
    {};
 
  const montant = (session.amount_total ?? 0) / 100;
  const devise = (session.currency || 'eur').toUpperCase();
  const optinMarketing = session.consent?.promotions === 'opt_in';
 
  const corps = {
    data: {
      type: 'event',
      attributes: {
        // unique_id : garantit qu'un renvoi Stripe ne crée pas de doublon
        unique_id: session.id,
        time: new Date((evenement.created ?? Date.now() / 1000) * 1000).toISOString(),
        value: montant,
        value_currency: devise,
        metric: {
          data: {
            type: 'metric',
            // Doit correspondre EXACTEMENT au déclencheur du flow Klaviyo.
            // Si tu changes ce texte, change aussi le flow, sinon plus rien ne part.
            attributes: { name: 'Commande Passée' },
          },
        },
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email,
              first_name: prenom || undefined,
              last_name: nom || undefined,
              phone_number: session.customer_details?.phone || undefined,
              location: {
                address1: adresse.line1 || undefined,
                address2: adresse.line2 || undefined,
                city: adresse.city || undefined,
                zip: adresse.postal_code || undefined,
                country: adresse.country || undefined,
              },
              properties: {
                'Accepte Marketing': optinMarketing,
                'Source Commande': 'Stripe',
              },
            },
          },
        },
        properties: {
          OrderId: session.id,
          Total: montant,
          Devise: devise,
          Produit: 'Lumina Regard',
          ModePaiement: session.payment_method_types?.[0] || 'inconnu',
          PaysLivraison: adresse.country || 'FR',
          AccepteMarketing: optinMarketing,
        },
      },
    },
  };
 
  try {
    const reponse = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: {
        Authorization: `Klaviyo-API-Key ${cleKlaviyo}`,
        revision: KLAVIYO_REVISION,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(corps),
    });
 
    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error('Refus Klaviyo', reponse.status, detail);
      // 500 : Stripe retentera automatiquement pendant 3 jours
      return new Response('Échec Klaviyo', { status: 500 });
    }
  } catch (erreur) {
    console.error('Klaviyo injoignable', erreur);
    return new Response('Klaviyo injoignable', { status: 500 });
  }
 
  console.log('Commande transmise à Klaviyo', session.id, email);

  // Klaviyo est passé : la commande est sauve côté relation client.
  // Supabase vient APRÈS et ne peut plus la compromettre.
  // Un échec ici ne doit pas provoquer de renvoi par Stripe : cela rejouerait
  // l'événement Klaviyo et risquerait un second e-mail à la cliente.
  const supabase = await enregistrerDansSupabase(
    session, evenement, session.amount_total ?? 0, devise, adresse,
  ).catch((e) => ({ ok: false, raison: e.message }));

  console.log('Mesure', session.id, JSON.stringify({ supabase }));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
 
