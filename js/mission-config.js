// ============================================================
//  Jia's Secret HQ — 파티 당일 미션 게임 설정 (부모용)
//
//  ◆ 여는 방법(이스터에그): 초대장 첫 화면에서 손가락으로
//    삼각형을 그리거나, 달(🌙)을 5번 연속 탭하면 HQ가 열립니다.
//  ◆ 진행 순서: PIN 입력 → 스쿼드 등록 → 브리핑 → 미션1(미로) →
//    봉투1 → 미션2(암호 해독) → 봉투2 → 미션3(기억 게임) → 봉투3 →
//    미션4(수수께끼 자물쇠) → 최종 보물 공개
//  ◆ 힌트 찬스: 팀 전체에 hintTokens개. 미션마다 2단계 힌트가 있고
//    1개씩 소모해 공개. 오답 3번이면 무료 힌트(HQ 자비)가 열립니다.
//  ◆ 준비: MISSION_PLAN.md 의 시나리오/정답지/출력 카드 참고.
//  ◆ 진행 초기화: 주소 뒤에 ?reset 을 붙여 열면 처음부터.
// ============================================================

const MISSION_CONFIG = {
  // HQ 입장 PIN — 파티 당일 아이들에게 알려주는 숫자 (기본: 파티 날짜 11/07)
  pin: "1107",

  teamName: "Agent Squad", // 브리핑에서 부르는 팀 이름

  // 팀 전체가 함께 쓰는 힌트 찬스 수 (1~5 권장)
  hintTokens: 3,

  // ---------- 요원 모집 (RPG식 오프닝) ----------
  recruit: {
    // PIN 통과 후 터미널 부팅처럼 한 글자씩 타이핑되는 시네마틱
    bootLines: [
      "> CONNECTING TO JIA'S SECRET HQ ...",
      "> ACCESS CODE VERIFIED ✔",
      "> ALERT! A TREASURE BOX HAS BEEN SEALED",
      "> 4 MISSIONS STAND BETWEEN YOU AND THE PRIZE",
      "> HQ CANNOT DO THIS ALONE...",
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

  briefing: [
    "Agents, welcome to JIA'S SECRET HQ. 🕵️",
    "Somewhere in this house is a locked treasure box.",
    "To open it, your team must clear 4 missions — together.",
    "Tablet missions are solved HERE. Whiteboard missions are solved on the board, then type your answer.",
    "Your squad shares 3 HINT CHANCES 💡 for the WHOLE night. Spend them wisely — the team must agree!",
    "Good luck, agents. The night is yours. 🌙",
  ],

  // ---------- 미션 목록 (순서대로 진행) ----------
  missions: [
    {
      kind: "maze", // 태블릿 미션: 안개 속 대형 미로 (조종자 8~12걸음마다 교대)
      title: "MISSION 1 · The Fog Maze",
      intro:
        "This maze is BIG and the fog is thick — you can only see a few steps ahead. " +
        "Three MOONSTONES 💎 are hidden in the maze, and the key 🔑 is SEALED until you collect them all. " +
        "Each moonstone asks the squad a riddle! Call out the turns, remember the dead ends, " +
        "and drivers switch automatically — every agent takes the wheel.",
      // S = 출발, K = 열쇠(도착), G = 문스톤💎, # = 벽, . = 길
      // 19×15, 최단 경로 96걸음 (생성기로 검증됨 — 수정 시 npm test로 확인!)
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
      // 미션 성공 시 보여줄 다음 봉투 힌트 (실제 숨길 장소로 수정하세요!)
      clue: "Nice work, agents! 🔑 Envelope #1 is hiding where the family watches movies... look UNDER the cushions!",
      // 봉투 1 안에 적어둘 비밀 단어 — 입력해야 다음 미션이 열림
      gateCode: "SPLASH",
      gatePrompt: "Found Envelope #1? Type the secret word written inside:",
    },
    {
      kind: "code", // 화이트보드 미션: 시저 암호 (한 칸 밀린 알파벳)
      title: "MISSION 2 · The Shifted Message",
      intro:
        "HQ intercepted a scrambled message. Something is wrong with the letters... " +
        "they don't look like real words. Copy it onto the whiteboard and crack it TOGETHER, " +
        "then type the decoded message here.",
      // 정답 "MIDNIGHT SNACK"의 각 글자를 알파벳에서 +1 민 것
      body:
        "INTERCEPTED MESSAGE:\n\n" +
        "N J E O J H I U   T O B D L\n\n" +
        "...the letters seem to have marched one step too far. 🥾",
      answer: "MIDNIGHT SNACK", // 대소문자/공백 무시하고 비교
      hints: [
        "Every letter took ONE step forward in the alphabet. Push each one BACK: B→A, C→B, D→C...",
        "The first word starts with M... and it happens when everyone should be asleep 🤫",
      ],
      clue: "Decoded! 🧠 Envelope #2 is chilling with the ice cream... check the FREEZER door!",
      gateCode: "MOON",
      gatePrompt: "Found Envelope #2? Type the secret word written inside:",
    },
    {
      kind: "simon", // 태블릿 미션: 반딧불 기억 게임 (라운드마다 탭 담당 교대)
      title: "MISSION 3 · The Firefly Signal",
      intro:
        "Four fireflies are flashing a secret signal 🧚 — and it gets FAST. " +
        "Watch the pattern, then the round's tapper repeats it. " +
        "Each round adds one more flash — pass round 7 to win. Everyone else: chant the colors out loud!",
      rounds: 7, // 통과해야 하는 라운드 수 (어리면 5~6으로 낮추세요)
      hints: [
        "Give each firefly a name — PURPLE, PINK, BLUE, GOLD — and chant the whole pattern together after every flash.",
        "Split the job: each agent memorizes only the flashes in THEIR position (1st, 2nd, 3rd...). Then rebuild it together!",
      ],
      clue: "Signal decoded! ✨ Envelope #3 went somewhere clean... look where the TOWELS live!",
      gateCode: "STAR",
      gatePrompt: "Found Envelope #3? Type the secret word written inside:",
    },
    {
      kind: "code", // 화이트보드 미션: 수수께끼 3개로 자물쇠 번호 찾기
      title: "MISSION 4 · The Three Riddles",
      intro:
        "The treasure box has a 3-digit lock. Each riddle gives ONE digit. " +
        "Solve them on the whiteboard in order, then type the 3-digit code. Think hard — this is the last door!",
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
      clue: "", // 마지막 미션은 clue 대신 아래 final 화면으로 이동
    },
  ],

  // ---------- 최종 화면 ----------
  final: {
    lockCode: "753", // 실제 자물쇠를 이 번호로 맞춰 두세요!
    message:
      "MISSION COMPLETE, AGENTS! 🎉\n" +
      "The lock code is 7 · 5 · 3.\n" +
      "The treasure box is waiting where Jia sleeps... 🛏️\n" +
      "Open it together — you earned it!",
  },
};
