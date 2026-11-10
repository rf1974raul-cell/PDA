// "¿Te fue útil este artículo?": cuenta votos 👍/👎 por artículo.
const { redis, configured, clientIp } = require("./_redis");
const SLUG = /^[a-z0-9-]{3,80}$/;
const key = (slug, v) => "pda:util:" + slug + ":" + v;

async function counts(slug) {
  const si = Number(await redis(["GET", key(slug, "si")])) || 0;
  const no = Number(await redis(["GET", key(slug, "no")])) || 0;
  return { si: Math.max(0, si), no: Math.max(0, no) };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!configured()) return res.status(503).json({ error: "storage_not_configured" });
  try {
    if (req.method === "GET") {
      const slug = String((req.query && req.query.slug) || "");
      if (!SLUG.test(slug)) return res.status(400).json({ error: "invalid" });
      return res.status(200).json(await counts(slug));
    }
    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const slug = String(b.slug || ""), v = b.voto, prev = b.prev;
      if (!SLUG.test(slug) || (v !== "si" && v !== "no")) return res.status(400).json({ error: "invalid" });
      // Máximo 30 votos por minuto por persona
      const rl = "pda:rl:util:" + clientIp(req);
      const hits = await redis(["INCR", rl]);
      if (hits === 1) await redis(["EXPIRE", rl, "60"]);
      if (hits > 30) return res.status(429).json({ error: "rate_limited" });
      await redis(["INCR", key(slug, v)]);
      if ((prev === "si" || prev === "no") && prev !== v) {
        const n = await redis(["DECR", key(slug, prev)]);
        if (n < 0) await redis(["SET", key(slug, prev), "0"]);
      }
      return res.status(200).json(await counts(slug));
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    return res.status(500).json({ error: "storage_error" });
  }
};
