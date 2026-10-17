// ============================================================
//  불꽃놀이 캔버스 애니메이션 (인트로) + 색종이 (완료 화면)
// ============================================================

(function () {
  const COLORS = ["#fbbf24", "#f472b6", "#8b5cf6", "#38bdf8", "#34d399", "#fb7185", "#fff"];
  const rand = (min, max) => Math.random() * (max - min) + min;

  // ---------- 불꽃놀이 ----------
  function startFireworks(canvas) {
    const ctx = canvas.getContext("2d");
    let rockets = [];
    let particles = [];
    let running = true;
    let lastLaunch = 0;

    function resize() {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    // 재진입 시 리스너가 누적되지 않도록 stop()에서 함께 정리
    const section = canvas.closest("section");
    const onPointerDown = (e) => {
      if (e.target.closest("button")) return;
      launch(e.clientX);
    };
    section.addEventListener("pointerdown", onPointerDown);

    const W = () => canvas.clientWidth;
    const H = () => canvas.clientHeight;

    function launch(x) {
      if (window.JiaSound) JiaSound.launch();
      rockets.push({
        x: x !== undefined ? x : rand(W() * 0.15, W() * 0.85),
        y: H(),
        vx: rand(-0.6, 0.6),
        vy: rand(-11, -8.5),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        trail: [],
      });
    }

    function explode(x, y, color) {
      if (window.JiaSound) JiaSound.boom();
      const count = 60 + ((Math.random() * 40) | 0);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + rand(-0.08, 0.08);
        const speed = rand(1.2, 5.2);
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: rand(50, 90),
          maxLife: 90,
          color: Math.random() < 0.75 ? color : COLORS[(Math.random() * COLORS.length) | 0],
          size: rand(1.4, 2.6),
        });
      }
    }

    function tick(now) {
      if (!running) return;
      requestAnimationFrame(tick);

      // 잔상 효과
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(0, 0, W(), H());
      ctx.globalCompositeOperation = "lighter";

      if (now - lastLaunch > rand(500, 1100)) {
        launch();
        lastLaunch = now;
      }

      rockets = rockets.filter((r) => {
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.12;
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 8) r.trail.shift();

        ctx.beginPath();
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();
        r.trail.forEach((t, i) => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 220, 160, ${i / r.trail.length * 0.5})`;
          ctx.fill();
        });

        if (r.vy >= -1.5) {
          explode(r.x, r.y, r.color);
          return false;
        }
        return true;
      });

      particles = particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045;
        p.vx *= 0.985;
        p.life--;

        ctx.globalAlpha = Math.max(p.life / p.maxLife, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;

        return p.life > 0 && p.y < H() + 10;
      });
    }

    // 처음에 축포 몇 발
    setTimeout(() => launch(W() * 0.3), 300);
    setTimeout(() => launch(W() * 0.7), 700);
    setTimeout(() => launch(W() * 0.5), 1100);
    requestAnimationFrame(tick);

    return {
      stop() {
        running = false;
        window.removeEventListener("resize", resize);
        section.removeEventListener("pointerdown", onPointerDown);
      },
    };
  }

  // ---------- 색종이 (완료 화면) ----------
  function startConfetti(canvas) {
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    const W = canvas.clientWidth, H = canvas.clientHeight;

    const pieces = Array.from({ length: 120 }, () => ({
      x: rand(0, W),
      y: rand(-H, 0),
      w: rand(6, 11),
      h: rand(8, 16),
      vy: rand(1.2, 3),
      vx: rand(-0.6, 0.6),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.08, 0.08),
      color: COLORS[(Math.random() * COLORS.length) | 0],
    }));

    let running = true;
    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);
      ctx.clearRect(0, 0, W, H);
      pieces.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.02) * 0.6;
        p.rot += p.vr;
        if (p.y > H + 20) { p.y = -20; p.x = rand(0, W); }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
    }
    tick();
    return { stop() { running = false; } };
  }

  window.JiaFX = { startFireworks, startConfetti };
})();
