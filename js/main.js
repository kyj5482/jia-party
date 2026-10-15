// ============================================================
//  Jia The Best World Party — 메인 로직 (관문 진행)
// ============================================================

(function () {
  const C = PARTY_CONFIG;
  const $ = (sel) => document.querySelector(sel);

  // ---------- 단계 전환 ----------
  const STEP_ORDER = ["photos", "quiz", "teaser", "form"];
  let fireworks = null;

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
      progress.querySelectorAll(".step").forEach((el) => {
        const stepIdx = STEP_ORDER.indexOf(el.dataset.step);
        el.classList.toggle("current", el.dataset.step === name);
        el.classList.toggle("done", name === "done" || (idx >= 0 && stepIdx >= 0 && stepIdx < idx));
      });
    }

    if (name !== "intro" && fireworks) { fireworks.stop(); fireworks = null; }
    if (name === "teaser") playTeaser();
    if (name === "done") JiaFX.startConfetti($("#confetti"));
  }

  // ---------- ① 인트로 ----------
  $("#intro-date").textContent = `${C.partyDate} · ${C.partyTime}`;
  fireworks = JiaFX.startFireworks($("#fireworks"));
  $("#btn-enter").addEventListener("click", () => goToStage("photos"));

  // ---------- ② 사진 슬라이드 ----------
  let photoIdx = 0;
  const seenPhotos = new Set();

  const dotsWrap = $("#photo-dots");
  C.photos.forEach(() => {
    const d = document.createElement("span");
    d.className = "dot";
    dotsWrap.appendChild(d);
  });

  function showPhoto(i) {
    photoIdx = Math.max(0, Math.min(C.photos.length - 1, i));
    const p = C.photos[photoIdx];
    $("#photo-img").src = p.src;
    $("#photo-caption").textContent = p.caption;
    $("#photo-prev").disabled = photoIdx === 0;
    $("#photo-next").disabled = photoIdx === C.photos.length - 1;
    dotsWrap.querySelectorAll(".dot").forEach((d, di) => d.classList.toggle("on", di === photoIdx));

    seenPhotos.add(photoIdx);
    if (seenPhotos.size === C.photos.length) $("#btn-to-quiz").classList.remove("hidden");
  }
  $("#photo-prev").addEventListener("click", () => showPhoto(photoIdx - 1));
  $("#photo-next").addEventListener("click", () => showPhoto(photoIdx + 1));
  showPhoto(0);

  $("#btn-to-quiz").addEventListener("click", () => { startQuiz(); goToStage("quiz"); });

  // ---------- ③ O/X 퀴즈 ----------
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
    $("#quiz-progress").textContent = `문제 ${quizIdx + 1} / ${C.quiz.length} · 현재 ${quizScore}개 정답`;
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
      const result = $("#quiz-result");
      result.textContent = correct ? "🎉 정답!" : "😅 땡! 아쉬워~";
      result.className = "quiz-result " + (correct ? "correct" : "wrong");
      $("#quiz-explain").textContent = q.explain;
      $("#quiz-feedback").classList.remove("hidden");
      $("#btn-next-question").textContent =
        quizIdx === C.quiz.length - 1 ? "결과 보기 🏁" : "다음 문제 →";
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
    $("#quiz-score").textContent = `${C.quiz.length}문제 중 ${quizScore}개 정답!`;

    const passed = quizScore >= C.quizPassScore;
    $("#quiz-verdict").textContent = passed
      ? `${C.childName}에 대해 이만큼 안다니, 진짜 친구 인정! 💜 다음 관문으로 가자!`
      : `아직 ${C.childName}을(를) 조금 더 알아야 해! ${C.quizPassScore}개 이상 맞추면 통과야. 다시 도전해봐!`;
    $("#btn-quiz-pass").classList.toggle("hidden", !passed);
    $("#btn-quiz-retry").classList.toggle("hidden", passed);
  }

  $("#btn-quiz-pass").addEventListener("click", () => goToStage("teaser"));
  $("#btn-quiz-retry").addEventListener("click", startQuiz);

  // ---------- ④ 티저 ----------
  let teaserTimer = null;
  let teaserPlayed = false;

  function playTeaser() {
    if (teaserPlayed) return; // 뒤로 돌아와도 재생은 1회
    teaserPlayed = true;

    const lineEl = $("#teaser-line");
    const LINE_MS = 2300;
    let i = 0;

    function next() {
      if (i >= C.teaserLines.length) return endTeaser();
      const text = C.teaserLines[i];
      lineEl.textContent = text;
      lineEl.classList.toggle("finale", text.includes("JIA"));
      lineEl.classList.remove("show");
      void lineEl.offsetWidth; // 애니메이션 재시작 트릭
      lineEl.classList.add("show");
      i++;
      teaserTimer = setTimeout(next, LINE_MS);
    }
    next();
  }

  function endTeaser() {
    clearTimeout(teaserTimer);
    $("#teaser-screen").classList.add("hidden");
    const end = $("#teaser-end");
    end.classList.remove("hidden");

    const wrap = $("#hint-cards");
    if (!wrap.children.length) {
      C.teaserHints.forEach((emoji) => {
        const card = document.createElement("div");
        card.className = "hint-card";
        card.innerHTML =
          '<div class="hint-card-inner">' +
          '<div class="hint-face front">???</div>' +
          `<div class="hint-face back">${emoji}</div>` +
          "</div>";
        card.addEventListener("click", () => card.classList.toggle("flipped"));
        wrap.appendChild(card);
      });
    }
  }

  $("#btn-teaser-skip").addEventListener("click", endTeaser);
  $("#btn-to-form").addEventListener("click", () => goToStage("form"));

  // ---------- ⑤ 참가 신청 폼 ----------
  $("#rsvp-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    const errEl = $("#form-error");
    errEl.classList.add("hidden");

    const submitBtn = $("#btn-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "보내는 중...";

    if (C.formspreeEndpoint) {
      try {
        const res = await fetch(C.formspreeEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("전송 실패");
        showDone(data, false);
      } catch (err) {
        errEl.textContent = "앗, 전송에 실패했어요. 잠시 후 다시 시도해 주세요!";
        errEl.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = "🎉 신청하기";
      }
    } else {
      // 전송 서버가 없으면 문자/복사로 전달
      showDone(data, true);
    }
  });

  function rsvpText(data) {
    return (
      `[${C.partyTitle} 참가 신청]\n` +
      `친구 이름: ${data.childName}\n` +
      `보호자: ${data.parentName}\n` +
      `연락처: ${data.parentPhone}\n` +
      `참석 여부: ${data.attend}\n` +
      `참고사항: ${data.notes || "없음"}`
    );
  }

  function showDone(data, manual) {
    $("#done-date").textContent = C.partyDate;
    $("#done-time").textContent = C.partyTime;
    $("#done-place").textContent = C.partyPlace;
    $("#done-message").textContent =
      data.attend === "불참"
        ? `아쉽지만 마음만으로도 고마워! ${C.childName}이(가) 다음에 꼭 같이 놀재 💜`
        : `${data.childName} 친구, 파티에서 만나! ${C.childName}이(가) 엄청 기대하고 있어 💜`;

    if (C.isPoolParty && data.attend !== "불참") {
      $("#pool-notice").classList.remove("hidden");
      const ul = $("#pool-checklist");
      ul.innerHTML = "";
      C.poolChecklist.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
    }

    if (manual) {
      $("#manual-send").classList.remove("hidden");
      const text = rsvpText(data);
      $("#btn-sms").addEventListener("click", () => {
        location.href = `sms:${C.rsvpPhone}?body=${encodeURIComponent(text)}`;
      });
      $("#btn-copy").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch (e) {
          // 클립보드 권한이 없으면 선택 가능한 프롬프트로 대체
          window.prompt("아래 내용을 길게 눌러 복사하세요:", text);
        }
        $("#copy-done").classList.remove("hidden");
      });
      if (!C.rsvpPhone) $("#btn-sms").classList.add("hidden");
    }

    goToStage("done");
  }
})();
