// ============================================================
//  Jia 사운드 엔진 — Web Audio API 합성 효과음 (음원 파일 불필요)
//  브라우저 자동재생 정책상 첫 사용자 터치 이후에 소리가 켜집니다.
// ============================================================

window.JiaSound = (function () {
  let ctx = null;
  let master = null;
  let muted = localStorage.getItem("jia_muted") === "1";

  function ensure() {
    if (muted) return false;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      // 컴프레서: 폭죽 여러 발이 겹쳐도 소리가 찌그러지지 않게 피크를 눌러줌
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 18;
      comp.ratio.value = 6;
      master.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx.state !== "suspended";
  }
  // 첫 제스처에서 오디오 컨텍스트 활성화
  document.addEventListener("pointerdown", () => { if (!muted) ensure(); }, { capture: true });

  // 단일 톤 (주파수 슬라이드/감쇠 지원)
  function tone({ freq = 440, to = null, dur = 0.15, type = "sine", vol = 0.18, delay = 0 }) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // 노이즈 (폭발/휘익 효과)
  function noise({ dur = 0.4, vol = 0.25, from = 400, to = 100, type = "lowpass", delay = 0 }) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(to, 30), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(master);
    src.start(t0);
  }

  const api = {
    // ---------- 공통 UI ----------
    tap() { tone({ freq: 620, to: 500, dur: 0.06, type: "triangle", vol: 0.08 }); },
    key() { tone({ freq: 540, dur: 0.07, type: "square", vol: 0.06 }); },
    type() { tone({ freq: 1400 + Math.random() * 500, dur: 0.015, type: "square", vol: 0.025 }); },
    wrong() { tone({ freq: 180, to: 110, dur: 0.3, type: "sawtooth", vol: 0.12 }); },
    success() {
      [523, 659, 784, 1046].forEach((f, i) =>
        tone({ freq: f, dur: 0.22, type: "triangle", vol: 0.14, delay: i * 0.09 }));
    },
    unlock() {
      tone({ freq: 392, dur: 0.3, type: "triangle", vol: 0.12 });
      tone({ freq: 587, dur: 0.3, type: "triangle", vol: 0.12, delay: 0.02 });
      tone({ freq: 784, dur: 0.45, type: "triangle", vol: 0.12, delay: 0.12 });
    },
    sparkle() {
      [880, 1175, 1568, 2093].forEach((f, i) =>
        tone({ freq: f, dur: 0.14, type: "sine", vol: 0.11, delay: i * 0.06 }));
    },
    fanfare() {
      [392, 523, 659, 784].forEach((f, i) =>
        tone({ freq: f, dur: 0.3, type: "triangle", vol: 0.15, delay: i * 0.12 }));
      tone({ freq: 1046, dur: 0.8, type: "triangle", vol: 0.16, delay: 0.5 });
      noise({ dur: 0.6, vol: 0.1, from: 2000, to: 300, delay: 0.5 });
    },
    // ---------- 불꽃놀이 ----------
    launch() { noise({ dur: 0.45, vol: 0.14, from: 300, to: 1800, type: "bandpass" }); },
    boom() {
      // 고역 파열음 "딱!" — 휴대폰 스피커는 저음을 거의 못 내므로 이게 체감 음량을 좌우
      noise({ dur: 0.12, vol: 0.4, from: 3500, to: 900, type: "bandpass" });
      // 폭발 본체 (중역 위주로 시작해 낮게 깔림)
      noise({ dur: 0.8, vol: 0.5, from: 1600, to: 80 });
      // 저역 울림 (좋은 스피커에서 몸으로 느끼는 "쿵")
      tone({ freq: 110, to: 45, dur: 0.6, type: "sine", vol: 0.3 });
    },
    // ---------- 미로 ----------
    step() { tone({ freq: 260, dur: 0.03, type: "square", vol: 0.04 }); },
    bump() { tone({ freq: 95, to: 60, dur: 0.12, type: "square", vol: 0.1 }); },
    switch() {
      tone({ freq: 660, dur: 0.18, type: "triangle", vol: 0.12 });
      tone({ freq: 550, dur: 0.25, type: "triangle", vol: 0.12, delay: 0.18 });
    },
    // ---------- 시몬: 패드별 고정 음계 (펜타토닉) ----------
    simon(i) {
      const scale = [392, 494, 587, 784]; // G4 B4 D5 G5
      tone({ freq: scale[i % 4], dur: 0.3, type: "triangle", vol: 0.16 });
    },
    // ---------- 음소거 ----------
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      localStorage.setItem("jia_muted", muted ? "1" : "0");
      if (!muted) { ensure(); api.tap(); }
      return muted;
    },
  };
  return api;
})();
