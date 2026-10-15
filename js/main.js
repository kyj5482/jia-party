// ============================================================
//  Jia The Best World Party — 메인 로직 (관문 진행)
// ============================================================

(function () {
  const C = PARTY_CONFIG;
  const $ = (sel) => document.querySelector(sel);

  // ---------- 단계 전환 ----------
  const STEP_ORDER = ["photos", "quiz", "teaser", "form"];
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
    if (name === "teaser") playTeaser();
    if (name === "done") JiaFX.startConfetti($("#confetti"));
  }

  // 진행 단계 탭: 이미 도달했던 단계로 되돌아가면 그 단계의 처음부터 다시
  document.querySelectorAll("#progress .step").forEach((el) => {
    el.addEventListener("click", () => {
      const step = el.dataset.step;
      const stepIdx = STEP_ORDER.indexOf(step);
      if (rsvpDone || stepIdx > maxReachedIdx) return;

      if (step === "photos") {
        // Meet Jia는 사이트 맨 첫 화면(불꽃 인트로)부터
        showPhoto(0);
        goToStage("intro");
      } else if (step === "quiz") {
        startQuiz();
        goToStage("quiz");
      } else if (step === "teaser") {
        replayTeaser();
      } else {
        goToStage(step);
      }
    });
  });

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
  $("#photo-prev").addEventListener("click", () => slidePhoto(-1));
  $("#photo-next").addEventListener("click", () => slidePhoto(1));

  // 사진 전환: 현재 카드가 밀려 나가고 새 사진이 반대편에서 들어옴
  const photoCardEl = $("#photo-card");
  let photoSliding = false;

  function slidePhoto(dir) {
    const target = photoIdx + dir;
    if (photoSliding || target < 0 || target >= C.photos.length) return;
    photoSliding = true;
    photoCardEl.style.transition = "transform 0.18s ease-in, opacity 0.18s ease-in";
    photoCardEl.style.transform = `translateX(${-dir * 140}px) rotate(-1deg)`;
    photoCardEl.style.opacity = "0";
    setTimeout(() => {
      showPhoto(target);
      photoCardEl.style.transition = "none";
      photoCardEl.style.transform = `translateX(${dir * 90}px) rotate(-1deg)`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        photoCardEl.style.transition = "transform 0.22s ease-out, opacity 0.22s ease-out";
        photoCardEl.style.transform = "";
        photoCardEl.style.opacity = "";
        setTimeout(() => { photoSliding = false; }, 230);
      }));
    }, 180);
  }

  // 좌우 스와이프: 손가락을 따라 카드가 끌려오고, 임계값을 넘으면 전환
  // 사진 단계 화면 전체에서 동작 (touch-action: pan-y라 세로 스크롤과 공존)
  const photoStage = $("#stage-photos");
  let swipeStartX = 0, swipeStartY = 0;
  let swipeHoriz = null; // 가로 제스처인지 판정 결과 (null = 미판정)

  photoStage.addEventListener("touchstart", (e) => {
    if (photoSliding) return;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    swipeHoriz = null;
    photoCardEl.style.transition = "none";
  }, { passive: true });

  photoStage.addEventListener("touchmove", (e) => {
    if (photoSliding) return;
    const dx = e.touches[0].clientX - swipeStartX;
    const dy = e.touches[0].clientY - swipeStartY;
    if (swipeHoriz === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      swipeHoriz = Math.abs(dx) > Math.abs(dy);
    }
    if (!swipeHoriz) return;
    // 첫/마지막 사진에서 더 가려고 하면 1/3로 저항감
    const atEdge = (dx > 0 && photoIdx === 0) || (dx < 0 && photoIdx === C.photos.length - 1);
    const move = atEdge ? dx / 3 : dx;
    photoCardEl.style.transform = `translateX(${move}px) rotate(-1deg)`;
    photoCardEl.style.opacity = String(Math.max(0.45, 1 - Math.abs(move) / 320));
  }, { passive: true });

  function endSwipe(e) {
    if (photoSliding || swipeHoriz === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX;
    const atEdge = (dx > 0 && photoIdx === 0) || (dx < 0 && photoIdx === C.photos.length - 1);
    if (swipeHoriz && Math.abs(dx) > 55 && !atEdge) {
      slidePhoto(dx < 0 ? 1 : -1);
    } else {
      // 임계값 미달 또는 끝 사진: 제자리로 복귀
      photoCardEl.style.transition = "transform 0.25s ease, opacity 0.25s ease";
      photoCardEl.style.transform = "";
      photoCardEl.style.opacity = "";
    }
    swipeHoriz = null;
  }
  photoStage.addEventListener("touchend", endSwipe, { passive: true });
  photoStage.addEventListener("touchcancel", endSwipe, { passive: true });

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
      ? `You really know ${C.childName} — true friend confirmed! 💜 On to the next challenge!`
      : `Hmm, you need to know ${C.childName} a little better! Get ${C.quizPassScore} or more to pass. Try again!`;
    $("#btn-quiz-pass").classList.toggle("hidden", !passed);
    $("#btn-quiz-retry").classList.toggle("hidden", passed);
  }

  $("#btn-quiz-pass").addEventListener("click", () => goToStage("teaser"));
  $("#btn-quiz-retry").addEventListener("click", startQuiz);

  // ---------- ④ 티저 ----------
  let teaserTimer = null;
  let teaserPlayed = false;

  function playTeaser() {
    if (teaserPlayed) return; // 뒤로 돌아와도 재생은 1회 (replayTeaser로 재생 가능)
    teaserPlayed = true;

    const lineEl = $("#teaser-line");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const WORD_STEP = reduced ? 0 : 110; // 단어별 등장 간격(ms)
    let i = 0;
    let heartbeatShown = false;

    function next() {
      if (i >= C.teaserLines.length) return endTeaser();

      // 마지막 문장 직전: 💜 하트가 심장박동처럼 두 번 뛰는 두근두근 연출
      const isLast = i === C.teaserLines.length - 1;
      if (isLast && !heartbeatShown && !reduced) {
        heartbeatShown = true;
        lineEl.classList.remove("finale");
        // 직전 문장의 페이드아웃 transition이 하트 등장까지 늦추지 않도록
        // 투명도를 즉시 복귀시키고, 등장 연출은 heart-in 애니메이션에 맡김
        lineEl.style.transition = "none";
        lineEl.classList.remove("out");
        void lineEl.offsetWidth;
        lineEl.style.transition = "";
        lineEl.textContent = "";
        const heart = document.createElement("span");
        heart.className = "teaser-heart";
        heart.textContent = "💜";
        lineEl.appendChild(heart);
        // heart-in 0.25s + 박동 1s×2 = 2.25s가 끝까지 재생되도록 2.4s 유지
        teaserTimer = setTimeout(() => {
          lineEl.classList.add("out");
          teaserTimer = setTimeout(next, 300);
        }, 2400);
        return;
      }

      const text = C.teaserLines[i];
      const finale = text.includes("JIA");
      lineEl.classList.toggle("finale", finale);
      lineEl.classList.remove("out");

      // 단어 단위로 쪼개 스태거 등장 (줄바꿈은 pre-line으로 유지)
      lineEl.textContent = "";
      let w = 0;
      text.split("\n").forEach((seg, si) => {
        if (si > 0) lineEl.appendChild(document.createTextNode("\n"));
        seg.split(" ").forEach((word, wi) => {
          if (wi > 0) lineEl.appendChild(document.createTextNode(" "));
          const span = document.createElement("span");
          span.className = "tw";
          span.textContent = word;
          span.style.animationDelay = `${w * WORD_STEP}ms`;
          lineEl.appendChild(span);
          w++;
        });
      });

      // 등장 완료 후, 문장 길이에 비례해 선명하게 멈춘 채 읽을 시간을 줌
      const inMs = w * WORD_STEP + 380;
      const holdMs = Math.max(1100, 650 + text.length * 45);
      const outMs = 350;
      i++;
      teaserTimer = setTimeout(() => {
        lineEl.classList.add("out");
        teaserTimer = setTimeout(next, outMs);
      }, inMs + holdMs);
    }
    next();
  }

  function replayTeaser() {
    clearTimeout(teaserTimer);
    teaserPlayed = false;
    $("#teaser-screen").classList.remove("hidden");
    $("#teaser-end").classList.add("hidden");
    $("#teaser-line").classList.remove("out");
    goToStage("teaser"); // goToStage가 playTeaser()를 다시 호출
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
    submitBtn.textContent = "Sending...";

    if (C.formspreeEndpoint) {
      try {
        const res = await fetch(C.formspreeEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("send failed");
        showDone(data, false);
      } catch (err) {
        errEl.textContent = "Oops, sending failed. Please try again in a moment!";
        errEl.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = "🎉 Send RSVP";
      }
    } else {
      // 전송 서버가 없으면 문자/복사로 전달
      showDone(data, true);
    }
  });

  function rsvpText(data) {
    return (
      `[${C.partyTitle} RSVP]\n` +
      `Friend: ${data.childName}\n` +
      `Parent: ${data.parentName}\n` +
      `Phone: ${data.parentPhone}\n` +
      `Attending: ${data.attend}\n` +
      `Notes: ${data.notes || "None"}`
    );
  }

  function showDone(data, manual) {
    $("#done-date").textContent = C.partyDate;
    $("#done-time").textContent = C.partyTime;
    $("#done-place").textContent = C.partyPlace;
    $("#done-message").textContent =
      data.attend === "No"
        ? `We'll miss you! Thanks for letting us know — ${C.childName} says let's play together soon 💜`
        : `See you at the party, ${data.childName}! ${C.childName} is SO excited 💜`;

    if (C.isPoolParty && data.attend !== "No") {
      $("#pool-notice").classList.remove("hidden");
      const ul = $("#pool-checklist");
      ul.innerHTML = "";
      C.poolChecklist.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
    }

    rsvpDone = true; // 완료 후 단계 이동 잠금

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
          window.prompt("Press and hold to copy the text below:", text);
        }
        $("#copy-done").classList.remove("hidden");
      });
      if (!C.rsvpPhone) $("#btn-sms").classList.add("hidden");
    }

    goToStage("done");
  }
})();
