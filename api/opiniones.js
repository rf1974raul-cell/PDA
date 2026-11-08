const { redis, configured, clientIp } = require("./_redis");

const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!configured()) return res.status(503).json({ error: "storage_not_configured" });
  try {
    if (req.method === "GET") {
      const raw = (await redis(["LRANGE", "pda:opiniones", "0", "99"])) || [];
      const opiniones = raw.map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
      return res.status(200).json({ opiniones });
    }
    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      if (b.web) return res.status(200).json({ ok: true }); // trampa para robots
      const op = {
        nombre: clean(b.nombre, 40),
        ciudad: clean(b.ciudad, 40),
        estrellas: Math.min(5, Math.max(1, Math.round(Number(b.estrellas) || 0))),
        texto: clean(b.texto, 500),
        t: Date.now()
      };
      if (op.nombre.length < 2 || op.texto.length < 10 || !Number(b.estrellas)) return res.status(400).json({ error: "invalid" });
      // Una opinión por minuto por persona
      const ok = await redis(["SET", "pda:rl:op:" + clientIp(req), "1", "EX", "60", "NX"]);
      if (!ok) return res.status(429).json({ error: "rate_limited" });
      await redis(["LPUSH", "pda:opiniones", JSON.stringify(op)]);
      await redis(["LTRIM", "pda:opiniones", "0", "499"]);
      return res.status(201).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    return res.status(500).json({ error: "storage_error" });
  }
};
