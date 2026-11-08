// Conexión a Upstash Redis (se configura sola al conectar "Upstash for Redis" en Vercel → Storage)
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

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
