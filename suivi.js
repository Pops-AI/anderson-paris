// Traceurs Google Analytics, PostHog et pixel Meta, partagés par index.html et merci.html.
// Rien ne se charge tant qu'un identifiant vaut A_REMPLACER, ni sans le consentement donné dans le bandeau.
var Suivi = (function(){
  var ID_GOOGLE_ANALYTICS = "A_REMPLACER";
  var ID_POSTHOG = "A_REMPLACER";
  var HOTE_POSTHOG = "https://eu.i.posthog.com";
  var ID_PIXEL_META = "1660164462081161";
  var PRIX = 129;
  var CLE = "ap-consentement", SIX_MOIS = 182 * 24 * 3600 * 1000;
  var ga = ID_GOOGLE_ANALYTICS.indexOf("A_REMPLACER") === -1;
  var posthog = ID_POSTHOG.indexOf("A_REMPLACER") === -1;
  var meta = ID_PIXEL_META.indexOf("A_REMPLACER") === -1;
  var actif = { audience: false, posthog: false, publicite: false };
  var vueEnAttente = false;

  function consentement(){
    try{ var c = JSON.parse(localStorage.getItem(CLE)); if(c && Date.now() - c.date < SIX_MOIS) return c; }catch(e){}
    return null;
  }
  function enregistrer(c){
    c.date = Date.now();
    try{ localStorage.setItem(CLE, JSON.stringify(c)); }catch(e){}
  }
  function charger(src){
    var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s);
  }
  // PostHog : chargement direct, sans npm ni bundler. Le tableau `_i` met en file
  // les appels émis avant l'arrivée du script, puis la librairie les rejoue.
  function chargerPostHog(){
    var p = window.posthog = window.posthog || [];
    if(p.__loaded) return;
    p._i = p._i || [];
    "init capture identify register reset opt_in_capturing opt_out_capturing".split(" ").forEach(function(m){
      p[m] = p[m] || function(){ (p._i.push ? p : p._i).push([m].concat([].slice.call(arguments))); };
    });
    charger(HOTE_POSTHOG + "/static/array.js");
    p.init(ID_POSTHOG, {
      api_host: HOTE_POSTHOG,
      person_profiles: "identified_only",
      persistence: "localStorage+cookie",
      // Masquage : aucun texte saisi, aucun e-mail, aucune adresse ne sort du navigateur.
      mask_all_text: false,
      session_recording: { maskAllInputs: true, maskTextSelector: "[data-prive]" },
      autocapture: { url_allowlist: [], dom_event_allowlist: ["click"] },
      capture_pageview: true,
      disable_surveys: true
    });
  }
  // Coupe PostHog quand la cliente retire son consentement : l'appel efface aussi
  // les identifiants stockés côté navigateur.
  function couperPostHog(){
    if(window.posthog && window.posthog.opt_out_capturing){
      try{ window.posthog.opt_out_capturing(); }catch(e){}
    }
  }
  function activer(c){
    if(c.audience && ga && !actif.audience){
      actif.audience = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ dataLayer.push(arguments); };
      gtag("js", new Date());
      gtag("config", ID_GOOGLE_ANALYTICS, { cookie_expires: 395 * 24 * 3600 });
      charger("https://www.googletagmanager.com/gtag/js?id=" + ID_GOOGLE_ANALYTICS);
    }
    if(c.audience && posthog && !actif.posthog){
      actif.posthog = true;
      chargerPostHog();
      setTimeout(envoyerVueProduit, 600);
    }
    if(c.publicite && meta && !actif.publicite){
      actif.publicite = true;
      var f = window.fbq = function(){ f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
      if(!window._fbq) window._fbq = f;
      f.push = f; f.loaded = true; f.version = "2.0"; f.queue = [];
      charger("https://connect.facebook.net/fr_FR/fbevents.js");
      fbq("init", ID_PIXEL_META);
      fbq("track", "PageView");
    }
  }
  // nomMeta vide : rien n'est envoyé à Meta. idCommande permet à Google de ne compter un achat qu'une fois.
  function evenement(nomMeta, nomGoogle, idCommande){
    if(actif.publicite && nomMeta){
      fbq("track", nomMeta, { value: PRIX, currency: "EUR", content_ids: ["lumina-regard"], content_type: "product" }, idCommande ? { eventID: idCommande } : {});
    }
    if(actif.audience){
      var donnees = { currency: "EUR", value: PRIX, items: [{ item_id: "lumina-regard", item_name: "Lumina Regard", price: PRIX, quantity: 1 }] };
      if(idCommande) donnees.transaction_id = idCommande;
      gtag("event", nomGoogle, donnees);
    }
    // PostHog reçoit le même signal, avec store_id pour séparer les boutiques.
    // L'achat confirmé vient du webhook Stripe côté serveur ; celui-ci n'est
    // qu'un signal de navigation et porte $insert_id pour être dédupliqué.
    if(actif.posthog && window.posthog && window.posthog.capture){
      var props = { store_id: "anderson-paris", value: PRIX, currency: "EUR", product_id: "lumina-regard" };
      if(idCommande){ props.order_id = idCommande; props.$insert_id = nomGoogle + ":" + idCommande; }
      window.posthog.capture(nomGoogle, props);
    }
  }
  // Vue de la fiche produit — PostHog uniquement. Rejouée si le consentement
  // arrive après le chargement de la page (activer() la redéclenche).
  function vueProduit(){
    vueEnAttente = true;
    envoyerVueProduit();
  }
  function envoyerVueProduit(){
    if(!vueEnAttente || !actif.posthog) return;
    if(!(window.posthog && window.posthog.capture)) return;
    vueEnAttente = false;
    window.posthog.capture("product_view", {
      store_id: "anderson-paris", product_id: "lumina-regard", value: PRIX, currency: "EUR"
    });
  }
  return {
    configure: ga || posthog || meta,
    consentement: consentement,
    enregistrer: enregistrer,
    activer: activer,
    couper: couperPostHog,
    vueProduit: vueProduit,
    evenement: evenement
  };
})();
