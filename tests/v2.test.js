// v2(심플 버전) 무결성 테스트 — 공개 페이지 index.html + config-v2/main-v2
// 실행: npm test  (의존성 없음, node --test 사용)
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const html = read("index.html");
const PARTY = vm.runInNewContext(read("js/config-v2.js") + ";PARTY_CONFIG_V2", {});

test("v2: JS 파일이 문법 오류 없이 파싱된다", () => {
  for (const f of ["js/config-v2.js", "js/main-v2.js"]) {
    execFileSync("node", ["--check", path.join(ROOT, f)]);
  }
});

test("v2: main-v2.js와 mission.js가 참조하는 모든 요소 ID가 index.html에 존재한다", () => {
  const js = read("js/main-v2.js") + read("js/mission.js"); // 시크릿 HQ도 v2에서 동작
  const ids = [...new Set(
    [...js.matchAll(/(?:\$\(|querySelector\()['"]#([a-zA-Z0-9_-]+)/g)].map((m) => m[1])
  )];
  const missing = ids.filter((id) => !html.includes(`id="${id}"`));
  assert.deepStrictEqual(missing, [], `누락된 ID: ${missing.join(", ")}`);
});

test("v2: main-v2.js가 쓰는 PARTY_CONFIG_V2 키가 모두 정의되어 있다", () => {
  const keys = [...new Set([...read("js/main-v2.js").matchAll(/\bC\.([a-zA-Z]+)/g)].map((m) => m[1]))];
  const missing = keys.filter((k) => !(k in PARTY));
  assert.deepStrictEqual(missing, [], `config-v2.js 누락 키: ${missing.join(", ")}`);
});

test("v2: 퀴즈는 5문항, 정답 배열은 O-O-X-O-X, 통과 점수는 3이다", () => {
  assert.strictEqual(PARTY.quiz.length, 5);
  // vm 샌드박스 배열은 프로토타입이 달라 Array.from으로 현재 렐름 배열로 변환
  assert.deepStrictEqual(Array.from(PARTY.quiz, (q) => q.answer), [true, true, false, true, false]);
  assert.strictEqual(PARTY.quizPassScore, 3);
  for (const q of PARTY.quiz) {
    assert.strictEqual(typeof q.question, "string");
    assert.ok(q.explain.length > 0, "해설이 비어 있음");
  }
});

test("v2: 파티 정보(날짜·드롭오프·픽업·준비물)가 올바르다", () => {
  assert.match(PARTY.partyDate, /November 14/);
  assert.match(PARTY.partyTime, /4:00 PM/);
  assert.match(PARTY.dropOff, /Blue Lake Swimming Pool/i);
  assert.match(PARTY.pickupPlace, /14 Thunder Trail, Irvine/);
  assert.match(PARTY.pickupTime, /November 15.*10:30 AM/);
  assert.strictEqual(PARTY.bringList.length, 2);
  assert.ok(PARTY.bringList.some((b) => /swimsuit/i.test(b)), "수영복이 준비물에 없음");
  assert.ok(PARTY.bringList.some((b) => /pajamas/i.test(b)), "잠옷이 준비물에 없음");
});

test("v2: 퀴즈 제목과 RSVP 필수 입력이 index.html에 있다", () => {
  assert.ok(html.includes("Let's see if you know Jia!"), "퀴즈 제목이 없음");
  assert.ok(html.includes("Jia's Birthday Party"), "파티 타이틀이 없음");
  for (const name of ["childName", "parentName", "parentPhone", "attend"]) {
    assert.ok(html.includes(`name="${name}"`), `RSVP 입력 ${name} 없음`);
  }
  assert.ok((html.match(/name="attend"/g) || []).length >= 3, "참석 선택지가 3개 미만");
});

test("v2: RSVP 전송 엔드포인트(Formspree)가 설정되어 있다", () => {
  assert.match(PARTY.formspreeEndpoint, /^https:\/\/formspree\.io\/f\/\w+$/);
});
