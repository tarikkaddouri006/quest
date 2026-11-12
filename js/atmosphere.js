/* QUEST · js/atmosphere.js
   The living ground under the map: drifting contour lines and real daylight.
   The day/night shading is computed from the actual time (UTC), so the Pacific really is dark
   when it is night there. Pauses whenever the map is covered or the tab is hidden. */
window.QUEST = window.QUEST || {};
window.QUEST.Topo = (function () {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cv, ctx, view, W = 0, H = 0, dirty = true, paused = false, tz = 0, last = 0;

  const PRM = new Uint8Array(512);
  (() => { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = (Math.abs(Math.sin(i * 91.7) * 43758.5453) % 1) * (i + 1) | 0; [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) PRM[i] = p[i & 255]; })();
  const fd = t => t * t * (3 - 2 * t), lp = (a, b, t) => a + (b - a) * t, hv = (x, y, z) => PRM[(PRM[(PRM[x & 255] + y) & 511] + z) & 511] / 255;
  function noise(x, y, z) { const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = fd(x - X), fy = fd(y - Y), fz = fd(z - Z); return lp(lp(lp(hv(X, Y, Z), hv(X + 1, Y, Z), fx), lp(hv(X, Y + 1, Z), hv(X + 1, Y + 1, Z), fx), fy), lp(lp(hv(X, Y, Z + 1), hv(X + 1, Y, Z + 1), fx), lp(hv(X, Y + 1, Z + 1), hv(X + 1, Y + 1, Z + 1), fx), fy), fz); }

  function size() { W = innerWidth || 1280; H = innerHeight || 800; const d = Math.min(1.5, devicePixelRatio || 1); cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); dirty = true; }

  /* longitude (degrees east) where it is solar noon right now */
  function sunLon() { const d = new Date(); return (12 - (d.getUTCHours() + d.getUTCMinutes() / 60)) * 15; }

  function daylight(vb, s) {
    const sl = sunLon(), n = 32, sw = W / n;
    for (let i = 0; i < n; i++) {
      const lon = (vb.x + (i + .5) * sw * s) / 10 + 128;                       // map x → degrees east
      const d = Math.abs((((lon - sl) % 360) + 540) % 360 - 180);              // angle from the noon meridian
      const night = Math.max(0, Math.min(1, (d - 78) / 26));
      ctx.fillStyle = night > 0 ? `rgba(4,5,9,${(night * .5).toFixed(3)})` : `rgba(243,241,236,${((1 - d / 78) * .05).toFixed(3)})`;
      ctx.fillRect(i * sw, 0, sw + 1, H);
    }
  }

  function frame(n) {
    requestAnimationFrame(frame);
    if (paused || document.hidden) return;
    if (n - last < 90) return;
    if (RM && !dirty) return;
    if (!RM) tz += .003;
    last = n; dirty = false;
    const { vb, s } = view();
    const cell = 14, cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1, f = new Float32Array(cols * rows), sc = 1 / 28;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const wx = (vb.x + i * cell * s) * sc, wy = (vb.y + j * cell * s) * sc; f[j * cols + i] = noise(wx, wy, tz) * .7 + noise(wx * 2.3, wy * 2.3, tz * 1.6) * .3; }
    ctx.clearRect(0, 0, W, H);
    daylight(vb, s);
    ctx.lineWidth = .7;
    for (let k = 1; k < 9; k++) {
      const lv = k / 9; ctx.strokeStyle = `rgba(243,241,236,${k % 4 === 0 ? .16 : .07})`; ctx.beginPath();
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
        const a = f[j * cols + i], b = f[j * cols + i + 1], c = f[(j + 1) * cols + i + 1], d = f[(j + 1) * cols + i];
        const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0); if (idx === 0 || idx === 15) continue;
        const x = i * cell, y = j * cell, T = [x + cell * (lv - a) / (b - a), y], R = [x + cell, y + cell * (lv - b) / (c - b)], B = [x + cell * (lv - d) / (c - d), y + cell], L = [x, y + cell * (lv - a) / (d - a)];
        const sg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
        switch (idx) { case 1: case 14: sg(L, B); break; case 2: case 13: sg(B, R); break; case 3: case 12: sg(L, R); break; case 4: case 11: sg(T, R); break; case 5: sg(L, T); sg(B, R); break; case 6: case 9: sg(T, B); break; case 7: case 8: sg(L, T); break; case 10: sg(T, R); sg(L, B); break; }
      }
      ctx.stroke();
    }
  }

  return {
    init(canvas, getView) { cv = canvas; ctx = cv.getContext('2d'); view = getView; size(); requestAnimationFrame(frame); },
    size, dirty() { dirty = true; },
    pause(v) { paused = !!v; if (!v) dirty = true; }
  };
})();
