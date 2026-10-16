// ============================================================
//  Jia's Secret HQ — 파티 당일 미션 게임 설정 (부모용)
//
//  ◆ 여는 방법(이스터에그): 초대장 첫 화면에서 손가락으로
//    삼각형을 그리거나, 달(🌙)을 5번 연속 탭하면 HQ가 열립니다.
//  ◆ 진행 순서: PIN 입력 → 브리핑 → 미션1(미로) → 봉투1 →
//    미션2(암호 해독) → 봉투2 → 미션3(기억 게임) → 봉투3 →
//    미션4(수수께끼 자물쇠) → 최종 보물 공개
//  ◆ 준비: MISSION_PLAN.md 의 시나리오/정답지/출력 카드 참고.
//  ◆ 진행 초기화: 주소 뒤에 ?reset 을 붙여 열면 처음부터.
// ============================================================

const MISSION_CONFIG = {
  // HQ 입장 PIN — 파티 당일 아이들에게 알려주는 숫자 (기본: 파티 날짜 11/07)
  pin: "1107",

  teamName: "Agent Squad", // 브리핑에서 부르는 팀 이름

  briefing: [
    "Agents, welcome to JIA'S SECRET HQ. 🕵️",
    "Somewhere in this house is a locked treasure box.",
    "To open it, your team must clear 4 missions — together.",
    "Tablet missions are solved HERE. Whiteboard missions are solved on the board, then type your answer.",
    "Stuck? Your team may call HQ (Jia's mom & dad) for ONE hint per mission.",
    "Good luck, agents. The night is yours. 🌙",
  ],

  // ---------- 미션 목록 (순서대로 진행) ----------
  missions: [
    {
      kind: "maze", // 태블릿 미션: 안개 속 미로 (다 같이 길을 기억하며 탈출)
      title: "MISSION 1 · The Fog Maze",
      intro:
        "The map is covered in fog — you can only see a few steps ahead. " +
        "Work together: call out the turns, remember the dead ends, and guide the agent 🔦 to the key 🔑!",
      // S = 출발, K = 열쇠(도착), # = 벽, . = 길  (행 길이는 모두 같아야 함)
      maze: [
        "#############",
        "#S..#.......#",
        "##.##.#####.#",
        "#..#..#...#.#",
        "#.##.##.#.#.#",
        "#....#..#.#.#",
        "#.####.##.#.#",
        "#.#....#..#.#",
        "#.#.####.##.#",
        "#...#....#.K#",
        "#############",
      ],
      // 미션 성공 시 보여줄 다음 봉투 힌트 (실제 숨길 장소로 수정하세요!)
      clue: "Nice work, agents! 🔑 Envelope #1 is hiding where the family watches movies... look UNDER the cushions!",
      // 봉투 1 안에 적어둘 비밀 단어 — 입력해야 다음 미션이 열림
      gateCode: "SPLASH",
      gatePrompt: "Found Envelope #1? Type the secret word written inside:",
    },
    {
      kind: "code", // 화이트보드 미션: 이모지 암호 해독
      title: "MISSION 2 · The Emoji Cipher",
      intro:
        "HQ intercepted a coded message! Copy it onto the whiteboard and crack it TOGETHER using the emoji key. " +
        "Then type the secret word here.",
      // 화면에 보여줄 문제 (출력 카드에도 동일하게 — MISSION_PLAN.md 참고)
      body:
        "KEY:  🌙=A   🎈=P   🦄=J   🍕=M   🌊=S\n\n" +
        "MESSAGE:  🎈 🌙 🦄 🌙 🍕 🌙 🌊",
      answer: "PAJAMAS", // 대소문자/공백 무시하고 비교
      clue: "Decoded! 🧠 Envelope #2 is chilling with the ice cream... check the FREEZER door!",
      gateCode: "MOON",
      gatePrompt: "Found Envelope #2? Type the secret word written inside:",
    },
    {
      kind: "simon", // 태블릿 미션: 반딧불 기억 게임 (시몬)
      title: "MISSION 3 · The Firefly Signal",
      intro:
        "Four fireflies are flashing a secret signal 🧚. Watch the pattern, then repeat it by tapping. " +
        "Each round adds one more flash — pass round 6 to win. Decide together before you tap!",
      rounds: 6, // 통과해야 하는 라운드 수 (어리면 4~5로 낮추세요)
      clue: "Signal decoded! ✨ Envelope #3 went somewhere clean... look where the TOWELS live!",
      gateCode: "STAR",
      gatePrompt: "Found Envelope #3? Type the secret word written inside:",
    },
    {
      kind: "code", // 화이트보드 미션: 수수께끼 3개로 자물쇠 번호 찾기
      title: "MISSION 4 · The Three Riddles",
      intro:
        "The treasure box has a 3-digit lock. Each riddle gives ONE digit. " +
        "Solve them on the whiteboard in order, then type the 3-digit code.",
      body:
        "① How many sides does the SECRET SHAPE have?\n" +
        "    (Hint: it's the shape that opened this HQ... 🔺)\n\n" +
        "② I am an odd number. Take away one letter\n" +
        "    and I become EVEN. What number am I?\n\n" +
        "③ What is half of 18?",
      answer: "379",
      clue: "", // 마지막 미션은 clue 대신 아래 final 화면으로 이동
    },
  ],

  // ---------- 최종 화면 ----------
  final: {
    lockCode: "379", // 실제 자물쇠를 이 번호로 맞춰 두세요!
    message:
      "MISSION COMPLETE, AGENTS! 🎉\n" +
      "The lock code is 3 · 7 · 9.\n" +
      "The treasure box is waiting where Jia sleeps... 🛏️\n" +
      "Open it together — you earned it!",
  },
};
