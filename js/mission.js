// ============================================================
//  Jia's Secret HQ — 파티 당일 미션 게임 엔진
//  (초대장 첫 화면의 이스터에그로 열림 — main.js 참고)
// ============================================================

(function () {
  const M = MISSION_CONFIG;
  const KEY = "jia_hq_progress"; // localStorage: 진행 상태 저장
  let body = null;

  // ?reset 으로 열면 진행 상태 초기화 (부모용)
  if (location.search.includes("reset")) localStorage.removeItem(KEY);

  const norm = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");

  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { screen: "pin" }; }
    catch (e) { return { screen: "pin" }; }
  }
  function saveState(st) { localStorage.setItem(KEY, JSON.stringify(st)); }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function render(st) {
    saveState(st);
    body.innerHTML = "";
    if (st.screen === "pin") return renderPin(st);
    if (st.screen === "brief") return renderBrief(st);
    if (st.screen === "mission") return renderMission(st);
    if (st.screen === "clue") return renderClue(st);
    if (st.screen === "gate") return renderGate(st);
    if (st.screen === "final") return renderFinal(st);
  }

  // ---------- PIN 입장 ----------
  function renderPin(st) {
    body.appendChild(el("p", "hq-text", "Enter the agent access code:"));
    const dots = el("div", "pin-dots");
    const dotEls = [];
    for (let i = 0; i < M.pin.length; i++) {
      const d = el("span", "pin-dot");
      dots.appendChild(d);
      dotEls.push(d);
    }
    body.appendChild(dots);

    let entered = "";
    const pad = el("div", "pin-pad");
    "123456789⌫0✓".split("").forEach((k) => {
      const b = el("button", "pin-key", k);
      b.addEventListener("click", () => {
        if (k === "⌫") entered = entered.slice(0, -1);
        else if (k === "✓") {
          if (entered === M.pin) return render({ screen: "brief" });
          dots.classList.add("shake");
          setTimeout(() => dots.classList.remove("shake"), 450);
          entered = "";
        } else if (entered.length < M.pin.length) entered += k;
        dotEls.forEach((d, i) => d.classList.toggle("on", i < entered.length));
      });
      pad.appendChild(b);
    });
    body.appendChild(pad);
  }

  // ---------- 브리핑 ----------
  function renderBrief(st) {
    const box = el("div", "hq-card");
    M.briefing.forEach((line, i) => {
      const p = el("p", "hq-brief-line", line);
      p.style.animationDelay = `${i * 0.7}s`;
      box.appendChild(p);
    });
    body.appendChild(box);
    const btn = el("button", "btn btn-hq", "ACCEPT MISSION ▶");
    btn.style.animationDelay = `${M.briefing.length * 0.7}s`;
    btn.classList.add("hq-brief-line");
    btn.addEventListener("click", () => render({ screen: "mission", idx: 0 }));
    body.appendChild(btn);
  }

  // ---------- 미션 공통 ----------
  function completeMission(st) {
    if (st.idx === M.missions.length - 1) return render({ screen: "final" });
    render({ screen: "clue", idx: st.idx });
  }

  function renderMission(st) {
    const ms = M.missions[st.idx];
    body.appendChild(el("p", "hq-progress", `MISSION ${st.idx + 1} / ${M.missions.length}`));
    body.appendChild(el("h3", "hq-mission-title", ms.title));
    body.appendChild(el("p", "hq-text", ms.intro));
    if (ms.kind === "maze") renderMaze(st, ms);
    if (ms.kind === "code") renderCode(st, ms);
    if (ms.kind === "simon") renderSimon(st, ms);
  }

  // ---------- 성공 → 봉투 힌트 ----------
  function renderClue(st) {
    const ms = M.missions[st.idx];
    body.appendChild(el("div", "hq-stamp", "✔ MISSION CLEARED"));
    const card = el("div", "hq-card hq-clue");
    card.appendChild(el("p", null, ms.clue));
    body.appendChild(card);
    const btn = el("button", "btn btn-hq", "We found the envelope! ▶");
    btn.addEventListener("click", () => render({ screen: "gate", idx: st.idx }));
    body.appendChild(btn);
  }

  // ---------- 봉투 코드 입력 → 다음 미션 ----------
  function renderGate(st) {
    const ms = M.missions[st.idx];
    body.appendChild(el("h3", "hq-mission-title", "🔒 SECURITY CHECK"));
    body.appendChild(el("p", "hq-text", ms.gatePrompt));
    const input = el("input", "hq-input");
    input.placeholder = "SECRET WORD";
    input.autocapitalize = "characters";
    body.appendChild(input);
    const err = el("p", "hq-error hidden", "Hmm, that's not it. Check the envelope again!");
    body.appendChild(err);
    const btn = el("button", "btn btn-hq", "UNLOCK ▶");
    btn.addEventListener("click", () => {
      if (norm(input.value) === norm(ms.gateCode)) {
        render({ screen: "mission", idx: st.idx + 1 });
      } else {
        err.classList.remove("hidden");
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 450);
      }
    });
    body.appendChild(btn);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
  }

  // ---------- 최종 ----------
  function renderFinal(st) {
    body.appendChild(el("div", "hq-stamp hq-stamp-final", "★ ALL MISSIONS CLEARED ★"));
    const card = el("div", "hq-card hq-final");
    M.final.message.split("\n").forEach((line) => card.appendChild(el("p", null, line)));
    body.appendChild(card);
    const combo = el("div", "hq-combo");
    [...M.final.lockCode].forEach((d) => combo.appendChild(el("span", "hq-digit", d)));
    body.appendChild(combo);
    // 축하 색종이
    const cv = el("canvas", "hq-confetti");
    document.querySelector("#stage-mission").appendChild(cv);
    JiaFX.startConfetti(cv);
  }

  // ---------- 미션: 안개 미로 ----------
  function renderMaze(st, ms) {
    const grid = ms.maze.map((r) => [...r]);
    const H = grid.length, W = grid[0].length;
    let py, px;
    grid.forEach((row, y) => row.forEach((c, x) => { if (c === "S") { py = y; px = x; } }));
    const visited = new Set([`${py},${px}`]);

    const wrap = el("div", "maze-wrap");
    const cv = el("canvas", "maze-canvas");
    wrap.appendChild(cv);
    body.appendChild(wrap);

    const ctx = cv.getContext("2d");
    const CELL = Math.min(26, Math.floor(Math.min(340, window.innerWidth - 70) / W));
    cv.width = W * CELL * devicePixelRatio;
    cv.height = H * CELL * devicePixelRatio;
    cv.style.width = W * CELL + "px";
    cv.style.height = H * CELL + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    function draw() {
      ctx.clearRect(0, 0, W * CELL, H * CELL);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const seen = visited.has(`${y},${x}`);
          const near = Math.abs(y - py) + Math.abs(x - px) <= 2;
          if (!seen && !near) {
            // 안개
            ctx.fillStyle = "#0d0a1e";
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            continue;
          }
          const c = grid[y][x];
          ctx.fillStyle = c === "#" ? "#4c2a8f" : "#1c1440";
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          if (c === "K") {
            ctx.font = `${CELL * 0.7}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🔑", x * CELL + CELL / 2, y * CELL + CELL / 2 + 1);
          }
        }
      }
      // 플레이어
      ctx.font = `${CELL * 0.72}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🔦", px * CELL + CELL / 2, py * CELL + CELL / 2 + 1);
    }

    function move(dy, dx) {
      const ny = py + dy, nx = px + dx;
      if (grid[ny] === undefined || grid[ny][nx] === "#") {
        wrap.classList.add("shake");
        setTimeout(() => wrap.classList.remove("shake"), 300);
        return;
      }
      py = ny; px = nx;
      visited.add(`${py},${px}`);
      draw();
      if (grid[py][px] === "K") setTimeout(() => completeMission(st), 450);
    }

    const pad = el("div", "dpad");
    [["↑", -1, 0], ["←", 0, -1], ["→", 0, 1], ["↓", 1, 0]].forEach(([label, dy, dx]) => {
      const b = el("button", `dpad-btn dpad-${label === "↑" ? "up" : label === "↓" ? "down" : label === "←" ? "left" : "right"}`, label);
      b.addEventListener("click", () => move(dy, dx));
      pad.appendChild(b);
    });
    body.appendChild(pad);
    draw();
  }

  // ---------- 미션: 코드/수수께끼 입력 ----------
  function renderCode(st, ms) {
    if (ms.body) {
      const card = el("div", "hq-card hq-puzzle");
      ms.body.split("\n").forEach((line) => card.appendChild(el("p", null, line || " ")));
      body.appendChild(card);
    }
    const input = el("input", "hq-input");
    input.placeholder = "YOUR ANSWER";
    input.autocapitalize = "characters";
    body.appendChild(input);
    const err = el("p", "hq-error hidden", "Not quite — put your heads together and try again!");
    body.appendChild(err);
    const btn = el("button", "btn btn-hq", "SUBMIT ▶");
    btn.addEventListener("click", () => {
      if (norm(input.value) === norm(ms.answer)) {
        completeMission(st);
      } else {
        err.classList.remove("hidden");
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 450);
      }
    });
    body.appendChild(btn);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
  }

  // ---------- 미션: 반딧불 기억 게임 (시몬) ----------
  function renderSimon(st, ms) {
    const COLORS = ["#8b5cf6", "#f472b6", "#38bdf8", "#fbbf24"];
    let seq = [];
    let inputPos = 0;
    let accepting = false;

    const status = el("p", "simon-status", "Watch the fireflies... ✨");
    body.appendChild(status);
    const board = el("div", "simon-board");
    const pads = COLORS.map((color, i) => {
      const p = el("button", "simon-pad");
      p.style.setProperty("--pad-color", color);
      p.addEventListener("click", () => {
        if (!accepting) return;
        flash(p);
        if (i === seq[inputPos]) {
          inputPos++;
          if (inputPos === seq.length) {
            accepting = false;
            if (seq.length >= ms.rounds) {
              status.textContent = "Signal decoded! 🎉";
              setTimeout(() => completeMission(st), 800);
            } else {
              status.textContent = `Round ${seq.length} clear! Next round...`;
              setTimeout(nextRound, 1100);
            }
          }
        } else {
          accepting = false;
          status.textContent = "Oops! Watch the same round again... 👀";
          setTimeout(() => playSeq(), 1300);
        }
      });
      board.appendChild(p);
      return p;
    });
    body.appendChild(board);
    const round = el("p", "simon-round", "");
    body.appendChild(round);

    function flash(pad) {
      pad.classList.add("lit");
      setTimeout(() => pad.classList.remove("lit"), 320);
    }
    function playSeq() {
      accepting = false;
      inputPos = 0;
      round.textContent = `Round ${seq.length} of ${ms.rounds}`;
      seq.forEach((c, i) => setTimeout(() => flash(pads[c]), 600 + i * 550));
      setTimeout(() => {
        accepting = true;
        status.textContent = "Your turn — repeat the pattern!";
      }, 600 + seq.length * 550);
    }
    function nextRound() {
      seq.push(Math.floor(Math.random() * 4));
      status.textContent = "Watch the fireflies... ✨";
      playSeq();
    }
    setTimeout(nextRound, 800);
  }

  // ---------- 공개 API ----------
  window.JiaHQ = {
    open() {
      body = document.querySelector("#mission-body");
      document.querySelectorAll(".stage").forEach((s) => s.classList.remove("active"));
      document.querySelector("#stage-mission").classList.add("active");
      document.querySelector("#progress").classList.add("hidden");
      window.scrollTo(0, 0);
      render(loadState());
    },
  };
})();
