// 설정/콘텐츠 무결성 테스트 — 부모가 config를 수정해도 깨지지 않는지 보증
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
const PARTY = vm.runInNewContext(read("js/config.js") + ";PARTY_CONFIG", {});
const MISSION = vm.runInNewContext(read("js/mission-config.js") + ";MISSION_CONFIG", {});

test("모든 JS 파일이 문법 오류 없이 파싱된다", () => {
  for (const f of ["js/config.js", "js/mission-config.js", "js/fireworks.js", "js/mission.js", "js/main.js"]) {
    execFileSync("node", ["--check", path.join(ROOT, f)]);
  }
});

test("JS가 참조하는 모든 요소 ID가 index.html에 존재한다", () => {
  const js = read("js/main.js") + read("js/mission.js");
  const ids = [...new Set(
    [...js.matchAll(/(?:\$\(|querySelector\()['"]#([a-zA-Z0-9_-]+)/g)].map((m) => m[1])
  )];
  const missing = ids.filter((id) => !html.includes(`id="${id}"`));
  assert.deepStrictEqual(missing, [], `누락된 ID: ${missing.join(", ")}`);
});

test("main.js가 쓰는 PARTY_CONFIG 키가 모두 정의되어 있다", () => {
  const keys = [...new Set([...read("js/main.js").matchAll(/\bC\.([a-zA-Z]+)/g)].map((m) => m[1]))];
  const missing = keys.filter((k) => !(k in PARTY));
  assert.deepStrictEqual(missing, [], `config.js 누락 키: ${missing.join(", ")}`);
});

test("mission.js가 쓰는 MISSION_CONFIG 키가 모두 정의되어 있다", () => {
  const keys = [...new Set([...read("js/mission.js").matchAll(/\bM\.([a-zA-Z]+)/g)].map((m) => m[1]))];
  const missing = keys.filter((k) => !(k in MISSION));
  assert.deepStrictEqual(missing, [], `mission-config.js 누락 키: ${missing.join(", ")}`);
});

test("퀴즈: 형식이 올바르고 통과 점수가 문항 수 이하이다", () => {
  assert.ok(PARTY.quiz.length >= 3, "퀴즈는 3문항 이상");
  for (const q of PARTY.quiz) {
    assert.strictEqual(typeof q.question, "string");
    assert.strictEqual(typeof q.answer, "boolean");
    assert.ok(q.explain.length > 0, "해설이 비어 있음");
  }
  assert.ok(PARTY.quizPassScore <= PARTY.quiz.length, "통과 점수가 문항 수보다 큼");
});

test("사진: 모든 src 파일이 실제로 존재한다", () => {
  for (const p of PARTY.photos) {
    assert.ok(fs.existsSync(path.join(ROOT, p.src)), `사진 파일 없음: ${p.src}`);
  }
});

test("티저: 피날레 줄에 'JIA'가 포함된다 (그라데이션 트리거)", () => {
  assert.ok(PARTY.teaserLines.some((l) => l.includes("JIA")), "finale 스타일이 적용될 줄이 없음");
});

test("HQ PIN은 3~8자리 숫자이다", () => {
  assert.match(MISSION.pin, /^\d{3,8}$/);
});

test("미션 체인: 마지막을 제외한 모든 미션에 clue/gateCode/gatePrompt가 있다", () => {
  const ms = MISSION.missions;
  assert.ok(ms.length >= 2, "미션은 2개 이상");
  ms.slice(0, -1).forEach((m, i) => {
    assert.ok(m.clue && m.clue.length > 0, `미션 ${i + 1}: clue 없음`);
    assert.ok(m.gateCode && m.gateCode.length > 0, `미션 ${i + 1}: gateCode 없음`);
    assert.ok(m.gatePrompt && m.gatePrompt.length > 0, `미션 ${i + 1}: gatePrompt 없음`);
  });
  const codes = ms.slice(0, -1).map((m) => m.gateCode.toUpperCase());
  assert.strictEqual(new Set(codes).size, codes.length, "봉투 코드가 중복됨");
});

test("미션 종류별 필수 필드: code→answer, simon→rounds, maze→maze", () => {
  MISSION.missions.forEach((m, i) => {
    if (m.kind === "code") assert.ok(m.answer && m.answer.length > 0, `미션 ${i + 1}: answer 없음`);
    if (m.kind === "simon") assert.ok(m.rounds >= 3 && m.rounds <= 10, `미션 ${i + 1}: rounds는 3~10`);
    if (m.kind === "maze") assert.ok(Array.isArray(m.maze), `미션 ${i + 1}: maze 없음`);
  });
});

test("자물쇠 번호가 마지막 미션 정답과 일치한다", () => {
  const last = MISSION.missions[MISSION.missions.length - 1];
  assert.strictEqual(MISSION.final.lockCode, last.answer,
    "final.lockCode와 마지막 미션 answer가 다름 — 실제 자물쇠와 어긋납니다!");
});

test("미로: 직사각형이고 S/K가 하나씩 있으며 BFS로 풀 수 있다", () => {
  for (const m of MISSION.missions.filter((x) => x.kind === "maze")) {
    const maze = m.maze;
    const W = maze[0].length;
    assert.ok(maze.every((r) => r.length === W), "미로 행 길이가 다름");
    const flat = maze.join("");
    assert.strictEqual([...flat].filter((c) => c === "S").length, 1, "S는 정확히 1개");
    assert.strictEqual([...flat].filter((c) => c === "K").length, 1, "K는 정확히 1개");
    // 테두리는 모두 벽 (플레이어 이탈 방지)
    assert.ok(/^#+$/.test(maze[0]) && /^#+$/.test(maze[maze.length - 1]), "상/하단 테두리가 벽이 아님");
    assert.ok(maze.every((r) => r[0] === "#" && r[W - 1] === "#"), "좌/우 테두리가 벽이 아님");
    // BFS 풀이 가능성
    let S, K;
    maze.forEach((r, y) => [...r].forEach((c, x) => {
      if (c === "S") S = [y, x];
      if (c === "K") K = [y, x];
    }));
    const seen = new Set([S.join()]);
    const q = [S];
    let found = false;
    while (q.length) {
      const [y, x] = q.shift();
      if (y === K[0] && x === K[1]) { found = true; break; }
      for (const [dy, dx] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const ny = y + dy, nx = x + dx;
        if (maze[ny] && maze[ny][nx] !== "#" && !seen.has(`${ny},${nx}`)) {
          seen.add(`${ny},${nx}`);
          q.push([ny, nx]);
        }
      }
    }
    assert.ok(found, "미로를 풀 수 없음 — S에서 K까지 길이 없습니다");
  }
});
