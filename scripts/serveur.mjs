// Serveur local sans dépendance, qui reproduit les cleanUrls de vercel.json (/cgv -> cgv.html).
// node scripts/serveur.mjs  ->  http://localhost:8000
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 8000;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

async function resoudre(url) {
  let chemin = decodeURIComponent(new URL(url, "http://localhost").pathname);
  if (chemin === "/") chemin = "/index.html";
  else if (!extname(chemin)) chemin += ".html";
  const complet = normalize(join(RACINE, chemin));
  if (!complet.startsWith(RACINE)) return null;
  try {
    return (await stat(complet)).isFile() ? complet : null;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const fichier = await resoudre(req.url);
  if (!fichier) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(fichier)] ?? "application/octet-stream" });
  res.end(await readFile(fichier));
}).listen(PORT, () => console.log(`Anderson Paris en local : http://localhost:${PORT}`));
