// Vérification du site : règles de marque, cohérence entre pages, liens locaux.
// node scripts/verifier.mjs          -> rapport complet, code 1 si erreur
// node scripts/verifier.mjs --hook   -> mode hook Claude Code : lit le JSON sur stdin,
//                                       ne signale que le fichier modifié, code 2 si erreur
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODE_HOOK = process.argv.includes("--hook");

// Valeurs de référence. Toute modification ici doit être répercutée sur les quatre pages concernées.
const REFERENCE = {
  prix: 129,
  pays: ["France", "Belgique", "Luxembourg", "Suisse"],
  delai: "12 à 15 jours ouvrés",
};

const PAGES = ["index.html", "cgv.html", "retractation.html", "mentions-legales.html", "confidentialite.html", "merci.html", "guide-rituel.html", "guide-serums.html", "calendrier-rituel.html"];
const PAGES_LEGALES = PAGES.filter((p) => p !== "index.html");
const FEUILLES = ["style.css"];
const SCRIPTS = ["suivi.js"];

const INTERDITS = [
  [/Lumina\s+Pro/i, "« Lumina Pro » est l'ancien produit abandonné"],
  [/630\s*nm/i, "630 nm appartient à Lumina Pro (Lumina Regard = 660 nm)"],
  [/8\s?000\s*RPM/i, "8000 RPM appartient à Lumina Pro"],
  [/visage entier/i, "Lumina Regard traite le contour des yeux, jamais le visage entier"],
  [/maison parisienne/i, "jamais « maison parisienne » : le siège est à Toulouse"],
  [/[ée]tudes? cliniques?|cliniquement (prouvée?s?|testée?s?|démontrée?s?)|(prouvée?s?|testée?s?|démontrée?s?|validée?s?) cliniquement/i, "aucune étude clinique ne peut être citée"],
  [/\d[\d\s]*\s+(clientes|utilisatrices|femmes (conquises|satisfaites))/i, "preuve sociale inventée : zéro cliente à ce jour"],
  [/avis (clients|vérifiés)|★|⭐/i, "aucun avis client ne peut être affiché"],
  [/(fabriqué|conçu|développé|breveté)e?s? (en France|à Paris|par nos|par Anderson)|nos laboratoires|notre laboratoire/i, "aucune allégation de fabrication ni de conception : le produit est sourcé"],
];

const erreurs = [];
const avertissements = [];

function lire(fichier) {
  return readFileSync(join(RACINE, fichier), "utf8").replace(/[  ]/g, " ");
}

function numeroLigne(texte, position) {
  return texte.slice(0, position).split("\n").length;
}

function signaler(liste, fichier, texte, position, message) {
  liste.push({ fichier, ligne: position == null ? null : numeroLigne(texte, position), message });
}

const contenus = Object.fromEntries(
  [...PAGES, ...FEUILLES, ...SCRIPTS].filter((f) => existsSync(join(RACINE, f))).map((f) => [f, lire(f)])
);

for (const page of PAGES) {
  if (!contenus[page]) signaler(erreurs, page, "", null, "page manquante");
}

for (const [fichier, texte] of Object.entries(contenus)) {
  for (const [motif, message] of INTERDITS) {
    const trouve = new RegExp(motif.source, motif.flags + "g");
    for (const m of texte.matchAll(trouve)) signaler(erreurs, fichier, texte, m.index, `interdit — ${message} (« ${m[0].trim()} »)`);
  }

  for (const m of texte.matchAll(/border-radius\s*:\s*([^;}"]+)/gi)) {
    if (!/^0(px|%|rem|em)?\s*$/.test(m[1].trim())) signaler(erreurs, fichier, texte, m.index, `aucun arrondi autorisé (« ${m[0].trim()} »)`);
  }

  for (const m of texte.matchAll(/\[[^\]<]*(à compléter|à obtenir|à vérifier|à ajuster|à mettre à jour)[^\]<]*\]/gi)) {
    signaler(avertissements, fichier, texte, m.index, `champ à compléter : ${m[0].slice(0, 90)}`);
  }
}

for (const page of PAGES.filter((p) => contenus[p])) {
  const texte = contenus[page];

  if (!/<html lang="fr">/.test(texte)) signaler(erreurs, page, texte, 0, 'attribut <html lang="fr"> manquant');
  if (!/<title>[^<]+<\/title>/.test(texte)) signaler(erreurs, page, texte, 0, "<title> manquant");
  if (!/name="viewport"/.test(texte)) signaler(erreurs, page, texte, 0, "meta viewport manquante");

  for (const legale of ["/mentions-legales", "/cgv", "/confidentialite", "/retractation"]) {
    if (!texte.includes(`href="${legale}"`)) signaler(erreurs, page, texte, null, `lien de pied de page manquant vers ${legale}`);
  }

  for (const m of texte.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const chemin = m[1];
    if (chemin.startsWith("//")) continue;
    const cible = chemin === "/" ? "index.html" : extname(chemin) ? chemin.slice(1) : `${chemin.slice(1)}.html`;
    if (!existsSync(join(RACINE, cible))) signaler(erreurs, page, texte, m.index, `lien local cassé : ${chemin}`);
  }
}

