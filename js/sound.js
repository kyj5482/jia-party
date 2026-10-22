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
      decodeSamples(); // ctx가 준비되면 폭죽 녹음 샘플 디코딩 시작 (1회)
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
      // Android Chrome: 첫 터치가 '완전한 상호작용'으로 집계되기 전에 resume()이
      // 거부되는 경우가 있어, 조금 뒤 한 번 더 시도 (Firework Simulator 기법)
      setTimeout(() => { if (ctx && ctx.state === "suspended") ctx.resume(); }, 250);
    }, { capture: true, passive: true }));

  // ---------- 실제 폭죽 녹음 샘플 (CC0) ----------
  // 웹 폭죽 데모 10여 곳 조사 결과의 공통 베스트 프랙티스 구조:
  // 역할별 사운드 뱅크(lift 발사 / burst 파열 / crackle 잔불)에서
  // 매번 다른 샘플을 재생속도·음량을 살짝 바꿔 재생 (Firework Simulator 방식).
  // 음원: OpenGameArt "25 CC0 bang/firework SFX" by rubberduck (퍼블릭 도메인)
  // https://opengameart.org/content/25-cc0-bang-firework-sfx
  const SFX_BANKS = {
    lift:    { files: ["lift1", "lift2", "lift3"], vol: 0.3, rateMin: 0.85, rateMax: 0.95 },
    burst:   { files: ["burst1", "burst2", "burst3", "burst4", "burst5", "burst6", "burst7", "burst8"],
               vol: 1.0, rateMin: 0.8, rateMax: 0.9 },
    crackle: { files: ["crackle1"], vol: 0.25, rateMin: 0.95, rateMax: 1.05 },
  };
  Object.values(SFX_BANKS).forEach((b) => { b.buffers = []; b.last = -1; });

  // 네트워크 선로딩은 페이지 로드 직후 시작 (디코딩은 ctx가 생긴 뒤)
  const sfxFetch = window.fetch
    ? Promise.all(Object.entries(SFX_BANKS).map(([name, b]) =>
        Promise.all(b.files.map((f) =>
          fetch(`assets/sfx/${f}.mp3`).then((r) => { if (!r.ok) throw new Error(f); return r.arrayBuffer(); })
        )).then((abs) => [name, abs])
      )).catch(() => null)
    : Promise.resolve(null);
  let decodeStarted = false;
  function decodeSamples() {
    if (decodeStarted || !ctx) return;
    decodeStarted = true;
    sfxFetch.then((banks) => {
      if (!banks) return; // 로드 실패 → 합성음 폴백 사용
      banks.forEach(([name, abs]) => abs.forEach((ab) => {
        // 콜백형 decodeAudioData — 구형 iOS Safari 호환
        try { ctx.decodeAudioData(ab, (b) => SFX_BANKS[name].buffers.push(b), () => {}); } catch (e) {}
      }));
    });
  }

  // 뱅크에서 직전과 다른 샘플을 골라 재생. 재생 성공 시 true.
  function playBank(name, { volScale = 1, delay = 0 } = {}) {
    const bank = SFX_BANKS[name];
    if (!bank.buffers.length) return false;
    let i = (Math.random() * bank.buffers.length) | 0;
    if (bank.buffers.length > 1 && i === bank.last) i = (i + 1) % bank.buffers.length;
    bank.last = i;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = bank.buffers[i];
    src.playbackRate.value = bank.rateMin + Math.random() * (bank.rateMax - bank.rateMin);
    const g = ctx.createGain();
    g.gain.value = bank.vol * volScale * (0.85 + Math.random() * 0.3);
    src.connect(g).connect(master);
    src.start(t0);
    return true;
  }

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
    // ---------- 불꽃놀이 (조사한 베스트 프랙티스: 역할별 녹음 뱅크) ----------
    // 발사음: 포신에서 쏘아 올리는 "퉁!" (낮은 피치·작은 음량의 실제 포성)
    launch() {
      if (!ensure()) return;
      if (playBank("lift")) return;
      // 폴백: 짧은 상승 휘익 (합성)
      noise({ dur: 0.45, vol: 0.12, from: 300, to: 1800, type: "bandpass" });
    },
    // 파열음: 실제 파열 녹음 8종 중 직전과 다른 것 + 때때로 잔불 크래클 레이어
    boom() {
      if (!ensure()) return;
      if (playBank("burst")) {
        if (Math.random() < 0.45) playBank("crackle", { delay: 0.1 + Math.random() * 0.15 });
        return;
      }
      // 폴백 (샘플 로딩 전/실패): 합성 — 파열 + 잔향 + 크래클
      const v = 0.8 + Math.random() * 0.4;
      noise({ dur: 0.05, vol: 0.45 * v, from: 8000, to: 4000, type: "highpass" });
      noise({ dur: 1.5, vol: 0.5 * v, from: 6000, to: 110 });
      noise({ dur: 2.4, vol: 0.18 * v, from: 350, to: 45, delay: 0.12 });
      for (let i = 0, pops = 16 + ((Math.random() * 14) | 0); i < pops; i++) {
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
    // ---------- 진단 ----------
    get _boomsReady() { // 디코딩된 폭죽 샘플 수 (전 뱅크 합산)
      return Object.values(SFX_BANKS).reduce((n, b) => n + b.buffers.length, 0);
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
