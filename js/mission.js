// ============================================================
//  Jia's Secret HQ — 파티 당일 미션 게임 엔진
//  (초대장 첫 화면의 이스터에그로 열림 — main.js 참고)
//
//  전원 참여 설계: 입장 후 스쿼드(참가자 이름)를 등록하면
//  미로 조종, 시몬 탭, 답 입력, 봉투 코드 입력을 모두
//  돌아가면서 맡습니다 (턴은 자동 로테이션).
// ============================================================

(function () {
  const M = MISSION_CONFIG;
  const KEY = "jia_hq_progress"; // localStorage: 진행 상태 저장
  let body = null;

  // ?reset 으로 열면 진행 상태 초기화 (부모용)
  if (location.search.includes("reset")) localStorage.removeItem(KEY);

  const norm = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");

  function loadState() {
    try {
      const st = JSON.parse(localStorage.getItem(KEY)) || {};
      return { screen: "pin", squad: [], turn: 0, ...st };
    } catch (e) {
      return { screen: "pin", squad: [], turn: 0 };
    }
  }
  function saveState(st) { localStorage.setItem(KEY, JSON.stringify(st)); }

  // 현재 턴의 요원 이름 (offset으로 다음 순번 조회)
  function agent(st, offset = 0) {
    if (!st.squad || !st.squad.length) return "AGENT";
    return st.squad[(st.turn + offset) % st.squad.length];
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // 역할 배지: 누구 차례인지 크게 표시
  function agentBadge(emoji, role, name) {
    const b = el("div", "agent-badge");
    b.appendChild(el("span", "agent-role", `${emoji} ${role}`));
    b.appendChild(el("strong", "agent-name", name));
    return b;
  }

  function render(st) {
    saveState(st);
    body.innerHTML = "";
    if (st.screen === "pin") return renderPin(st);
    if (st.screen === "squad") return renderSquad(st);
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
          if (entered === M.pin) return render({ ...st, screen: "squad" });
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

  // ---------- 스쿼드 등록 (전원 참여의 핵심) ----------
  function renderSquad(st) {
    body.appendChild(el("h3", "hq-mission-title", "🧑‍🚀 ASSEMBLE YOUR SQUAD"));
    body.appendChild(el("p", "hq-text",
      "Type EVERY agent's name. Missions rotate automatically — everyone gets a turn to drive, tap, and type!"));

    const row = el("div", "squad-row");
    const input = el("input", "hq-input squad-input");
    input.placeholder = "AGENT NAME";
    input.maxLength = 14;
    const addBtn = el("button", "btn btn-hq squad-add", "ADD");
    row.appendChild(input);
    row.appendChild(addBtn);
    body.appendChild(row);

    const chips = el("div", "squad-chips");
    body.appendChild(chips);
    const hint = el("p", "hq-error hidden", "Add at least 2 agents to start!");
    body.appendChild(hint);
    const startBtn = el("button", "btn btn-hq", "START BRIEFING ▶");
    body.appendChild(startBtn);

    let squad = [...(st.squad || [])];

    function drawChips() {
      chips.innerHTML = "";
      squad.forEach((name, i) => {
        const c = el("span", "chip");
        c.appendChild(el("span", null, name));
        const x = el("button", "chip-x", "✕");
        x.setAttribute("aria-label", `Remove ${name}`);
        x.addEventListener("click", () => { squad.splice(i, 1); drawChips(); });
        c.appendChild(x);
        chips.appendChild(c);
      });
    }
    function add() {
      const name = input.value.trim();
      if (!name || squad.length >= 10) return;
      squad.push(name);
      input.value = "";
      input.focus();
      drawChips();
    }
    addBtn.addEventListener("click", add);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });
    startBtn.addEventListener("click", () => {
      if (squad.length < 2) {
        hint.classList.remove("hidden");
        return;
      }
      render({ ...st, screen: "brief", squad, turn: 0 });
    });
    drawChips();
  }

  // ---------- 브리핑 ----------
  function renderBrief(st) {
    const box = el("div", "hq-card");
    const lines = [...M.briefing, `Your squad: ${st.squad.join(" · ")} 🤝`];
    lines.forEach((line, i) => {
      const p = el("p", "hq-brief-line", line);
      p.style.animationDelay = `${i * 0.7}s`;
      box.appendChild(p);
    });
    body.appendChild(box);
    const btn = el("button", "btn btn-hq hq-brief-line", "ACCEPT MISSION ▶");
    btn.style.animationDelay = `${lines.length * 0.7}s`;
    btn.addEventListener("click", () => render({ ...st, screen: "mission", idx: 0 }));
    body.appendChild(btn);
  }

  // ---------- 미션 공통 ----------
  function completeMission(st) {
    if (st.idx === M.missions.length - 1) return render({ ...st, screen: "final" });
    render({ ...st, screen: "clue" });
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
    btn.addEventListener("click", () => render({ ...st, screen: "gate" }));
    body.appendChild(btn);
  }

  // ---------- 봉투 코드 입력 → 다음 미션 ----------
  function renderGate(st) {
    const ms = M.missions[st.idx];
    body.appendChild(el("h3", "hq-mission-title", "🔒 SECURITY CHECK"));
    body.appendChild(agentBadge("🔑", "UNLOCKER", agent(st)));
    body.appendChild(el("p", "hq-text",
      `${ms.gatePrompt} (${agent(st)} types — but the whole squad checks the spelling!)`));
    const input = el("input", "hq-input");
    input.placeholder = "SECRET WORD";
    input.autocapitalize = "characters";
    body.appendChild(input);
    const err = el("p", "hq-error hidden", "Hmm, that's not it. Check the envelope again!");
    body.appendChild(err);
    const btn = el("button", "btn btn-hq", "UNLOCK ▶");
    btn.addEventListener("click", () => {
      if (norm(input.value) === norm(ms.gateCode)) {
        render({ ...st, screen: "mission", idx: st.idx + 1, turn: st.turn + 1 });
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
    if (st.squad && st.squad.length) {
      card.appendChild(el("p", "hq-squad-line", `Agents: ${st.squad.join(" · ")} 🏅`));
    }
    body.appendChild(card);
    const combo = el("div", "hq-combo");
    [...M.final.lockCode].forEach((d) => combo.appendChild(el("span", "hq-digit", d)));
    body.appendChild(combo);
    // 축하 색종이 (재렌더링 시 중복 생성 방지)
    const stage = document.querySelector("#stage-mission");
    if (!stage.querySelector(".hq-confetti")) {
      const cv = el("canvas", "hq-confetti");
      stage.appendChild(cv);
      JiaFX.startConfetti(cv);
    }
  }

  // ---------- 미션: 안개 미로 (조종자 교대) ----------
  function renderMaze(st, ms) {
    const SWITCH_EVERY = 8; // 이 걸음 수마다 조종자 교대
    const grid = ms.maze.map((r) => [...r]);
    const H = grid.length, W = grid[0].length;
    let py, px;
    grid.forEach((row, y) => row.forEach((c, x) => { if (c === "S") { py = y; px = x; } }));
    const visited = new Set([`${py},${px}`]);
    let moves = 0;
    let driverOff = 0; // 교대 횟수 (턴 로테이션 오프셋)

    const badge = agentBadge("🧭", "DRIVER", agent(st, driverOff));
    body.appendChild(badge);

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
            ctx.fillStyle = "#0d0a1e"; // 안개
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
      ctx.font = `${CELL * 0.72}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🔦", px * CELL + CELL / 2, py * CELL + CELL / 2 + 1);
    }

    // 조종자 교대 카드
    const passCard = el("div", "pass-card hidden");
    const passText = el("p", null, "");
    const passBtn = el("button", "btn btn-hq", "I have the tablet! ▶");
    passCard.appendChild(el("div", "pass-emoji", "🔄"));
    passCard.appendChild(passText);
    passCard.appendChild(passBtn);

    const pad = el("div", "dpad");
    [["↑", -1, 0], ["←", 0, -1], ["→", 0, 1], ["↓", 1, 0]].forEach(([label, dy, dx]) => {
      const b = el("button",
        `dpad-btn dpad-${label === "↑" ? "up" : label === "↓" ? "down" : label === "←" ? "left" : "right"}`,
        label);
      b.addEventListener("click", () => move(dy, dx));
      pad.appendChild(b);
    });
    body.appendChild(pad);
    body.appendChild(passCard);

    function switchDriver() {
      driverOff++;
      moves = 0;
      passText.textContent = `SWITCH! Pass the tablet to ${agent(st, driverOff)} 👐`;
      pad.classList.add("hidden");
      passCard.classList.remove("hidden");
    }
    passBtn.addEventListener("click", () => {
      passCard.classList.add("hidden");
      pad.classList.remove("hidden");
      badge.querySelector(".agent-name").textContent = agent(st, driverOff);
    });

    function move(dy, dx) {
      const ny = py + dy, nx = px + dx;
      if (grid[ny] === undefined || grid[ny][nx] === "#") {
        wrap.classList.add("shake");
        setTimeout(() => wrap.classList.remove("shake"), 300);
        return;
      }
      py = ny; px = nx;
      visited.add(`${py},${px}`);
      moves++;
      draw();
      if (grid[py][px] === "K") {
        setTimeout(() => completeMission({ ...st, turn: st.turn + driverOff + 1 }), 450);
        return;
      }
      if (moves >= SWITCH_EVERY) switchDriver();
    }
    draw();
  }

  // ---------- 미션: 코드/수수께끼 입력 (서기 지정) ----------
  function renderCode(st, ms) {
    body.appendChild(agentBadge("⌨️", "SCRIBE", agent(st)));
    body.appendChild(el("p", "hq-text-sub",
      `${agent(st)} types — but only what the WHOLE squad agrees on!`));
    if (ms.body) {
      const card = el("div", "hq-card hq-puzzle");
      ms.body.split("\n").forEach((line) => card.appendChild(el("p", null, line || " ")));
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
        completeMission({ ...st, turn: st.turn + 1 });
      } else {
        err.classList.remove("hidden");
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 450);
      }
    });
    body.appendChild(btn);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
  }

  // ---------- 미션: 반딧불 기억 게임 (라운드마다 탭 담당 교대) ----------
  function renderSimon(st, ms) {
    const COLORS = ["#8b5cf6", "#f472b6", "#38bdf8", "#fbbf24"];
    let seq = [];
    let inputPos = 0;
    let accepting = false;

    const badge = agentBadge("🔆", "TAPPER", agent(st));
    body.appendChild(badge);
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
              setTimeout(() => completeMission({ ...st, turn: st.turn + ms.rounds }), 800);
            } else {
              status.textContent = `Round ${seq.length} clear! Pass the tablet...`;
              setTimeout(nextRound, 1400);
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

    function tapper() { return agent(st, seq.length - 1); }
    function flash(pad) {
      pad.classList.add("lit");
      setTimeout(() => pad.classList.remove("lit"), 320);
    }
    function playSeq() {
      accepting = false;
      inputPos = 0;
      round.textContent = `Round ${seq.length} of ${ms.rounds}`;
      badge.querySelector(".agent-name").textContent = tapper();
      seq.forEach((c, i) => setTimeout(() => flash(pads[c]), 600 + i * 550));
      setTimeout(() => {
        accepting = true;
        status.textContent = `${tapper()} taps — everyone else, call out the colors!`;
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
