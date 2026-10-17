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
      const merged = { screen: "pin", squad: [], turn: 0, tokens: M.hintTokens, hintsUsed: {}, ...st };
      // 예전 저장 형식(이름 문자열 배열) 호환
      merged.squad = (merged.squad || []).map((s) =>
        typeof s === "string" ? { name: s, avatar: "🕵️", title: "Agent" } : s
      );
      return merged;
    } catch (e) {
      return { screen: "pin", squad: [], turn: 0, tokens: M.hintTokens, hintsUsed: {} };
    }
  }
  function saveState(st) { localStorage.setItem(KEY, JSON.stringify(st)); }

  // 현재 턴의 요원 (offset으로 다음 순번 조회) — 표시는 "아바타 이름"
  function agent(st, offset = 0) {
    if (!st.squad || !st.squad.length) return "AGENT";
    const a = st.squad[(st.turn + offset) % st.squad.length];
    return `${a.avatar} ${a.name}`;
  }
  const squadNames = (squad) => squad.map((a) => `${a.avatar} ${a.name}`).join(" · ");

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

  // ---------- 시네마틱 타이프라이터 (RPG 대화창 방식) ----------
  // 글자가 한 자씩 타이핑되고, 화면을 탭하면 즉시 완성(fast-forward).
  // 반환된 promise가 끝난 뒤 버튼류를 보여주는 패턴으로 사용.
  let cancelTyping = null;
  // 이모지(서로게이트 쌍/ZWJ 조합)를 반쪽으로 자르면 깨진 문자가 보이므로
  // 화면에 보이는 글자(그래핌) 단위로 분할해서 타이핑한다
  const segmenter = typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
  function graphemes(line) {
    if (segmenter) return [...segmenter.segment(line)].map((s) => s.segment);
    return [...line]; // 폴백: 코드포인트 단위 (서로게이트 쌍까지는 안전)
  }
  function typeLines(lines, { container, cls = "boot-line", charMs = 24, lineMs = 380 } = {}) {
    let finished = false;
    let timer = null;
    const els = [];
    let resolveFn;
    const promise = new Promise((res) => { resolveFn = res; });

    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      lines.forEach((line, i) => {
        if (els[i]) els[i].textContent = line;
        else { const p = el("p", cls, line); container.appendChild(p); els[i] = p; }
      });
      body.removeEventListener("pointerdown", onTap);
      resolveFn();
    }
    const onTap = () => finish();
    body.addEventListener("pointerdown", onTap);
    cancelTyping = () => {
      finished = true;
      clearTimeout(timer);
      body.removeEventListener("pointerdown", onTap);
    };

    let li = 0;
    function nextLine() {
      if (finished) return;
      if (li >= lines.length) return finish();
      const chars = graphemes(lines[li]);
      const p = el("p", cls, "");
      const cursor = el("span", "boot-cursor", "▋");
      p.appendChild(cursor);
      container.appendChild(p);
      els[li] = p;
      let ci = 0;
      (function tick() {
        if (finished) return;
        if (ci < chars.length) {
          cursor.before(document.createTextNode(chars[ci]));
          ci++;
          timer = setTimeout(tick, charMs);
        } else {
          cursor.remove();
          li++;
          timer = setTimeout(nextLine, lineMs);
        }
      })();
    }
    nextLine();
    return promise;
  }

  function render(st) {
    if (cancelTyping) { cancelTyping(); cancelTyping = null; }
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

  // ---------- PIN 입장 (시네마틱) ----------
  function renderPin(st) {
    const term = el("div", "boot-term");
    body.appendChild(term);
    const ui = el("div", "pin-ui hidden");
    body.appendChild(ui);

    const dots = el("div", "pin-dots");
    const dotEls = [];
    for (let i = 0; i < M.pin.length; i++) {
      const d = el("span", "pin-dot");
      dots.appendChild(d);
      dotEls.push(d);
    }
    ui.appendChild(dots);

    let entered = "";
    let locked = false;
    const pad = el("div", "pin-pad");
    "123456789⌫0✓".split("").forEach((k) => {
      const b = el("button", "pin-key", k);
      b.addEventListener("click", () => {
        if (locked) return;
        if (k === "⌫") entered = entered.slice(0, -1);
        else if (k === "✓") {
          if (entered === M.pin) {
            // 접속 승인 연출: 점이 초록으로 바뀌고 승인 문구가 타이핑된 뒤 진행
            locked = true;
            dotEls.forEach((d) => d.classList.add("ok"));
            typeLines(["> ACCESS CODE VERIFIED ✔  WELCOME, AGENTS."], { container: term })
              .then(() => setTimeout(() => render({ ...st, screen: "squad" }), 650));
            return;
          }
          dots.classList.add("shake");
          setTimeout(() => dots.classList.remove("shake"), 450);
          entered = "";
        } else if (entered.length < M.pin.length) entered += k;
        dotEls.forEach((d, i) => d.classList.toggle("on", i < entered.length));
      });
      pad.appendChild(b);
    });
    ui.appendChild(pad);

    typeLines(["> IDENTIFY YOURSELVES, AGENTS.", "> ENTER ACCESS CODE:"], { container: term })
      .then(() => ui.classList.remove("hidden"));
  }

  // ---------- 스쿼드 모집: 터미널 부팅 시네마틱 → RPG식 캐릭터 생성 ----------
  function renderSquad(st) {
    const R = M.recruit || {};
    const boot = R.bootLines || [];
    // 이미 모집을 시작했었다면(또는 부팅 문구가 없다면) 바로 모집 화면으로
    if (!boot.length || (st.squad && st.squad.length)) return renderRecruit(st);

    const term = el("div", "boot-term");
    body.appendChild(term);
    typeLines(boot, { container: term, charMs: 26, lineMs: 450 }).then(() => {
      setTimeout(() => {
        body.innerHTML = "";
        renderRecruit(st);
      }, 800);
    });
  }

  function renderRecruit(st) {
    const R = M.recruit || { avatars: ["🕵️"], titles: ["Agent"] };
    let squad = [...(st.squad || [])];
    let selAvatar = null;

    body.appendChild(el("h3", "hq-mission-title", "⚡ AGENT RECRUITMENT"));
    body.appendChild(el("p", "hq-text-sub", "Choose your character, then enter your agent codename."));

    const grid = el("div", "avatar-grid");
    const avatarBtns = R.avatars.map((a) => {
      const b = el("button", "avatar-btn", a);
      b.addEventListener("click", () => {
        if (b.disabled) return;
        selAvatar = a;
        avatarBtns.forEach((x) => x.classList.toggle("sel", x === b));
      });
      grid.appendChild(b);
      return b;
    });
    body.appendChild(grid);

    const row = el("div", "squad-row");
    const input = el("input", "hq-input squad-input");
    input.placeholder = "AGENT CODENAME";
    input.maxLength = 14;
    const addBtn = el("button", "btn btn-hq squad-add", "REGISTER");
    row.appendChild(input);
    row.appendChild(addBtn);
    body.appendChild(row);

    const err = el("p", "hq-error hidden", "");
    body.appendChild(err);
    const cardSlot = el("div", "agent-card-slot");
    body.appendChild(cardSlot);
    const roster = el("div", "squad-chips");
    body.appendChild(roster);
    const deployBtn = el("button", "btn btn-hq btn-big hidden", "DEPLOY SQUAD 🚀");
    body.appendChild(deployBtn);

    function syncTaken() {
      avatarBtns.forEach((b) => {
        const taken = squad.some((s) => s.avatar === b.textContent);
        b.disabled = taken;
        b.classList.toggle("taken", taken);
        if (taken) b.classList.remove("sel");
      });
    }
    function redrawRoster() {
      roster.innerHTML = "";
      squad.forEach((a, i) => {
        const c = el("span", "chip");
        c.appendChild(el("span", null, `${a.avatar} ${a.name}`));
        const x = el("button", "chip-x", "✕");
        x.setAttribute("aria-label", `Remove ${a.name}`);
        x.addEventListener("click", () => {
          squad.splice(i, 1);
          syncTaken();
          redrawRoster();
          cardSlot.innerHTML = "";
        });
        c.appendChild(x);
        roster.appendChild(c);
      });
      deployBtn.classList.toggle("hidden", squad.length < 2);
    }
    function showCard(a) {
      cardSlot.innerHTML = "";
      const card = el("div", "agent-card");
      card.appendChild(el("div", "agent-card-avatar", a.avatar));
      card.appendChild(el("p", "agent-card-name", `AGENT ${a.name.toUpperCase()}`));
      card.appendChild(el("p", "agent-card-title", `“${a.title}”`));
      card.appendChild(el("div", "agent-card-stamp", "REGISTERED ✔"));
      cardSlot.appendChild(card);
    }
    function register() {
      const name = input.value.trim();
      if (!selAvatar) { err.textContent = "Pick a character first! 👆"; err.classList.remove("hidden"); return; }
      if (!name) { err.textContent = "Every agent needs a codename!"; err.classList.remove("hidden"); return; }
      if (squad.length >= 10) return;
      err.classList.add("hidden");
      // 아직 안 쓴 칭호 우선 배정
      const unused = R.titles.filter((t) => !squad.some((s) => s.title === t));
      const pool = unused.length ? unused : R.titles;
      const a = { name, avatar: selAvatar, title: pool[Math.floor(Math.random() * pool.length)] };
      squad.push(a);
      input.value = "";
      selAvatar = null;
      avatarBtns.forEach((x) => x.classList.remove("sel"));
      syncTaken();
      redrawRoster();
      showCard(a);
    }
    addBtn.addEventListener("click", register);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") register(); });
    deployBtn.addEventListener("click", () => render({ ...st, screen: "brief", squad, turn: 0 }));

    syncTaken();
    redrawRoster();
  }

  // ---------- 브리핑 (시네마틱) ----------
  function renderBrief(st) {
    const box = el("div", "boot-term");
    body.appendChild(box);
    const btn = el("button", "btn btn-hq hidden", "ACCEPT MISSION ▶");
    btn.addEventListener("click", () => render({ ...st, screen: "mission", idx: 0 }));
    body.appendChild(btn);
    const lines = [...M.briefing, `YOUR SQUAD: ${squadNames(st.squad)} 🤝`];
    typeLines(lines, { container: box, charMs: 22, lineMs: 420 })
      .then(() => btn.classList.remove("hidden"));
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
    body.appendChild(el("span", "type-chip",
      ms.kind === "code" ? "🖊️ WHITEBOARD MISSION" : "📱 TABLET MISSION"));
    const card = el("div", "hq-card hq-intro");
    body.appendChild(card);
    const btn = el("button", "btn btn-hq btn-big hidden", "MISSION START! 🚀");
    btn.addEventListener("click", () => openGame(st, ms));
    body.appendChild(btn);
    typeLines([ms.intro], { container: card, cls: "type-par", charMs: 16 })
      .then(() => btn.classList.remove("hidden"));
  }

  // 전체 화면 몰입 모드로 게임 열기
  function openGame(st, ms) {
    const screen = el("div", "game-screen");
    const top = el("div", "game-top");
    top.appendChild(el("span", "game-title", ms.title));
    const quit = el("button", "game-quit", "✕");
    quit.setAttribute("aria-label", "Back to mission briefing");
    quit.addEventListener("click", () => {
      if (screen._cleanup) screen._cleanup();
      screen.remove();
      render(st);
    });
    top.appendChild(quit);
    screen.appendChild(top);
    const area = el("div", "game-area");
    screen.appendChild(area);
    document.body.appendChild(screen);

    const onDone = (newSt) => {
      if (screen._cleanup) screen._cleanup();
      screen.remove();
      completeMission(newSt);
    };
    if (ms.kind === "maze") gameMaze(st, ms, area, screen, onDone);
    if (ms.kind === "code") gameCode(st, ms, area, onDone);
    if (ms.kind === "simon") gameSimon(st, ms, area, onDone);
  }

  // ---------- 성공 → 봉투 힌트 ----------
  function renderClue(st) {
    const ms = M.missions[st.idx];
    body.appendChild(el("div", "hq-stamp", "✔ MISSION CLEARED"));
    // 봉투 찾기는 특정 요원이 아닌 스쿼드 전원의 활동
    body.appendChild(agentBadge("🔍", "TEAM SEARCH", "ALL AGENTS"));
    const card = el("div", "hq-card hq-clue");
    body.appendChild(card);
    const btn = el("button", "btn btn-hq hidden", "We found the envelope! ▶");
    btn.addEventListener("click", () => render({ ...st, screen: "gate" }));
    body.appendChild(btn);
    typeLines(
      ["INCOMING TRANSMISSION FROM HQ...", ms.clue, "EVERYONE — search together! 🏃‍♀️🏃"],
      { container: card, cls: "type-par", charMs: 18 }
    ).then(() => btn.classList.remove("hidden"));
  }

  // ---------- 봉투 코드 입력 → 다음 미션 ----------
  function renderGate(st) {
    const ms = M.missions[st.idx];
    body.appendChild(el("h3", "hq-mission-title", "🔒 SECURITY CHECK"));
    body.appendChild(agentBadge("🔑", "TEAM UNLOCK", "ALL AGENTS"));
    const promptBox = el("div", "hq-card gate-prompt");
    body.appendChild(promptBox);
    const ui = el("div", "pin-ui hidden");
    body.appendChild(ui);
    const input = el("input", "hq-input");
    input.placeholder = "SECRET WORD";
    input.autocapitalize = "characters";
    ui.appendChild(input);
    const err = el("p", "hq-error hidden", "Hmm, that's not it. Check the envelope again!");
    ui.appendChild(err);
    const btn = el("button", "btn btn-hq", "UNLOCK ▶");
    btn.addEventListener("click", () => {
      if (norm(input.value) === norm(ms.gateCode)) {
        // 봉투 구간은 전원 활동이라 턴을 소모하지 않음 (로테이션은 미션 안에서만)
        render({ ...st, screen: "mission", idx: st.idx + 1 });
      } else {
        err.classList.remove("hidden");
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 450);
      }
    });
    ui.appendChild(btn);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
    typeLines([`${ms.gatePrompt}`, "(Any agent can type — the whole squad checks the spelling!)"],
      { container: promptBox, cls: "type-par", charMs: 16 })
      .then(() => ui.classList.remove("hidden"));
  }

  // ---------- 최종 (시네마틱 피날레) ----------
  function renderFinal(st) {
    body.appendChild(el("div", "hq-stamp hq-stamp-final", "★ ALL MISSIONS CLEARED ★"));
    const card = el("div", "hq-card hq-final");
    body.appendChild(card);
    const combo = el("div", "hq-combo hidden");
    [...M.final.lockCode].forEach((d, i) => {
      const digit = el("span", "hq-digit", d);
      digit.style.animationDelay = `${i * 0.55}s`;
      combo.appendChild(digit);
    });
    body.appendChild(combo);
    const squadLine = st.squad && st.squad.length
      ? el("p", "hq-squad-line hidden", `Agents: ${squadNames(st.squad)} 🏅`)
      : null;
    if (squadLine) body.appendChild(squadLine);

    typeLines(M.final.message.split("\n"), { container: card, cls: "type-par", charMs: 20, lineMs: 500 })
      .then(() => {
        // 자물쇠 숫자가 하나씩 공개되고, 다 공개되면 색종이
        combo.classList.remove("hidden");
        const totalMs = M.final.lockCode.length * 550 + 400;
        setTimeout(() => {
          if (squadLine) squadLine.classList.remove("hidden");
          const stage = document.querySelector("#stage-mission");
          if (!stage.querySelector(".hq-confetti")) {
            const cv = el("canvas", "hq-confetti");
            stage.appendChild(cv);
            JiaFX.startConfetti(cv);
          }
        }, totalMs);
      });
  }

  // ---------- 게임: 안개 미로 (조종자 교대 + 문스톤 수수께끼) ----------
  function gameMaze(st, ms, area, screen, onDone) {
    const SWITCH_EVERY = 12; // 이 걸음 수마다 조종자 교대
    const grid = ms.maze.map((r) => [...r]);
    const H = grid.length, W = grid[0].length;
    let py, px;
    const stoneCells = new Map(); // "y,x" → 수수께끼 인덱스 (G는 읽기 순서로 매칭)
    grid.forEach((row, y) => row.forEach((c, x) => {
      if (c === "S") { py = y; px = x; }
      if (c === "G") stoneCells.set(`${y},${x}`, stoneCells.size);
    }));
    const stonesTotal = (ms.moonstones || []).length;
    let stonesFound = 0;
    const visited = new Set([`${py},${px}`]);
    let moves = 0;
    let driverOff = 0; // 교대 횟수 (턴 로테이션 오프셋)
    let finished = false;

    const statusRow = el("div", "maze-status");
    const badge = agentBadge("🧭", "DRIVER", agent(st, driverOff));
    statusRow.appendChild(badge);
    const stonesEl = el("div", "stones-counter", `💎 ${stonesFound} / ${stonesTotal}`);
    if (stonesTotal) statusRow.appendChild(stonesEl);
    area.appendChild(statusRow);

    const wrap = el("div", "maze-wrap");
    const cv = el("canvas", "maze-canvas");
    wrap.appendChild(cv);
    area.appendChild(wrap);
    const toast = el("p", "maze-toast hidden", "");
    area.appendChild(toast);
    let toastTimer = null;
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.remove("hidden");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
    }

    const ctx = cv.getContext("2d");
    const wide = window.innerWidth >= 1100; // iMac 등 대화면이면 미로를 크게
    const CELL = Math.min(wide ? 36 : 28,
      Math.floor(Math.min(wide ? 680 : 480, window.innerWidth - 40) / W));
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
          if (c === "K" || c === "G") {
            ctx.font = `${CELL * 0.7}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(c === "K" ? "🔑" : "💎", x * CELL + CELL / 2, y * CELL + CELL / 2 + 1);
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

    // 💎 문스톤 수수께끼 모달 (3지선다, 틀리면 그 보기만 비활성화)
    const riddleOverlay = el("div", "pass-overlay hidden");
    const riddleCard = el("div", "pass-card riddle-card");
    riddleOverlay.appendChild(riddleCard);
    screen.appendChild(riddleOverlay);

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function showRiddle(idx, after) {
      const r = ms.moonstones[idx];
      riddleCard.innerHTML = "";
      riddleCard.appendChild(el("div", "pass-emoji", "💎"));
      riddleCard.appendChild(el("p", "riddle-label", "A MOONSTONE! Solve its riddle to collect it:"));
      riddleCard.appendChild(el("p", "riddle-q", r.q));
      const opts = el("div", "riddle-opts");
      shuffle([...r.options]).forEach((opt) => {
        const b = el("button", "btn btn-hq riddle-opt", opt);
        b.addEventListener("click", () => {
          if (norm(opt) === norm(r.answer)) {
            stonesFound++;
            stonesEl.textContent = `💎 ${stonesFound} / ${stonesTotal}`;
            grid[py][px] = ".";
            riddleOverlay.classList.add("hidden");
            draw();
            showToast(stonesFound === stonesTotal
              ? "All moonstones collected! The key 🔑 is unsealed!"
              : `Moonstone collected! ${stonesTotal - stonesFound} to go...`);
            if (after) after();
          } else {
            b.disabled = true;
            riddleCard.classList.add("shake");
            setTimeout(() => riddleCard.classList.remove("shake"), 400);
          }
        });
        opts.appendChild(b);
      });
      riddleCard.appendChild(opts);
      riddleOverlay.classList.remove("hidden");
    }

    function overlayOpen() {
      return !passOverlay.classList.contains("hidden") ||
             !riddleOverlay.classList.contains("hidden");
    }

    function move(dy, dx) {
      if (finished || overlayOpen()) return;
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
      const cell = grid[py][px];
      if (cell === "G") {
        // 수수께끼 먼저, 풀고 나서 필요하면 교대
        showRiddle(stoneCells.get(`${py},${px}`), () => {
          if (moves >= SWITCH_EVERY) switchDriver();
        });
        return;
      }
      if (cell === "K") {
        if (stonesFound < stonesTotal) {
          showToast(`The key is SEALED 🔒 — find all moonstones first! (💎 ${stonesFound}/${stonesTotal})`);
          return;
        }
        finished = true;
        setTimeout(() => onDone({ ...st, turn: st.turn + driverOff + 1 }), 450);
        return;
      }
      if (moves >= SWITCH_EVERY) switchDriver();
    }

    // iMac 등 데스크톱: 키보드 화살표/WASD로도 조작
    const KEYMAP = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
      w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
    };
    const onKey = (e) => {
      const d = KEYMAP[e.key];
      if (!d) return;
      e.preventDefault();
      move(d[0], d[1]);
    };
    document.addEventListener("keydown", onKey);
    screen._cleanup = () => document.removeEventListener("keydown", onKey);
    area.appendChild(el("p", "kbd-hint", "⌨️ Tip: arrow keys work too!"));

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
      const stage = document.querySelector("#stage-mission");
      stage.classList.add("active");
      // 입장 순간 화면이 지지직거리는 플리커 연출
      stage.classList.add("hq-flicker");
      setTimeout(() => stage.classList.remove("hq-flicker"), 950);
      document.querySelector("#progress").classList.add("hidden");
      window.scrollTo(0, 0);
      render(loadState());
    },
  };
})();
