// ============================================================
//  Jia's Birthday Party (Version 2 — simple) — 메인 로직
//  흐름: 인트로 → O/X 퀴즈(3개 이상 정답) → RSVP → 완료
// ============================================================

(function () {
  const C = PARTY_CONFIG_V2;
  const $ = (sel) => document.querySelector(sel);

  // ---------- 단계 전환 ----------
  const STEP_ORDER = ["quiz", "form"];
  let fireworks = null;
  let maxReachedIdx = -1; // 지금까지 도달한 가장 먼 단계
  let rsvpDone = false;   // 신청 완료 후에는 단계 이동 잠금 (중복 제출 방지)

  function goToStage(name) {
    document.querySelectorAll(".stage").forEach((s) => s.classList.remove("active"));
    $(`#stage-${name}`).classList.add("active");
    window.scrollTo(0, 0);

    const progress = $("#progress");
    if (name === "intro") {
      progress.classList.add("hidden");
    } else {
      progress.classList.remove("hidden");
      const idx = STEP_ORDER.indexOf(name);
      if (idx > maxReachedIdx) maxReachedIdx = idx;
      progress.querySelectorAll(".step").forEach((el) => {
        const stepIdx = STEP_ORDER.indexOf(el.dataset.step);
        el.classList.toggle("current", el.dataset.step === name);
        el.classList.toggle("done", name === "done" || (idx >= 0 && stepIdx >= 0 && stepIdx < idx));
        el.classList.toggle(
          "reachable",
          !rsvpDone && stepIdx <= maxReachedIdx && el.dataset.step !== name
        );
      });
    }

    if (name !== "intro" && fireworks) { fireworks.stop(); fireworks = null; }
    if (name === "intro" && !fireworks) fireworks = JiaFX.startFireworks($("#fireworks"));
    if (name === "done") { JiaSound.fanfare(); JiaFX.startConfetti($("#confetti")); }
  }

  // 진행 단계 탭: 이미 도달했던 단계로 되돌아가면 그 단계의 처음부터 다시
  document.querySelectorAll("#progress .step").forEach((el) => {
    el.addEventListener("click", () => {
      const step = el.dataset.step;
      const stepIdx = STEP_ORDER.indexOf(step);
      if (rsvpDone || stepIdx > maxReachedIdx) return;
      if (step === "quiz") startQuiz();
      goToStage(step);
    });
  });

  // ---------- 🔊 효과음 ----------
  const sndBtn = $("#sound-toggle");
  const syncSnd = () => {
    sndBtn.textContent = JiaSound.muted ? "🔇" : "🔊";
    sndBtn.classList.toggle("muted", JiaSound.muted);
    sndBtn.title = JiaSound.muted ? "Sound is OFF — tap to unmute" : "Sound is on";
  };
  sndBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    JiaSound.toggleMute();
    syncSnd();
  });
  syncSnd();
  // 공통 버튼 탭음
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.id === "sound-toggle") return;
    JiaSound.tap();
  });

  // ---------- ① 인트로 ----------
  $("#intro-date").textContent = `${C.partyDate} · ${C.partyTime}`;
  $("#intro-dropoff").textContent = C.dropOff;
  $("#intro-pickup").textContent = `${C.pickupPlace} · ${C.pickupTime}`;
  $("#intro-bring").textContent = C.bringList.join(" & ");
  fireworks = JiaFX.startFireworks($("#fireworks"));
  $("#btn-enter").addEventListener("click", () => { startQuiz(); goToStage("quiz"); });

  // 밤하늘 별 생성
  (function makeStars() {
    const sky = $("#sky");
    for (let i = 0; i < 42; i++) {
      const s = document.createElement("span");
      s.className = "star";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
      s.style.animationDuration = (2 + Math.random() * 3).toFixed(2) + "s";
      const size = 1 + Math.random() * 2;
      s.style.width = s.style.height = size.toFixed(1) + "px";
      sky.appendChild(s);
    }
  })();

  // ---------- ② O/X 퀴즈 ----------
  let quizIdx = 0;
  let quizScore = 0;

  function startQuiz() {
    quizIdx = 0;
    quizScore = 0;
    $("#quiz-card").classList.remove("hidden");
    $("#quiz-final").classList.add("hidden");
    showQuestion();
  }

  function showQuestion() {
    const q = C.quiz[quizIdx];
    $("#quiz-progress").textContent = `Question ${quizIdx + 1} of ${C.quiz.length} · ${quizScore} correct so far`;
    $("#quiz-question").textContent = q.question;
    $("#quiz-feedback").classList.add("hidden");
    document.querySelectorAll(".btn-ox").forEach((b) => (b.disabled = false));
  }

  document.querySelectorAll(".btn-ox").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = C.quiz[quizIdx];
      const picked = btn.dataset.answer === "true";
      const correct = picked === q.answer;
      if (correct) quizScore++;

      document.querySelectorAll(".btn-ox").forEach((b) => (b.disabled = true));
      if (correct) JiaSound.success(); else JiaSound.wrong();
      const result = $("#quiz-result");
      result.textContent = correct ? "🎉 Correct!" : "😅 Oops, not quite!";
      result.className = "quiz-result " + (correct ? "correct" : "wrong");
      $("#quiz-explain").textContent = q.explain;
      $("#quiz-feedback").classList.remove("hidden");
      $("#btn-next-question").textContent =
        quizIdx === C.quiz.length - 1 ? "See results 🏁" : "Next question →";
    });
  });

  $("#btn-next-question").addEventListener("click", () => {
    quizIdx++;
    if (quizIdx < C.quiz.length) {
      showQuestion();
    } else {
      finishQuiz();
    }
  });

  function finishQuiz() {
    $("#quiz-card").classList.add("hidden");
    $("#quiz-final").classList.remove("hidden");
    $("#quiz-progress").textContent = "";
    $("#quiz-score").textContent = `You got ${quizScore} out of ${C.quiz.length}!`;

    const passed = quizScore >= C.quizPassScore;
    $("#quiz-verdict").textContent = passed
      ? `You really know ${C.childName} — true friend confirmed! 💜 On to the RSVP!`
      : `Hmm, you need to know ${C.childName} a little better! Get ${C.quizPassScore} or more to pass. Try again!`;
    $("#btn-quiz-pass").classList.toggle("hidden", !passed);
    $("#btn-quiz-retry").classList.toggle("hidden", passed);
  }

  $("#btn-quiz-pass").addEventListener("click", () => goToStage("form"));
  $("#btn-quiz-retry").addEventListener("click", startQuiz);

  // ---------- ③ 참가 신청 폼 ----------
  $("#rsvp-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    const errEl = $("#form-error");
    errEl.classList.add("hidden");

    const submitBtn = $("#btn-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const res = await fetch(C.formspreeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("send failed");
      showDone(data);
    } catch (err) {
      errEl.textContent = "Oops, sending failed. Please try again in a moment!";
      errEl.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = "🎉 Send RSVP";
    }
  });

  function showDone(data) {
    $("#done-date").textContent = `${C.partyDate} · ${C.partyTime}`;
    $("#done-dropoff").textContent = C.dropOff;
    $("#done-pickup").textContent = `${C.pickupPlace} · ${C.pickupTime}`;
    $("#done-message").textContent =
      data.attend === "No"
        ? `We'll miss you! Thanks for letting us know — ${C.childName} says let's play together soon 💜`
        : `See you at the party, ${data.childName}! ${C.childName} is SO excited 💜`;

    if (data.attend !== "No") {
      $("#bring-notice").classList.remove("hidden");
      const ul = $("#bring-checklist");
      ul.innerHTML = "";
      C.bringList.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
    }

    rsvpDone = true; // 완료 후 단계 이동 잠금
    goToStage("done");
  }
})();
