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

// v1(미스터리 슬립오버)은 v1.html로 보존 — 현재 공개 페이지(index.html)는 v2
const html = read("v1.html");
const PARTY = vm.runInNewContext(read("js/config.js") + ";PARTY_CONFIG", {});
const MISSION = vm.runInNewContext(read("js/mission-config.js") + ";MISSION_CONFIG", {});

test("모든 JS 파일이 문법 오류 없이 파싱된다", () => {
  for (const f of ["js/config.js", "js/mission-config.js", "js/sound.js", "js/fireworks.js", "js/mission.js", "js/main.js"]) {
    execFileSync("node", ["--check", path.join(ROOT, f)]);
  }
});

test("JS가 참조하는 모든 요소 ID가 v1.html에 존재한다", () => {
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

test("효과음: sound.js가 참조하는 폭죽 녹음 샘플이 모두 존재한다", () => {
  const js = read("js/sound.js");
  const m = js.match(/\[([\d,\s]+)\]\.map\(\(i\) => `assets\/sfx\/boom\$\{i\}\.mp3`\)/);
  assert.ok(m, "sound.js에서 샘플 URL 목록을 찾지 못함");
  for (const i of m[1].split(",").map((s) => s.trim())) {
    const f = `assets/sfx/boom${i}.mp3`;
    assert.ok(fs.existsSync(path.join(ROOT, f)), `샘플 파일 없음: ${f}`);
    assert.ok(fs.statSync(path.join(ROOT, f)).size > 5000, `샘플 파일이 너무 작음: ${f}`);
  }
});

test("티저: 피날레 줄에 'JIA'가 포함된다 (그라데이션 트리거)", () => {
  assert.ok(PARTY.teaserLines.some((l) => l.includes("JIA")), "finale 스타일이 적용될 줄이 없음");
});

test("HQ PIN은 3~8자리 숫자이다", () => {
  assert.match(MISSION.pin, /^\d{3,8}$/);
});

test("타이프라이터: 그래핌 단위 분할로 이모지가 깨지지 않는다", () => {
  // mission.js가 그래핌 분할(Intl.Segmenter)을 쓰는지 — line[ci] 식의
  // 코드 유닛 인덱싱은 이모지를 반쪽으로 잘라 ㅁ로 표시되게 함
  const js = read("js/mission.js");
  assert.ok(js.includes("Intl.Segmenter"), "mission.js에 그래핌 분할이 없음");
  assert.ok(!/lines?\[li\]\[ci\]|line\[ci\]/.test(js), "코드 유닛 단위 인덱싱이 남아 있음");
  // 분할-재조립 왕복 검증: 설정의 이모지 포함 문구가 원형 그대로 복원되는지
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const samples = [
    ...MISSION.recruit.bootLines,
    ...MISSION.missions.flatMap((m) => [m.intro, m.clue || ""]),
    "💎 moonstone 🧜‍♀️ mermaid 🦄 unicorn ⚡",
  ];
  for (const s of samples) {
    const rebuilt = [...seg.segment(s)].map((x) => x.segment).join("");
    assert.strictEqual(rebuilt, s, `그래핌 왕복 불일치: ${s}`);
  }
});

test("요원 모집: 부팅 문구/아바타/칭호가 올바르다", () => {
  const R = MISSION.recruit;
  assert.ok(R, "recruit 설정이 없음");
  assert.ok(R.bootLines.length >= 3, "부팅 시네마틱 문구는 3줄 이상");
  assert.ok(R.avatars.length >= 6, "아바타는 6개 이상 (참가 인원만큼 필요)");
  assert.strictEqual(new Set(R.avatars).size, R.avatars.length, "아바타가 중복됨");
  assert.ok(R.titles.length >= 4, "칭호는 4개 이상");
});

test("힌트 찬스: 토큰 수는 1~5이고 모든 미션에 힌트가 1개 이상 있다", () => {
  assert.ok(MISSION.hintTokens >= 1 && MISSION.hintTokens <= 5, "hintTokens는 1~5");
  MISSION.missions.forEach((m, i) => {
    assert.ok(Array.isArray(m.hints) && m.hints.length >= 1, `미션 ${i + 1}: 힌트가 없음`);
    m.hints.forEach((h) => assert.ok(h.length > 0, `미션 ${i + 1}: 빈 힌트`));
  });
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

test("세계관: world 설정과 모든 미션의 room 정보가 있다", () => {
  const W = MISSION.world;
  assert.ok(W && W.aiName && W.mapTitle && W.vault && W.vault.icon && W.vault.name, "world 설정 불완전");
  assert.ok(Array.isArray(W.fieldOpLines) && W.fieldOpLines.length >= 1, "fieldOpLines 없음");
  MISSION.missions.forEach((m, i) => {
    assert.ok(m.room && m.room.icon && m.room.name, `미션 ${i + 1}: room(icon/name) 없음`);
  });
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
    const q = [[...S, 0]];
    let found = -1;
    // 끝까지 탐색해야 문스톤 도달성 검사(seen)가 정확함 — K에서 조기 종료 금지
    while (q.length) {
      const [y, x, d] = q.shift();
      if (y === K[0] && x === K[1] && found < 0) found = d;
      for (const [dy, dx] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const ny = y + dy, nx = x + dx;
        if (maze[ny] && maze[ny][nx] !== "#" && !seen.has(`${ny},${nx}`)) {
          seen.add(`${ny},${nx}`);
          q.push([ny, nx, d + 1]);
        }
      }
    }
    assert.ok(found > 0, "미로를 풀 수 없음 — S에서 K까지 길이 없습니다");
    // 난이도 하한: 최단 경로가 너무 짧으면 시시해짐
    assert.ok(found >= 30, `미로 최단 경로가 ${found}걸음 — 30걸음 이상으로 만드세요`);
    // 문스톤(G)도 모두 도달 가능해야 함 (BFS seen에 포함)
    maze.forEach((r, y) => [...r].forEach((c, x) => {
      if (c === "G") assert.ok(seen.has(`${y},${x}`), `문스톤 (${y},${x})에 도달할 수 없음`);
    }));
  }
});

test("문스톤: G 개수와 수수께끼 수가 일치하고 보기에 정답이 포함된다", () => {
  for (const m of MISSION.missions.filter((x) => x.kind === "maze")) {
    const gCount = [...m.maze.join("")].filter((c) => c === "G").length;
    const stones = m.moonstones || [];
    assert.strictEqual(gCount, stones.length,
      `미로의 G는 ${gCount}개인데 moonstones는 ${stones.length}개 — 개수를 맞추세요`);
    stones.forEach((r, i) => {
      assert.ok(r.q && r.q.length > 0, `문스톤 ${i + 1}: 질문 없음`);
      assert.ok(Array.isArray(r.options) && r.options.length >= 2, `문스톤 ${i + 1}: 보기 2개 이상 필요`);
      const normA = r.answer.toUpperCase().replace(/[^A-Z0-9]/g, "");
      assert.ok(
        r.options.some((o) => o.toUpperCase().replace(/[^A-Z0-9]/g, "") === normA),
        `문스톤 ${i + 1}: 보기 중에 정답(${r.answer})이 없음`
      );
    });
  }
});
