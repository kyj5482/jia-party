// ============================================================
//  Jia's Secret HQ — 파티 당일 미션 게임 엔진
//  (초대장 첫 화면의 이스터에그로 열림 — main.js 참고)
//
//  - 전원 참여: 스쿼드 등록 후 조작 담당 자동 로테이션
//  - 미션 흐름: 브리핑 화면 → MISSION START! → 전체 화면 몰입 모드
//  - 힌트 찬스: 팀 공용 토큰으로 단계별 힌트 공개 + 오답 3회 자비
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
      return { screen: "pin", squad: [], turn: 0, tokens: M.hintTokens, hintsUsed: {}, ...st };
    } catch (e) {
      return { screen: "pin", squad: [], turn: 0, tokens: M.hintTokens, hintsUsed: {} };
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

  // 💡 힌트 바: 팀 공용 힌트 찬스로 미션별 힌트를 단계 공개
  // 반환된 요소의 .mercy() 를 부르면 무료 힌트 1개 공개 (오답 자비용)
  function hintBar(st, ms) {
    const wrap = el("div", "hint-bar");
    if (!ms.hints || !ms.hints.length) return wrap;
    const tokensEl = el("p", "hint-tokens");
    const list = el("div", "hint-list");
    const btn = el("button", "hint-btn");
    let armed = false, armTimer = null;

    const usedCount = () => (st.hintsUsed && st.hintsUsed[st.idx]) || 0;

    function redraw() {
      const used = usedCount();
      tokensEl.textContent =
        `💡 HINT CHANCES  ${"●".repeat(st.tokens)}${"○".repeat(Math.max(0, M.hintTokens - st.tokens))}`;
      list.innerHTML = "";
      ms.hints.slice(0, used).forEach((h, i) => {
        list.appendChild(el("p", "hint-revealed", `HINT ${i + 1} · ${h}`));
      });
      if (used >= ms.hints.length) { btn.classList.add("hidden"); return; }
      btn.classList.remove("hidden");
      btn.disabled = st.tokens <= 0;
      btn.textContent = st.tokens <= 0
        ? "No hint chances left 😅"
        : armed ? "Spend 1 chance? Tap again to confirm 💡" : `Use a hint (${st.tokens} left)`;
    }

    function reveal(free) {
      const used = usedCount();
      if (used >= ms.hints.length) return;
      if (!free) {
        if (st.tokens <= 0) return;
        st.tokens--;
      }
      st.hintsUsed = st.hintsUsed || {};
      st.hintsUsed[st.idx] = used + 1;
      saveState(st);
      armed = false;
      redraw();
    }

    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      if (!armed) {
        armed = true;
        redraw();
        clearTimeout(armTimer);
        armTimer = setTimeout(() => { armed = false; redraw(); }, 3000);
        return;
      }
      clearTimeout(armTimer);
      reveal(false);
    });

    wrap.appendChild(tokensEl);
    wrap.appendChild(list);
    wrap.appendChild(btn);
    redraw();
    wrap.mercy = () => reveal(true);
    return wrap;
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

  // 미션 브리핑 화면: 정보를 읽고 MISSION START! 를 눌러야 게임 시작
  function renderMission(st) {
    const ms = M.missions[st.idx];
    body.appendChild(el("p", "hq-progress", `MISSION ${st.idx + 1} / ${M.missions.length}`));
    body.appendChild(el("h3", "hq-mission-title", ms.title));
    body.appendChild(el("p", "hq-progress",
      ms.kind === "code" ? "🖊️ WHITEBOARD MISSION" : "📱 TABLET MISSION"));
    const card = el("div", "hq-card");
    card.appendChild(el("p", null, ms.intro));
    body.appendChild(card);
    const btn = el("button", "btn btn-hq btn-big", "MISSION START! 🚀");
    btn.addEventListener("click", () => openGame(st, ms));
    body.appendChild(btn);
  }

  // 전체 화면 몰입 모드로 게임 열기
  function openGame(st, ms) {
    const screen = el("div", "game-screen");
    const top = el("div", "game-top");
    top.appendChild(el("span", "game-title", ms.title));
    const quit = el("button", "game-quit", "✕");
    quit.setAttribute("aria-label", "Back to mission briefing");
    quit.addEventListener("click", () => { screen.remove(); render(st); });
    top.appendChild(quit);
    screen.appendChild(top);
    const area = el("div", "game-area");
    screen.appendChild(area);
    document.body.appendChild(screen);

    const onDone = (newSt) => { screen.remove(); completeMission(newSt); };
    if (ms.kind === "maze") gameMaze(st, ms, area, screen, onDone);
    if (ms.kind === "code") gameCode(st, ms, area, onDone);
    if (ms.kind === "simon") gameSimon(st, ms, area, onDone);
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

  // ---------- 게임: 안개 미로 (조종자 교대) ----------
  function gameMaze(st, ms, area, screen, onDone) {
    const SWITCH_EVERY = 12; // 이 걸음 수마다 조종자 교대
    const grid = ms.maze.map((r) => [...r]);
    const H = grid.length, W = grid[0].length;
    let py, px;
    grid.forEach((row, y) => row.forEach((c, x) => { if (c === "S") { py = y; px = x; } }));
    const visited = new Set([`${py},${px}`]);
    let moves = 0;
    let driverOff = 0; // 교대 횟수 (턴 로테이션 오프셋)
    let finished = false;

    const badge = agentBadge("🧭", "DRIVER", agent(st, driverOff));
    area.appendChild(badge);

    const wrap = el("div", "maze-wrap");
    const cv = el("canvas", "maze-canvas");
    wrap.appendChild(cv);
    area.appendChild(wrap);

    const ctx = cv.getContext("2d");
    const CELL = Math.min(28, Math.floor(Math.min(480, window.innerWidth - 40) / W));
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

    const pad = el("div", "dpad");
    [["↑", -1, 0], ["←", 0, -1], ["→", 0, 1], ["↓", 1, 0]].forEach(([label, dy, dx]) => {
      const b = el("button",
        `dpad-btn dpad-${label === "↑" ? "up" : label === "↓" ? "down" : label === "←" ? "left" : "right"}`,
        label);
      b.addEventListener("click", () => move(dy, dx));
      pad.appendChild(b);
    });
    area.appendChild(pad);
    area.appendChild(hintBar(st, ms));

    // 조종자 교대: 화면 중앙 모달 + 잠금 해제 지연으로 오조작 방지
    const passOverlay = el("div", "pass-overlay hidden");
    const passCard = el("div", "pass-card");
    const passText = el("p", null, "");
    const passBtn = el("button", "btn btn-hq", "I have the tablet! ▶");
    passCard.appendChild(el("div", "pass-emoji", "🔄"));
    passCard.appendChild(passText);
    passCard.appendChild(passBtn);
    passOverlay.appendChild(passCard);
    screen.appendChild(passOverlay);

    function switchDriver() {
      driverOff++;
      moves = 0;
      passText.textContent = `SWITCH! Pass the tablet to ${agent(st, driverOff)} 👐`;
      passOverlay.classList.remove("hidden");
      // 이동 버튼 연타 중 실수로 눌리지 않도록 1.2초간 잠금
      passBtn.disabled = true;
      passBtn.textContent = "Passing the tablet...";
      setTimeout(() => {
        passBtn.disabled = false;
        passBtn.textContent = "I have the tablet! ▶";
      }, 1200);
    }
    passBtn.addEventListener("click", () => {
      if (passBtn.disabled) return;
      passOverlay.classList.add("hidden");
      badge.querySelector(".agent-name").textContent = agent(st, driverOff);
    });

    function move(dy, dx) {
      if (finished || !passOverlay.classList.contains("hidden")) return;
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
        finished = true;
        setTimeout(() => onDone({ ...st, turn: st.turn + driverOff + 1 }), 450);
        return;
      }
      if (moves >= SWITCH_EVERY) switchDriver();
    }
    draw();
  }

  // ---------- 게임: 코드/수수께끼 입력 (서기 지정) ----------
  function gameCode(st, ms, area, onDone) {
    area.appendChild(agentBadge("⌨️", "SCRIBE", agent(st)));
    area.appendChild(el("p", "hq-text-sub",
      `${agent(st)} types — but only what the WHOLE squad agrees on!`));
    if (ms.body) {
      const card = el("div", "hq-card hq-puzzle");
      ms.body.split("\n").forEach((line) => card.appendChild(el("p", null, line || " ")));
      area.appendChild(card);
    }
    const bar = hintBar(st, ms);
    area.appendChild(bar);
    const input = el("input", "hq-input");
    input.placeholder = "YOUR ANSWER";
    input.autocapitalize = "characters";
    area.appendChild(input);
    const err = el("p", "hq-error hidden", "Not quite — put your heads together and try again!");
    area.appendChild(err);
    const btn = el("button", "btn btn-hq", "SUBMIT ▶");
    let wrongCount = 0;
    btn.addEventListener("click", () => {
      if (norm(input.value) === norm(ms.answer)) {
        onDone({ ...st, turn: st.turn + 1 });
      } else {
        wrongCount++;
        // HQ 자비: 오답 3번마다 무료 힌트 1개 공개
        if (wrongCount % 3 === 0) {
          bar.mercy();
          err.textContent = "HQ took pity and sent a FREE hint — look up! 💝";
        } else {
          err.textContent = "Not quite — put your heads together and try again!";
        }
        err.classList.remove("hidden");
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 450);
      }
    });
    area.appendChild(btn);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
  }

  // ---------- 게임: 반딧불 기억 게임 (라운드마다 탭 담당 교대) ----------
  function gameSimon(st, ms, area, onDone) {
    const COLORS = ["#8b5cf6", "#f472b6", "#38bdf8", "#fbbf24"];
    let seq = [];
    let inputPos = 0;
    let accepting = false;

    const badge = agentBadge("🔆", "TAPPER", agent(st));
    area.appendChild(badge);
    const status = el("p", "simon-status", "Watch the fireflies... ✨");
    area.appendChild(status);
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
              setTimeout(() => onDone({ ...st, turn: st.turn + ms.rounds }), 800);
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
    area.appendChild(board);
    const round = el("p", "simon-round", "");
    area.appendChild(round);
    area.appendChild(hintBar(st, ms));

    function tapper() { return agent(st, seq.length - 1); }
    function flash(pad) {
      pad.classList.add("lit");
      setTimeout(() => pad.classList.remove("lit"), 300);
    }
    function playSeq() {
      accepting = false;
      inputPos = 0;
      round.textContent = `Round ${seq.length} of ${ms.rounds}`;
      badge.querySelector(".agent-name").textContent = tapper();
      // 라운드가 올라갈수록 점점 빨라짐 (550ms → 최저 380ms)
      const beat = Math.max(380, 550 - (seq.length - 1) * 30);
      seq.forEach((c, i) => setTimeout(() => flash(pads[c]), 600 + i * beat));
      setTimeout(() => {
        accepting = true;
        status.textContent = `${tapper()} taps — everyone else, call out the colors!`;
      }, 600 + seq.length * beat);
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
