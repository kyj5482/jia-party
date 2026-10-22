// ============================================================
//  Jia 사운드 엔진 — Web Audio API 합성 효과음 (음원 파일 불필요)
//  브라우저 자동재생 정책상 첫 사용자 터치 이후에 소리가 켜집니다.
// ============================================================

window.JiaSound = (function () {
  let ctx = null;
  let master = null;
  // 음소거는 세션 단위로만 기억 — 실수로 누른 음소거가 다음 방문까지
  // 남아 "소리가 아예 안 나요"가 되는 것을 방지 (예전엔 localStorage 영구 저장)
  let muted = sessionStorage.getItem("jia_muted") === "1";

  function ensure() {
    if (muted) return false;
    try {
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
    } catch (e) {
      return false; // 오디오가 실패해도 화면 동작(클릭 핸들러)은 절대 막지 않음
    }
  }

  // iOS 무음(진동) 스위치 대응: Web Audio는 iOS에서 무음 스위치에 걸려
  // 통째로 음소거되지만 <audio> 태그 재생은 걸리지 않는다. 첫 제스처에서
  // 무음 WAV를 루프 재생해 오디오 세션을 '미디어 재생'으로 승격시키면
  // 무음 스위치가 켜져 있어도 Web Audio 효과음이 들린다.
  let mediaUnlocked = false;
  function unlockMediaSession() {
    if (mediaUnlocked) return;
    mediaUnlocked = true;
    try {
      const a = document.createElement("audio");
      a.setAttribute("playsinline", "");
      a.loop = true;
      // 0.05초 무음 WAV (8kHz 8-bit mono)
      a.src = "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";
      const p = a.play();
      if (p && p.catch) p.catch(() => { mediaUnlocked = false; });
    } catch (e) {
      mediaUnlocked = false;
    }
  }

  // 첫 제스처에서 오디오 활성화 — iOS 버전에 따라 인정되는 제스처가 달라
  // 여러 이벤트에 걸어둔다 (pointerdown만으로는 일부 iOS에서 잠금 해제 실패)
  ["pointerdown", "touchend", "click", "keydown"].forEach((ev) =>
    document.addEventListener(ev, () => {
      if (muted) return;
      unlockMediaSession();
      ensure();
    }, { capture: true, passive: true }));

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
    // 실제 폭죽 구조: ① 광대역 "빵!" 파열 → ② 길게 울리는 잔향 → ③ 잔불 "타다닥"
    // 순음(사인파) 저음은 북소리처럼 들려서 쓰지 않음 — 전부 노이즈 기반
    boom() {
      const v = 0.8 + Math.random() * 0.4; // 발마다 크기가 조금씩 다르게
      // ① 파열 "빵!" — 밝은 광대역 노이즈가 순간 터진 뒤 스펙트럼이 어두워지며 감쇠
      noise({ dur: 0.05, vol: 0.45 * v, from: 8000, to: 4000, type: "highpass" });
      noise({ dur: 1.5, vol: 0.5 * v, from: 6000, to: 110 });
      // ② 멀리 울리는 잔향 "우르르릉" (저역 노이즈, 살짝 늦게)
      noise({ dur: 2.4, vol: 0.18 * v, from: 350, to: 45, delay: 0.12 });
      // ③ 잔불이 터지는 "타다닥" 크래클 — 폭죽임을 결정짓는 소리
      const pops = 16 + ((Math.random() * 14) | 0);
      for (let i = 0; i < pops; i++) {
        noise({
          dur: 0.015 + Math.random() * 0.03,
          vol: 0.05 + Math.random() * 0.12,
          from: 2500 + Math.random() * 5500,
          to: 1800,
          type: "bandpass",
          delay: 0.1 + Math.random() * 1.2,
        });
      }
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
      sessionStorage.setItem("jia_muted", muted ? "1" : "0");
      if (!muted) { unlockMediaSession(); ensure(); api.tap(); }
      return muted;
    },
  };
  return api;
})();
