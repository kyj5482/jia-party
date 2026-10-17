// ============================================================
//  Jia's Secret HQ — 파티 당일 미션 게임 설정 (부모용)
//
//  ◆ 세계관: HQ의 인공지능 NOVA의 시스템이 뒤섞여 보물 금고가
//    봉인됨. 요원들이 HQ의 방(터널→연구소→정원→금고)을 하나씩
//    복구하며, 봉투 찾기는 "실세계 필드 작전"으로 진행됩니다.
//  ◆ 여는 방법(이스터에그): 초대장 첫 화면에서 삼각형을 그리거나
//    달(🌙)을 5번 연속 탭 → PIN → 요원 모집 → 브리핑 → HQ 맵.
//  ◆ 힌트 찬스: 팀 전체 hintTokens개 + 오답 3회마다 무료 힌트.
//  ◆ 준비: MISSION_PLAN.md 의 시나리오/정답지/출력 카드 참고.
//  ◆ 진행 초기화: 주소 뒤에 ?reset 을 붙여 열면 처음부터.
// ============================================================

const MISSION_CONFIG = {
  // HQ 입장 PIN — 파티 당일 아이들에게 알려주는 숫자 (기본: 파티 날짜 11/07)
  pin: "1107",

  teamName: "Agent Squad",

  // 팀 전체가 함께 쓰는 힌트 찬스 수 (1~5 권장)
  hintTokens: 3,

  // ---------- 세계관 ----------
  world: {
    aiName: "NOVA", // HQ 인공지능 내레이터
    mapTitle: "HQ SYSTEM MAP",
    mapSub: "Restore every room to unseal the vault.",
    vault: { icon: "💎", name: "THE TREASURE VAULT" },
    // 필드 작전(봉투 찾기) 공통 멘트 — NOVA의 목소리
    fieldOpLines: [
      "AGENTS... my sensors cannot reach beyond this screen.",
      "The next access code is hidden in YOUR world.",
    ],
    fieldOpGo: "LEAVE THE SCREEN. SEARCH TOGETHER. 🏃‍♀️🏃",
  },

  // ---------- 요원 모집 (RPG식 오프닝) ----------
  recruit: {
    // PIN 통과 후 터미널 부팅처럼 한 글자씩 타이핑되는 시네마틱
    bootLines: [
      "> REBOOTING HQ CORE ............",
      "> I am NOVA — the brain of this HQ. 🛰️",
      "> Last night, someone SCRAMBLED my systems...",
      "> ...and SEALED the treasure vault. 💎🔒",
      "> Four rooms are dark. I cannot fix them alone.",
      "> AGENT RECRUITMENT PROTOCOL ... ACTIVATED ⚡",
    ],
    // 선택 가능한 요원 캐릭터 (한 명이 고르면 다른 친구는 선택 불가)
    avatars: ["🦄", "🐱", "🦊", "🧜‍♀️", "🦋", "🐰", "🐼", "🐬", "🦉", "⭐", "🐯", "🐸"],
    // 등록 시 무작위로 부여되는 요원 칭호
    titles: [
      "Cipher Queen", "Maze Whisperer", "Night Owl", "Puzzle Ninja",
      "Firefly Catcher", "Moonstone Hunter", "Shadow Dancer", "Riddle Master",
      "Star Navigator", "Secret Keeper",
    ],
  },

  // NOVA의 작전 브리핑 (스쿼드 구성 후)
  briefing: [
    "Welcome aboard, agents. This is NOVA speaking. 🛰️",
    "My map shows FOUR dark rooms between you and the vault.",
    "Each room holds a broken system — fix it, and the path opens.",
    "Some clues hide in the REAL WORLD. When I say GO... you run. 🏃‍♀️",
    "You share 3 HINT CHANCES 💡 for the whole night. Spend them as a team.",
    "The vault is waiting. Let's light this place up. ✨",
  ],

  // ---------- 미션(방) 목록 — 순서대로 복구 ----------
  missions: [
    {
      kind: "maze",
      room: { icon: "🌫️", name: "THE UNDERGROUND TUNNELS", enterLabel: "ENTER THE TUNNELS 🚪" },
      title: "Operation: Lights Out",
      intro:
        "The tunnel lights are DEAD and fog fills every corridor — I can only light a few steps around you. " +
        "Three of my MOONSTONES 💎 rolled into the dark, and the backup key 🔑 is sealed until you recover them all. " +
        "Each moonstone will test you with a riddle. Call out the turns, remember the dead ends... " +
        "and drivers rotate — every agent takes the wheel.",
      // S = 출발, K = 열쇠(도착), G = 문스톤💎, # = 벽, . = 길
      // 19×15, 최단 경로 96걸음 (수정 시 npm test로 확인!)
      maze: [
        "###################",
        "#S..#.....#.....#.#",
        "###.#.###.#.###.#.#",
        "#.#.#...#...#.#G..#",
        "#.#.###.#####.###.#",
        "#.#.#...#...#.....#",
        "#.#.#.###.#.###.###",
        "#...#.....#...#...#",
        "#.#########.#.###.#",
        "#.#..G....#.#.#.#.#",
        "#.#.#####.#.#.#.#.#",
        "#.#.#..G#.#.#.#.#.#",
        "#.#.#.#.#.###.#.#.#",
        "#...#.#.......#..K#",
        "###################",
      ],
      // 문스톤 수수께끼 — 미로의 G 개수와 같아야 함 (3지선다, 틀려도 재도전)
      moonstones: [
        {
          q: "I glow in the night sky and change my shape every single week. What am I?",
          options: ["THE MOON", "A STAR", "A FIREFLY"],
          answer: "THE MOON",
        },
        {
          q: "What has a face and two hands, but no arms and no legs?",
          options: ["A CLOCK", "A DOLL", "A PAINTING"],
          answer: "A CLOCK",
        },
        {
          q: "The more I dry, the wetter I get. What am I?",
          options: ["A TOWEL", "A SPONGE", "AN UMBRELLA"],
          answer: "A TOWEL",
        },
      ],
      hints: [
        "The key 🔑 waits near the BOTTOM-RIGHT corner of the map.",
        "Lost? Put your hand on the LEFT wall and never let go — it will lead you there eventually!",
      ],
      clearLine: "Tunnel lights RESTORED. The fog is lifting... ✨",
      // 필드 작전: 다음 봉투 힌트 (실제 숨길 장소로 수정하세요!)
      clue: "Envelope #1 is hiding where the family watches movies... look UNDER the cushions!",
      gateCode: "SPLASH",
      gatePrompt: "Found Envelope #1? Type the field code to re-sync:",
    },
    {
      kind: "code",
      room: { icon: "📡", name: "THE CODE LAB", enterLabel: "ENTER THE LAB 🚪" },
      title: "Operation: Scrambled Signal",
      intro:
        "A message is stuck in the lab's antenna — but the letters are all WRONG. Someone scrambled it. " +
        "Copy it onto the whiteboard, crack it TOGETHER, then type the real message to clear the antenna.",
      body:
        "INTERCEPTED MESSAGE:\n\n" +
        "N J E O J H I U   T O B D L\n\n" +
        "...the letters seem to have marched one step too far. 🥾",
      answer: "MIDNIGHT SNACK",
      hints: [
        "Every letter took ONE step forward in the alphabet. Push each one BACK: B→A, C→B, D→C...",
        "The first word starts with M... and it happens when everyone should be asleep 🤫",
      ],
      clearLine: "Antenna CLEARED. The Code Lab hums back to life... 📡",
      clue: "Envelope #2 is chilling with the ice cream... check the FREEZER door!",
      gateCode: "MOON",
      gatePrompt: "Found Envelope #2? Type the field code to re-sync:",
    },
    {
      kind: "simon",
      room: { icon: "🧚", name: "THE FIREFLY GARDEN", enterLabel: "ENTER THE GARDEN 🚪" },
      title: "Operation: Lost Rhythm",
      intro:
        "The garden's signal fireflies forgot their rhythm — and without it, the garden stays dark. " +
        "Watch their flashes, then the round's tapper repeats the pattern. It gets FASTER every round. " +
        "Pass round 7 and the rhythm is restored. Everyone else: chant the colors out loud!",
      rounds: 7, // 통과해야 하는 라운드 수 (어리면 5~6으로 낮추세요)
      hints: [
        "Give each firefly a name — PURPLE, PINK, BLUE, GOLD — and chant the whole pattern together after every flash.",
        "Split the job: each agent memorizes only the flashes in THEIR position (1st, 2nd, 3rd...). Then rebuild it together!",
      ],
      clearLine: "The fireflies remember! The garden GLOWS again... 🧚✨",
      clue: "Envelope #3 went somewhere clean... look where the TOWELS live!",
      gateCode: "STAR",
      gatePrompt: "Found Envelope #3? Type the field code to re-sync:",
    },
    {
      kind: "code",
      room: { icon: "🧠", name: "THE RIDDLE VAULT", enterLabel: "ENTER THE VAULT 🚪" },
      title: "Operation: Final Door",
      intro:
        "This is it — the vault's final door. Its lock takes a 3-digit code, and each riddle guards ONE digit. " +
        "Solve them on the whiteboard in order. Think hard, agents... everything you've learned led here.",
      body:
        "① Multiply me by MYSELF and you get\n" +
        "    the hours in two days, plus one.\n" +
        "    What number am I?\n\n" +
        "② Take the sides of a SQUARE, double them,\n" +
        "    then subtract the corners of the\n" +
        "    secret shape 🔺. What's left?\n\n" +
        "③ Count the letters in MYSTERY,\n" +
        "    then subtract the vowels in SLEEPOVER.",
      answer: "753",
      hints: [
        "① Two days = 48 hours. 48 + 1 = 49. What × itself = 49?  ② A square has 4 sides...",
        "③ MYSTERY has 7 letters. The vowels in SLEEPOVER are E, E, O, E. The code starts with 7!",
      ],
      clearLine: "",
      clue: "", // 마지막 방은 바로 최종 화면으로
    },
  ],

  // ---------- 최종 화면 ----------
  final: {
    lockCode: "753", // 실제 자물쇠를 이 번호로 맞춰 두세요!
    message:
      "EVERY SYSTEM RESTORED. HQ IS SHINING. ✨\n" +
      "Agents... the vault recognizes your code: 7 · 5 · 3.\n" +
      "One last field operation: the REAL vault is waiting where Jia sleeps. 🛏️\n" +
      "Go. Open it together. You earned this. 💎",
  },
};
