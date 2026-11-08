// Conexión a Upstash Redis. Se configura sola al conectar "Upstash for Redis"
// en Vercel → Storage. Acepta cualquier prefijo que Vercel le ponga a las variables.
function findEnv(suffixes, exclude) {
  const keys = Object.keys(process.env);
  for (const suf of suffixes) {
    const k = keys.find(k => k.endsWith(suf) && !(exclude && k.includes(exclude)) && process.env[k]);
    if (k) return process.env[k];
  }
  return "";
}
const URL_ = findEnv(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "REDIS_REST_URL"]);
const TOKEN = findEnv(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN", "REDIS_REST_TOKEN"], "READ_ONLY");

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const configured = () => Boolean(URL_ && TOKEN);
const clientIp = req => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";

module.exports = { redis, configured, clientIp };
