// Traceurs Google Analytics et pixel Meta, partagés par index.html et merci.html.
// Rien ne se charge tant qu'un identifiant vaut A_REMPLACER, ni sans le consentement donné dans le bandeau.
var Suivi = (function(){
  var ID_GOOGLE_ANALYTICS = "A_REMPLACER";
  var ID_PIXEL_META = "A_REMPLACER";
  var PRIX = 129;
  var CLE = "ap-consentement", SIX_MOIS = 182 * 24 * 3600 * 1000;
  var ga = ID_GOOGLE_ANALYTICS.indexOf("A_REMPLACER") === -1;
  var meta = ID_PIXEL_META.indexOf("A_REMPLACER") === -1;
  var actif = { audience: false, publicite: false };

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
  function activer(c){
    if(c.audience && ga && !actif.audience){
      actif.audience = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ dataLayer.push(arguments); };
      gtag("js", new Date());
      gtag("config", ID_GOOGLE_ANALYTICS, { cookie_expires: 395 * 24 * 3600 });
      charger("https://www.googletagmanager.com/gtag/js?id=" + ID_GOOGLE_ANALYTICS);
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
  // idCommande sert à Meta et Google pour ne compter qu'une fois un achat vu par le navigateur et par le serveur.
  function evenement(nomMeta, nomGoogle, idCommande){
    if(actif.publicite){
      fbq("track", nomMeta, { value: PRIX, currency: "EUR", content_ids: ["lumina-regard"], content_type: "product" }, idCommande ? { eventID: idCommande } : {});
    }
    if(actif.audience){
      var donnees = { currency: "EUR", value: PRIX, items: [{ item_id: "lumina-regard", item_name: "Lumina Regard", price: PRIX, quantity: 1 }] };
      if(idCommande) donnees.transaction_id = idCommande;
      gtag("event", nomGoogle, donnees);
    }
  }
  function cookie(nom){
    var m = document.cookie.match(new RegExp("(?:^|; )" + nom + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }
  // Référence transmise à Stripe (client_reference_id), relue par api/stripe-webhook.js.
  // Elle n'existe que si la publicité est acceptée : sans elle, le serveur n'envoie rien à Meta.
  // Format : m1_<cookie _fbp>_<cookie _fbc>, points remplacés par des tirets (Stripe refuse les points).
  function referenceCommande(){
    if(!actif.publicite) return "";
    var fbp = cookie("_fbp"), fbc = cookie("_fbc");
    var ref = "m1_" + (fbp ? fbp.replace(/\./g, "-") : "0") + "_" + (fbc ? fbc.replace(/^fb\.(\d)\.(\d+)\./, "fb-$1-$2-") : "0");
    if(ref.length > 200 || !/^[A-Za-z0-9_-]+$/.test(ref)) ref = "m1_" + (fbp ? fbp.replace(/\./g, "-") : "0") + "_0";
    return /^[A-Za-z0-9_-]+$/.test(ref) ? ref : "m1_0_0";
  }

  return {
    configure: ga || meta,
    consentement: consentement,
    enregistrer: enregistrer,
    activer: activer,
    evenement: evenement,
    referenceCommande: referenceCommande
  };
})();
