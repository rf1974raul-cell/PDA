// "¿Te fue útil?" y contacto por WhatsApp al final de cada artículo
(function () {
  var box = document.querySelector(".util"); if (!box) return;
  var slug = box.getAttribute("data-slug"), title = box.getAttribute("data-title"), KEY = "pda_util_" + slug;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var voted = get(KEY), counts = null;
  var btns = box.querySelectorAll("[data-v]"), res = box.querySelector(".util-res"), fol = box.querySelector(".util-follow");
  var msg = encodeURIComponent("Hola, Asistente PDA. Leí su artículo «" + title + "» y tengo una duda sobre mi caso.");
  box.querySelectorAll(".util-wa").forEach(function (a) { a.href = "https://wa.me/" + a.getAttribute("data-num") + "?text=" + msg; });
  function paint() {
    btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-v") === voted ? "true" : "false"); });
    var t = "";
    if (counts && counts.si >= 3) t = "A " + counts.si + " personas les fue útil.";
    if (voted === "si") t = "¡Gracias por tu voto! " + t;
    if (voted === "no") t = "Gracias por decirnos. Lo vamos a mejorar.";
    res.textContent = t;
    fol.hidden = !voted;
    fol.querySelector(".util-q").textContent = voted === "no" ? "¿Qué te faltó? Cuéntanos tu caso y te respondemos en privado." : "¿Te quedó alguna duda sobre tu caso? Te respondemos en privado.";
  }
  fetch("/api/util?slug=" + encodeURIComponent(slug), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j && typeof j.si === "number") { counts = j; paint(); } }).catch(function () {});
  btns.forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-v"); if (v === voted) return;
      var prev = voted; voted = v; set(KEY, v);
      if (counts) { counts[v]++; if (prev) counts[prev] = Math.max(0, counts[prev] - 1); }
      paint();
      fetch("/api/util", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: slug, voto: v, prev: prev }) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && typeof j.si === "number") { counts = j; paint(); } }).catch(function () {});
    });
  });
  paint();
})();
