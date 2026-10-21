// 레이아웃 겹침 방지 감사(audit) 테스트
//
// 이 프로젝트에서 실제로 발생했던 겹침 버그는 모두
// "절대배치(position: absolute/fixed) 클래스를 다른 화면에서 재사용"
// 해서 생겼다 (예: 티저용 .btn-skip을 오버레이에서 재사용 → 버튼 겹침,
// .hq-exit에 .btn-skip의 right까지 같이 적용 → 버튼이 늘어남).
// 이 테스트는 그 패턴을 정적으로 감지한다:
//  1) 절대배치 클래스가 버튼/입력 요소에 쓰이면, 등록된 (클래스, 컨테이너)
//     조합만 허용하고, 조합마다 요구되는 보정 CSS가 존재하는지 확인
//  2) 하단 고정 버튼이 있는 화면은 충분한 padding-bottom을 예약했는지 확인
//  3) 상단 고정 진행바 아래 화면들이 충분한 padding-top을 가졌는지 확인
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
// 두 초대장 모두 감사: index.html(v2, 공개 페이지), v1.html(미스터리 슬립오버)
const PAGES = ["index.html", "v1.html"].map((f) => ({
  file: f,
  html: fs.readFileSync(path.join(ROOT, f), "utf8"),
}));
// 주석은 셀렉터 매칭을 방해하므로 제거하고 파싱
const css = fs.readFileSync(path.join(ROOT, "css/style.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

// ---------- CSS 파싱 도우미 ----------
function cssBlocks() {
  // 단순 파서: "selector { ... }" 블록 목록 (중첩 없음 전제, @media 내부 포함)
  const blocks = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    blocks.push({ selector: m[1].trim(), body: m[2] });
  }
  return blocks;
}
const blocks = cssBlocks();

function blocksFor(selectorPart) {
  return blocks.filter((b) => b.selector.split(",").some((s) => s.trim() === selectorPart));
}

// 절대/고정 배치가 선언된 클래스 셀렉터 수집 (.foo 단일 클래스 형태)
const positionedClasses = new Set();
for (const b of blocks) {
  if (/position:\s*(absolute|fixed)/.test(b.body)) {
    for (const sel of b.selector.split(",")) {
      const m = sel.trim().match(/^\.([a-zA-Z0-9_-]+)$/);
      if (m) positionedClasses.add(m[1]);
    }
  }
}

// ---------- HTML 파싱 도우미 ----------
// 최상위 컨테이너(화면)들의 시작 위치
const KNOWN_CONTAINERS = [
  "stage-intro", "stage-photos", "stage-quiz", "stage-teaser",
  "stage-form", "stage-done", "secret-overlay", "stage-mission",
];
function containerStartsOf(html) {
  return KNOWN_CONTAINERS
    .map((id) => ({ id, at: html.indexOf(`id="${id}"`) }))
    .filter((c) => c.at >= 0)
    .sort((a, b) => a.at - b.at);
}

function containerAt(html, index) {
  let cur = null;
  for (const c of containerStartsOf(html)) {
    if (c.at < index) cur = c.id;
    else break;
  }
  return cur;
}

// 인터랙티브 요소(버튼/입력/링크)와 그 클래스 목록
function interactiveElements(html) {
  const out = [];
  const re = /<(button|a|input)\b[^>]*class="([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) {
    out.push({ tag: m[1], classes: m[2].split(/\s+/), at: m.index });
  }
  return out;
}

// ---------- 규칙 1: 절대배치 클래스의 사용처 허용 목록 ----------
// 새 화면에서 절대배치 클래스를 재사용하면 이 테스트가 실패한다.
// 재사용하려면 여기 등록하고, 겹침을 막는 보정 CSS(mustContain)를 함께 추가할 것.
const ALLOWED_USES = [
  // 티저 재생 화면의 Skip 버튼 — 이 클래스의 "홈" 위치
  { cls: "btn-skip", container: "stage-teaser" },
  // 비밀 오버레이의 뒤로가기 — 일반 흐름으로 되돌리는 보정 필요
  {
    cls: "btn-skip", container: "secret-overlay",
    requireSelector: ".secret-box .btn-skip", mustContain: "position: static",
  },
  // HQ의 leave 버튼 — btn-skip의 right가 함께 적용되지 않도록 보정 필요
  {
    cls: "btn-skip", container: "stage-mission",
    requireSelector: ".hq-exit", mustContain: "right: auto",
  },
  { cls: "hq-exit", container: "stage-mission" },
  // 전역 효과음 토글 — 모든 화면 위 좌상단 고정 (컨테이너 밖, 최상위)
  { cls: "sound-toggle", container: null },
];

