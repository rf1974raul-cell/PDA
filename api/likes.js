const { redis, configured, clientIp } = require("./_redis");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!configured()) return res.status(503).json({ error: "storage_not_configured" });
  try {
    if (req.method === "GET") {
      const n = Number(await redis(["GET", "pda:likes"])) || 0;
      return res.status(200).json({ count: Math.max(0, n) });
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      // Máximo 20 cambios de me gusta por minuto por persona
      const key = "pda:rl:like:" + clientIp(req);
      const hits = await redis(["INCR", key]);
      if (hits === 1) await redis(["EXPIRE", key, "60"]);
      if (hits > 20) return res.status(429).json({ error: "rate_limited" });
      let n = await redis([body.action === "unlike" ? "DECR" : "INCR", "pda:likes"]);
      if (n < 0) { await redis(["SET", "pda:likes", "0"]); n = 0; }
      return res.status(200).json({ count: n });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    return res.status(500).json({ error: "storage_error" });
  }
};
