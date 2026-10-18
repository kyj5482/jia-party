// 아이들(미국 6학년) 관점 품질 테스트
// — 읽기 분량, 입력 부담, 선택지 개수, 부모 안내 완결성 등
// 미국 파티 벤치마크 기반: 수영 능력 확인, 사진 동의, 성인 감독 안내 등
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const html = read("index.html");
const PARTY = vm.runInNewContext(read("js/config.js") + ";PARTY_CONFIG", {});
const MISSION = vm.runInNewContext(read("js/mission-config.js") + ";MISSION_CONFIG", {});

const words = (s) => s.trim().split(/\s+/).length;
function radioCount(name) {
  return (html.match(new RegExp(`name="${name}"`, "g")) || []).length;
}

// ---------- 부모 커뮤니케이션 (미국 관행) ----------
test("RSVP: 수영 능력 질문이 있고 선택지가 3개다 (풀파티 안전 관행)", () => {
  assert.strictEqual(radioCount("swim"), 3, "swim 라디오가 3개가 아님");
});

test("RSVP: 사진 공유 동의 질문이 있다 (미국 부모 민감 사항)", () => {
  assert.ok(radioCount("photos") >= 2, "photos 동의 라디오가 2개 미만");
});

test("RSVP: 슬립오버/참석 선택지가 각각 2개 이상이다", () => {
  assert.ok(radioCount("sleepover") >= 2);
  assert.ok(radioCount("attend") >= 3);
});

test("부모 안내: 성인 감독·픽업·취침 문구가 설정에 있다", () => {
  for (const k of ["poolSupervision", "partyOnlyPickup", "bedtimeNote", "hostContact"]) {
    assert.ok(k in PARTY, `config.js에 ${k} 없음`);
  }
  assert.ok(/adult/i.test(PARTY.poolSupervision), "성인 감독 명시가 없음");
  assert.ok(/pickup/i.test(PARTY.partyOnlyPickup), "픽업 안내가 없음");
});

// ---------- 읽기 분량 (6학년 집중력) ----------
test("미션 설명은 75단어 이하다 (타이핑 연출 중 집중 유지)", () => {
  MISSION.missions.forEach((m, i) => {
    assert.ok(words(m.intro) <= 75, `미션 ${i + 1} intro가 ${words(m.intro)}단어 — 75단어 이하로 줄이세요`);
  });
});

test("힌트는 한 번에 읽을 분량(160자 이하)이다", () => {
  MISSION.missions.forEach((m, i) =>
    (m.hints || []).forEach((h, j) =>
      assert.ok(h.length <= 160, `미션 ${i + 1} 힌트 ${j + 1}이 ${h.length}자 — 너무 긺`)));
});

test("티저는 5~12줄, 각 줄은 60자 이하다 (예고편 리듬)", () => {
  const L = PARTY.teaserLines;
  assert.ok(L.length >= 5 && L.length <= 12, `티저가 ${L.length}줄`);
  L.forEach((l) => assert.ok(l.length <= 60, `티저 줄이 너무 긺: ${l}`));
});

test("퀴즈 해설은 설명이 되는 길이(15자 이상)다 — 틀려도 배우게", () => {
  PARTY.quiz.forEach((q, i) =>
    assert.ok(q.explain.length >= 15, `퀴즈 ${i + 1} 해설이 너무 짧음`));
});

// ---------- 입력·선택 부담 ----------
test("봉투 코드는 8자 이하 한 단어다 (태블릿 입력 부담 최소화)", () => {
  MISSION.missions.slice(0, -1).forEach((m, i) => {
    assert.ok(m.gateCode.length <= 8 && !/\s/.test(m.gateCode),
      `미션 ${i + 1} gateCode '${m.gateCode}' — 8자 이하 한 단어로`);
  });
});

test("문스톤 보기는 2~4개다 (고르기 쉬운 수)", () => {
  for (const m of MISSION.missions.filter((x) => x.kind === "maze")) {
    (m.moonstones || []).forEach((r, i) =>
      assert.ok(r.options.length >= 2 && r.options.length <= 4, `문스톤 ${i + 1} 보기 ${r.options.length}개`));
  }
});

test("시몬 라운드는 4~8이다 (성취 가능한 도전)", () => {
  for (const m of MISSION.missions.filter((x) => x.kind === "simon")) {
    assert.ok(m.rounds >= 4 && m.rounds <= 8, `rounds=${m.rounds}`);
  }
});

// ---------- 피치덱 (지아 설득용) ----------
test("피치덱: 의사결정 3세트(트레이드오프 포함)와 승인 버튼이 있다", () => {
  const pitch = read("pitch/index.html");
  const pickSlides = (pitch.match(/data-pick="/g) || []).length;
  assert.strictEqual(pickSlides, 3, "의사결정 슬라이드가 3개가 아님");
  const pros = (pitch.match(/class="pro"/g) || []).length;
  const cons = (pitch.match(/class="con"/g) || []).length;
  assert.ok(pros >= 9 && cons >= 9, "모든 선택지에 장점/고려(트레이드오프)가 있어야 함");
  assert.ok(pitch.includes('id="btn-go"'), "GO 승인 버튼 없음");
  assert.ok(pitch.includes("APPROVED BY JIA"), "승인 도장 없음");
});

test("피치덱: 플래너 교육 요소가 모두 포함되어 있다 (벤치마크)", () => {
  const pitch = read("pitch/index.html");
  const required = [
    "THE BRIEF",            // 세 가지 질문 프레임
    "Peak-End",             // 피크엔드 법칙
    "RUN OF SHOW",          // 3막 런 오브 쇼
    "ANTICIPATION",         // 기대감 설계
    "SAFETY",               // 안전 = 신뢰
    "INCLUSION",            // 포용 설계
    "RISK PLAN",            // 리스크 대비
    "TIMELINE",             // 실행 타임라인
    "SIGN-OFF",             // 디렉터 승인
  ];
  for (const marker of required) {
    assert.ok(pitch.includes(marker), `피치덱에 '${marker}' 섹션이 없음`);
  }
});
