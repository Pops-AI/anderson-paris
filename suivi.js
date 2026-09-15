// Traceurs Google Analytics et pixel Meta, partagés par index.html et merci.html.
// Rien ne se charge tant qu'un identifiant vaut A_REMPLACER, ni sans le consentement donné dans le bandeau.
var Suivi = (function(){
  var ID_GOOGLE_ANALYTICS = "A_REMPLACER";
  var ID_PIXEL_META = "1660164462081161";
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
  }
  return {
    configure: ga || meta,
    consentement: consentement,
    enregistrer: enregistrer,
    activer: activer,
    evenement: evenement
  };
})();