test("절대배치 클래스는 등록된 화면에서만, 보정 CSS와 함께 사용된다", () => {
  const problems = [];
  for (const { file, html } of PAGES)
  for (const elem of interactiveElements(html)) {
    for (const cls of elem.classes) {
      if (!positionedClasses.has(cls)) continue;
      const container = containerAt(html, elem.at);
      const allow = ALLOWED_USES.find((a) => a.cls === cls && a.container === container);
      if (!allow) {
        problems.push(
          `[${file}] 절대배치 클래스 .${cls} 가 미등록 화면(#${container})의 <${elem.tag}>에 사용됨 — ` +
          `겹침 위험! tests/layout.test.js의 ALLOWED_USES에 등록하고 보정 CSS를 추가하세요.`
        );
        continue;
      }
      if (allow.requireSelector) {
        const b = blocksFor(allow.requireSelector);
        if (!b.length || !b.some((x) => x.body.includes(allow.mustContain))) {
          problems.push(
            `.${cls} @ #${container}: 보정 CSS가 없음 — ` +
            `'${allow.requireSelector} { ${allow.mustContain} }' 가 필요합니다.`
          );
        }
      }
    }
  }
  assert.deepStrictEqual(problems, [], "\n" + problems.join("\n"));
});

// ---------- 규칙 2: 하단 고정 요소가 있는 화면은 padding-bottom 예약 ----------
test("HQ 화면은 하단 고정 버튼(leave HQ)만큼 padding-bottom을 예약한다", () => {
  const b = blocksFor("#stage-mission");
  assert.ok(b.length, "#stage-mission CSS 블록이 없음");
  const m = b.map((x) => x.body).join(";").match(/padding-bottom:\s*(\d+)px/);
  assert.ok(m, "#stage-mission에 padding-bottom이 없음 — 콘텐츠가 leave HQ 버튼과 겹칩니다");
  assert.ok(Number(m[1]) >= 80, `padding-bottom ${m[1]}px < 80px — leave HQ 버튼과 겹칠 수 있음`);
});

// ---------- 규칙 3: 상단 고정 진행바 아래 화면들의 padding-top ----------
test("화면 공통 padding-top이 고정 진행바 높이 이상이다", () => {
  const b = blocksFor(".stage");
  assert.ok(b.length, ".stage CSS 블록이 없음");
  const body = b.map((x) => x.body).join(";");
  // padding: <top> ... 또는 padding-top: <top>
  const m = body.match(/padding(?:-top)?:\s*(\d+)px/);
  assert.ok(m, ".stage에 padding-top이 없음");
  assert.ok(Number(m[1]) >= 60, `.stage padding-top ${m[1]}px < 60px — 고정 진행바와 겹칠 수 있음`);
});

// ---------- 규칙 4: 좌/우가 동시에 고정된 버튼 금지 (늘어남 방지) ----------
test("인터랙티브 요소에 left와 right가 동시에 적용되는 조합이 없다", () => {
  // 요소별로 적용되는 클래스들의 CSS를 합쳐 left/right 지정이 둘 다 살아있는지 검사
  const problems = [];
  for (const { file, html } of PAGES)
  for (const elem of interactiveElements(html)) {
    let left = null, right = null;
    for (const cls of elem.classes) {
      for (const b of blocksFor("." + cls)) {
        const lm = b.body.match(/\bleft:\s*([^;]+);/);
        const rm = b.body.match(/\bright:\s*([^;]+);/);
        if (lm) left = lm[1].trim();
        if (rm) right = rm[1].trim();
      }
    }
    if (left && right && left !== "auto" && right !== "auto") {
      problems.push(
        `[${file}] <${elem.tag} class="${elem.classes.join(" ")}"> 에 left:${left} 와 right:${right} 가 ` +
        `동시 적용 — 버튼이 가로로 늘어납니다. 한쪽을 auto로 해제하세요.`
      );
    }
  }
  assert.deepStrictEqual(problems, [], "\n" + problems.join("\n"));
});
