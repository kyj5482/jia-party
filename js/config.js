// ============================================================
//  Jia The Best World Party — 설정 파일
//  이 파일만 수정하면 초대장의 모든 내용이 바뀝니다.
// ============================================================

const PARTY_CONFIG = {
  // ---------- 기본 정보 ----------
  childName: "지아",
  partyTitle: "Jia The Best World Party",
  partyDate: "2026년 00월 00일 (토)",
  partyTime: "오후 2:00 ~ 6:00",
  partyPlace: "참가 신청한 친구에게 개별 안내 💌", // 공개 주소를 쓰려면 여기 입력
  rsvpDeadline: "00월 00일까지 신청해 주세요!",

  // 풀 파티면 true → 완료 화면에 수영복 준비물 안내가 자동으로 나옵니다.
  isPoolParty: true,
  poolChecklist: ["수영복 🩱", "수건 🧺", "물안경 🥽", "갈아입을 옷 👕", "방수팩(선택) 📱"],

  // ---------- 신청 폼 전송 ----------
  // Formspree(https://formspree.io)에서 폼을 만들고 주소를 넣으세요.
  // 예: "https://formspree.io/f/abcdwxyz"
  // 비워두면("") 신청 내용을 문자/복사로 보내는 버튼이 대신 표시됩니다.
  formspreeEndpoint: "",
  rsvpPhone: "", // 문자로 보내기용 보호자 번호. 예: "01012345678"

  // ---------- 2단계: 지아 알아가기 사진 ----------
  // assets/photos/ 폴더에 사진을 넣고 src와 caption을 바꾸세요.
  photos: [
    {
      src: "assets/photos/photo1.svg",
      caption: "안녕! 나는 지아야 👋 올해 생일 파티의 주인공이지!",
    },
    {
      src: "assets/photos/photo2.svg",
      caption: "나는 그림 그리기를 좋아해. 특히 반짝이는 걸 그릴 때가 제일 신나!",
    },
    {
      src: "assets/photos/photo3.svg",
      caption: "물놀이는 내가 세상에서 제일 좋아하는 것 중 하나야 💦",
    },
    {
      src: "assets/photos/photo4.svg",
      caption: "이번 파티는 역대급으로 준비했어. 끝까지 통과해서 꼭 와줘!",
    },
  ],

  // ---------- 3단계: 지아 더 알기 O/X 퀴즈 ----------
  // answer: true = O 가 정답, false = X 가 정답
  // explain: 정답 공개 후 보여줄 설명 (지아를 더 알게 되는 포인트!)
  quiz: [
    {
      question: "지아가 가장 좋아하는 색깔은 보라색이다?",
      answer: true,
      explain: "맞아요! 지아는 보라색을 제일 좋아해요 💜 보라색 물건을 보면 그냥 못 지나쳐요.",
    },
    {
      question: "지아는 매운 떡볶이를 아주 잘 먹는다?",
      answer: false,
      explain: "지아는 사실 매운 걸 잘 못 먹어요 🥵 파티 간식은 안 매운 걸로 준비할게요!",
    },
    {
      question: "지아가 제일 좋아하는 동물은 고양이다?",
      answer: true,
      explain: "정답! 지아는 고양이만 보면 멈춰 서서 한참을 봐요 🐱",
    },
    {
      question: "지아는 수영을 무서워한다?",
      answer: false,
      explain: "전혀요! 지아는 물에만 들어가면 인어공주가 됩니다 🧜‍♀️ (힌트일지도...?)",
    },
    {
      question: "지아의 장래희망은 화가다?",
      answer: true,
      explain: "맞아요! 지아의 꿈은 멋진 그림을 그리는 화가예요 🎨",
    },
  ],
  quizPassScore: 3, // 통과에 필요한 정답 개수

  // ---------- 4단계: 티저 (영화 예고편 스타일 문구) ----------
  // 한 줄씩 화면 가득 나타났다 사라집니다.
  teaserLines: [
    "올해 여름...",
    "단 하루,",
    "단 한 번뿐인 파티가 열린다",
    "💦 첨벙이는 소리...?",
    "🗺️ 어딘가에 숨겨진 보물...?",
    "🔐 잠긴 문 뒤의 비밀...?",
    "모든 것이 밝혀지는 날",
    "JIA\nTHE BEST WORLD PARTY",
    "너도 초대받았어.",
  ],
  // 티저 끝에 보여줄 미스터리 힌트 카드 (뒤집으면 ???만 보임 — 궁금증 유발용)
  teaserHints: ["💦", "🗺️", "🔐"],
};
