// Traceurs PostHog et pixel Meta, partagés par index.html et merci.html.
// PostHog remplace Google Analytics : mesure d'audience, heatmaps et
// enregistrements de session dans un seul outil, hébergé dans l'UE.
// Rien ne se charge sans le consentement donné dans le bandeau.
var Suivi = (function(){
  var ID_POSTHOG = "phc_tKVSrAT4x6bARoM6F2t93CdSpzHonhNtuoETMmSe27qM";
  var HOTE_POSTHOG = "https://eu.i.posthog.com";
  var ID_PIXEL_META = "1660164462081161";
  var PRIX = 129;
  var CLE = "ap-consentement", SIX_MOIS = 182 * 24 * 3600 * 1000;
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
  // PostHog : chargement direct, sans npm ni bundler.
  // Deux files distinctes, imposées par array.js :
  //   `_i`  reçoit UNE entrée [jeton, configuration, nom] — la librairie la relit
  //         pour appeler init() avec la bonne signature ;
  //   `p`   lui-même reçoit les appels [methode, arguments...] émis avant l'arrivée
  //         du script, rejoués ensuite par _execute_array().
  // Mettre init() dans `_i` au même format que les autres méthodes ferait arriver
  // le jeton à la place de la configuration : la librairie lèverait une exception
  // et pas un seul événement ne partirait.
  function chargerPostHog(){
    var p = window.posthog = window.posthog || [];
    if(p.__loaded) return;
    p._i = p._i || [];
    p.people = p.people || [];
    p.__SV = 1;
    "capture identify register reset opt_in_capturing opt_out_capturing".split(" ").forEach(function(m){
      p[m] = p[m] || function(){ p.push([m].concat([].slice.call(arguments))); };
    });
    charger(HOTE_POSTHOG + "/static/array.js");
    p._i.push([ID_POSTHOG, {
      api_host: HOTE_POSTHOG,
      person_profiles: "identified_only",
      persistence: "localStorage+cookie",
      // Masquage : aucun texte saisi, aucun e-mail, aucune adresse ne sort du navigateur.
      mask_all_text: false,
      session_recording: { maskAllInputs: true, maskTextSelector: "[data-prive]" },
      // Autocapture limité aux clics sur les éléments interactifs : assez pour
      // les heatmaps et les parcours, sans enregistrer chaque survol.
      // Pas d'url_allowlist : une liste vide couperait l'autocapture partout.
      autocapture: {
        dom_event_allowlist: ["click"],
        element_allowlist: ["a", "button"],
        element_attribute_ignorelist: ["aria-label", "title"]
      },
      capture_pageview: true,
      disable_surveys: true
    }, "posthog"]);
  }
  // Coupe PostHog quand la cliente retire son consentement : l'appel efface aussi
  // les identifiants stockés côté navigateur.
  function couperPostHog(){
    if(window.posthog && window.posthog.opt_out_capturing){
      try{ window.posthog.opt_out_capturing(); }catch(e){}
    }
  }
  // Efface toute trace laissee par PostHog dans le navigateur : cookie ph_… porteur
  // du distinct_id (12 mois) et les cles jumelles de localStorage. opt_out_capturing()
  // ne les retire pas, et array.js reecrit le cookie apres coup : la purge est donc
  // rejouee au chargement suivant tant que la mesure d'audience est refusee.
  function purgerPostHog(){
    var domaine = location.hostname.replace(/^www\./, "");
    document.cookie.split(";").forEach(function(c){
      var nom = c.split("=")[0].trim();
      if(nom.indexOf("ph_") !== 0) return;
      document.cookie = nom + "=; max-age=0; path=/";
      document.cookie = nom + "=; max-age=0; path=/; domain=." + domaine;
    });
    try{
      Object.keys(localStorage).forEach(function(k){
        if(k.indexOf("ph_") === 0 || k.indexOf("__ph_opt_in_out_") === 0) localStorage.removeItem(k);
      });
    }catch(e){}
  }
  // Reprend la mesure apres un retrait : opt_out_capturing() ecrit un refus
  // persistant (__ph_opt_in_out_…), que le seul chargement de la librairie ne leve
  // pas. Sans cet appel, PostHog se charge mais n'emet plus rien. L'appel passe par
  // la file d'array.js quand la librairie n'est pas encore arrivee.
  // captureEventName: false — pas d'evenement $opt_in a chaque page.
  function reprendrePostHog(){
    try{ window.posthog.opt_in_capturing({ captureEventName: false }); }catch(e){}
  }
  function activer(c){
    // Refus (initial ou apres retrait) : on repasse derriere array.js, qui a pu
    // reecrire le cookie ph_ juste avant le rechargement precedent.
    if(posthog && !c.audience) purgerPostHog();
    if(c.audience && posthog && !actif.posthog){
      actif.posthog = true;
      chargerPostHog();
      reprendrePostHog();
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
  // nomMeta vide : rien n'est envoyé à Meta. idCommande déduplique l'achat.
  function evenement(nomMeta, nomEvenement, idCommande){
    if(actif.publicite && nomMeta){
      fbq("track", nomMeta, { value: PRIX, currency: "EUR", content_ids: ["lumina-regard"], content_type: "product" }, idCommande ? { eventID: idCommande } : {});
    }
    // PostHog reçoit le même signal, avec store_id pour séparer les boutiques.
    // L'achat confirmé vient du webhook Stripe côté serveur ; celui-ci n'est
    // qu'un signal de navigation et porte $insert_id pour être dédupliqué.
    if(actif.posthog && window.posthog && window.posthog.capture){
      var props = { store_id: "anderson-paris", value: PRIX, currency: "EUR", product_id: "lumina-regard" };
      if(idCommande){ props.order_id = idCommande; props.$insert_id = nomEvenement + ":" + idCommande; }
      window.posthog.capture(nomEvenement, props);
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
    configure: posthog || meta,
    consentement: consentement,
    enregistrer: enregistrer,
    activer: activer,
    couper: couperPostHog,
    purger: purgerPostHog,
    vueProduit: vueProduit,
    evenement: evenement
  };
})();
