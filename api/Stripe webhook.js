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

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

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

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