if (contenus["index.html"]) {
  const texte = contenus["index.html"];

  const prixAffiches = [
    ...texte.matchAll(/class="prix"[^>]*>\s*(\d+) €/g),
    ...texte.matchAll(/data-cta[^>]*>[^<]*?(\d+) €/g),
    ...texte.matchAll(/class="ba-prix"[^>]*>\s*(\d+) €/g),
  ];
  if (prixAffiches.length === 0) signaler(erreurs, "index.html", texte, null, "aucun prix affiché trouvé");
  for (const m of prixAffiches) {
    if (Number(m[1]) !== REFERENCE.prix) signaler(erreurs, "index.html", texte, m.index, `prix ${m[1]} € différent de la référence ${REFERENCE.prix} €`);
  }

  const lien = texte.match(/LIEN_PAIEMENT\s*=\s*"([^"]*)"/);
  if (!lien || !lien[1].startsWith("https://buy.stripe.com/")) signaler(erreurs, "index.html", texte, lien?.index ?? null, "lien de paiement Stripe absent ou invalide");

  if (!/six minutes/i.test(texte)) signaler(erreurs, "index.html", texte, null, "durée du rituel (six minutes) introuvable");
}

if (contenus["cgv.html"] && !contenus["cgv.html"].includes(`${REFERENCE.prix} €`)) {
  signaler(erreurs, "cgv.html", contenus["cgv.html"], null, `prix de référence ${REFERENCE.prix} € absent des CGV`);
}

if (contenus["suivi.js"]) {
  const texte = contenus["suivi.js"];
  const prix = texte.match(/var PRIX = (\d+);/);
  if (!prix || Number(prix[1]) !== REFERENCE.prix) signaler(erreurs, "suivi.js", texte, prix?.index ?? null, `prix des achats envoyés à Meta et Google différent de ${REFERENCE.prix} €`);
}

for (const page of ["index.html", "cgv.html", "mentions-legales.html"].filter((p) => contenus[p])) {
  if (!/(n'est pas|ne constitue pas) (un )?dispositif médical/i.test(contenus[page])) {
    signaler(erreurs, page, contenus[page], null, "rappel « pas un dispositif médical » absent");
  }
}

for (const page of ["index.html", "cgv.html"].filter((p) => contenus[p])) {
  for (const pays of REFERENCE.pays) {
    if (!contenus[page].includes(pays)) signaler(erreurs, page, contenus[page], null, `pays de livraison absent : ${pays}`);
  }
}

if (contenus["cgv.html"]) {
  const texte = contenus["cgv.html"];
  for (const pays of REFERENCE.pays) {
    if (!new RegExp(`<th>${pays}[^<]*</th>`).test(texte)) signaler(erreurs, "cgv.html", texte, null, `délai de livraison absent du tableau de l'article 5 : ${pays}`);
  }
}

for (const page of ["index.html", "cgv.html", "merci.html"].filter((p) => contenus[p])) {
  const texte = contenus[page];
  const delais = [...texte.matchAll(/\d+ à \d+ jours ouvrés/g)];
  if (delais.length === 0) signaler(erreurs, page, texte, null, `délai de livraison introuvable (${REFERENCE.delai})`);
  for (const m of delais) {
    if (m[0] !== REFERENCE.delai) signaler(erreurs, page, texte, m.index, `délai « ${m[0]} » différent de la référence « ${REFERENCE.delai} »`);
  }
}

for (const [page, motifs] of [
  ["index.html", [/30 jours/, /2 ans/]],
  ["cgv.html", [/30 jours|trente jours/, /2 ans|deux ans/, /quatorze jours|14 jours/]],
  ["retractation.html", [/30 jours|trente jours/, /2 ans|deux ans/, /14 jours|quatorze jours/]],
]) {
  if (!contenus[page]) continue;
  for (const motif of motifs) {
    if (!motif.test(contenus[page])) signaler(erreurs, page, contenus[page], null, `garantie introuvable : ${motif.source}`);
  }
}

function formater({ fichier, ligne, message }) {
  return `  ${fichier}${ligne ? `:${ligne}` : ""}  ${message}`;
}

async function lireEntree() {
  let donnees = "";
  for await (const morceau of process.stdin) donnees += morceau;
  return donnees;
}

if (MODE_HOOK) {
  let fichierModifie = "";
  try {
    fichierModifie = JSON.parse(await lireEntree())?.tool_input?.file_path ?? "";
  } catch {}
  const nom = basename(fichierModifie.replace(/\\/g, "/"));
  if (!Object.hasOwn(contenus, nom)) process.exit(0);
  const concernees = erreurs.filter((e) => e.fichier === nom);
  if (concernees.length === 0) process.exit(0);
  process.stderr.write(`Vérification échouée pour ${nom} :\n${concernees.map(formater).join("\n")}\nCorrige ces points avant de continuer.\n`);
  process.exit(2);
}

if (avertissements.length) console.log(`A COMPLETER (${avertissements.length})\n${avertissements.map(formater).join("\n")}\n`);
if (erreurs.length) {
  console.log(`ERREURS (${erreurs.length})\n${erreurs.map(formater).join("\n")}`);
  process.exit(1);
}
console.log("OK — aucune erreur.");
