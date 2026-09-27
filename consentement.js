// Bandeau de consentement : interface et politique de recueil, seul appelant de suivi.js.
// Extrait du <script> inline de fin de page, où il était recopié à l'identique sur les
// sept pages qui portent le bandeau. Chargé après /suivi.js par une balise <script>.
// Ne rien charger sur merci.html : la page n'a pas le bandeau dans son DOM.
// Ajouter ?bandeau à l'adresse pour l'afficher avant d'avoir les identifiants.
(function(){
  if(!Suivi.configure && !/[?&]bandeau\b/.test(location.search)) return;
  var bandeau = document.querySelector(".consentement");
  var choix = bandeau.querySelector(".choix");
  var personnaliser = bandeau.querySelector('[data-choix="personnaliser"]');
  var lienGerer = document.querySelector(".lien-cookies");
  var cases = { audience: choix.querySelector('[name="audience"]'), publicite: choix.querySelector('[name="publicite"]') };

  // Le motif restreint l'effacement aux traceurs reellement retires : retirer la
  // publicite ne doit pas emporter le cookie PostHog d'une audience toujours consentie.
  function effacerCookies(motif){
    var domaine = location.hostname.replace(/^www\./, "");
    document.cookie.split(";").forEach(function(c){
      var nom = c.split("=")[0].trim();
      if(!motif.test(nom)) return;
      document.cookie = nom + "=; max-age=0; path=/";
      document.cookie = nom + "=; max-age=0; path=/; domain=." + domaine;
    });
  }
  function enregistrer(c){
    var avant = Suivi.consentement();
    Suivi.enregistrer(c);
    bandeau.hidden = true;
    if(!avant){ Suivi.activer(c); return; }
    if(avant.audience === c.audience && avant.publicite === c.publicite) return;
    var retraitAudience = avant.audience && !c.audience;
    var retraitPublicite = avant.publicite && !c.publicite;
    if(retraitAudience) Suivi.couper();
    // Le nettoyage est differe d'un tick : array.js reecrit le cookie ph_ juste
    // apres opt_out_capturing(), et un effacement synchrone passerait avant lui.
    // Suivi.purger() retire aussi les cles PostHog de localStorage, que le simple
    // effacement des cookies laissait en place (Suivi.activer le rejoue au
    // chargement suivant, par securite).
    if(retraitAudience || retraitPublicite){
      var motif = retraitAudience && retraitPublicite ? /^(_ga|_gid|_fbp|_fbc|ph_)/
                : retraitAudience ? /^(_ga|_gid|ph_)/ : /^(_fbp|_fbc)/;
      setTimeout(function(){
        effacerCookies(motif);
        if(retraitAudience) Suivi.purger();
        location.reload();
      }, 0);
      return;
    }
    location.reload();
  }
  function ouvrirChoix(){
    choix.hidden = false;
    personnaliser.textContent = "Enregistrer mes choix";
  }

  bandeau.addEventListener("click", function(e){
    var b = e.target.closest("[data-choix]");
    if(!b) return;
    var action = b.getAttribute("data-choix");
    if(action === "refuser") enregistrer({ audience: false, publicite: false });
    else if(action === "accepter") enregistrer({ audience: true, publicite: true });
    else if(choix.hidden) ouvrirChoix();
    else enregistrer({ audience: cases.audience.checked, publicite: cases.publicite.checked });
  });
  lienGerer.hidden = false;
  lienGerer.addEventListener("click", function(){
    var c = Suivi.consentement() || { audience: false, publicite: false };
    cases.audience.checked = c.audience;
    cases.publicite.checked = c.publicite;
    ouvrirChoix();
    bandeau.hidden = false;
  });

  var existant = Suivi.consentement();
  if(existant) Suivi.activer(existant); else bandeau.hidden = false;
})();
