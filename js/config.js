// ============================================================
//  Jia's Mystery Sleepover — Settings
//  Edit this one file to change everything on the invitation.
//  (이 파일만 수정하면 초대장의 모든 내용이 바뀝니다.)
//  파티 당일 미션 게임 설정은 js/mission-config.js 에 있습니다.
// ============================================================

const PARTY_CONFIG = {
  // ---------- Basic info ----------
  childName: "Jia",
  partyTitle: "Jia's Mystery Sleepover",
  partyDate: "Saturday, November 7, 2026",
  partyTime: "Starts Sat 2:00 PM · Pickup Sun 10:00 AM",
  partyPlace: "The location will be shared with confirmed guests 💌", // or put the address here
  rsvpDeadline: "Please RSVP by October 31!",

  // Set to true for a pool party → the pool packing list
  // appears automatically on the final screen.
  isPoolParty: true,
  poolChecklist: ["Swimsuit 🩱", "Towel 🧺", "Goggles 🥽", "Waterproof pouch (optional) 📱"],
  // 슬립오버 준비물 — 완료 화면에 항상 표시
  sleepoverChecklist: [
    "Pajamas 🌙",
    "Sleeping bag & pillow 🛏️",
    "Toothbrush 🪥",
    "Comfy clothes for Sunday 👚",
    "Your favorite stuffed buddy 🧸",
  ],

  // ---------- RSVP form delivery ----------
  // Formspree endpoint — RSVP가 이메일로 도착합니다.
  formspreeEndpoint: "https://formspree.io/f/mvkzdker",
  rsvpPhone: "", // 비워두면 문자 보내기 버튼이 표시되지 않음 (문자 수신 안 함)

  // ---------- Step 2: Get to know Jia (photos) ----------
  // Put photos in assets/photos/ and update src & caption below.
  photos: [
    {
      src: "assets/photos/photo1.svg",
      caption: "Hi! I'm Jia 👋 and I'm planning something a little... mysterious.",
    },
    {
      src: "assets/photos/photo2.svg",
      caption: "I love drawing — especially anything sparkly and colorful!",
    },
    {
      src: "assets/photos/photo3.svg",
      caption: "Splashing in the water is one of my favorite things in the whole world 💦",
    },
    {
      src: "assets/photos/photo4.svg",
      caption: "This is my very first sleepover party — and I turned it into a mystery. Think you can solve it?",
    },
  ],

  // ---------- Step 3: O/X quiz about Jia ----------
  // answer: true = O (true) is correct, false = X (false) is correct
  // explain: shown after answering — helps friends get to know Jia!
  quiz: [
    {
      question: "Jia's favorite color is purple.",
      answer: true,
      explain: "Correct! Jia LOVES purple 💜 She can't walk past anything purple without stopping.",
    },
    {
      question: "Jia loves super spicy food.",
      answer: false,
      explain: "Nope! Jia can't handle spicy food 🥵 Don't worry — the party snacks won't be spicy!",
    },
    {
      question: "Jia's favorite animal is the cat.",
      answer: true,
      explain: "That's right! Jia stops and stares every single time she sees a cat 🐱",
    },
    {
      question: "Jia is afraid of swimming.",
      answer: false,
      explain: "Not at all! Jia turns into a mermaid the moment she touches water 🧜‍♀️ (hint, hint...?)",
    },
    {
      question: "Jia wants to be an artist when she grows up.",
      answer: true,
      explain: "Yes! Jia dreams of becoming an amazing artist 🎨",
    },
  ],
  quizPassScore: 3, // correct answers needed to pass

  // ---------- Step 4: Teaser (movie-trailer style lines) ----------
  // Each line fills the screen one at a time.
  teaserLines: [
    "This November...",
    "One night.",
    "A few brave friends.",
    "💦 A splash before sunset...",
    "🗺️ A map to something hidden...",
    "🔐 A box that won't open...",
    "🌙 And a night you'll never forget",
    "JIA'S MYSTERY\nSLEEPOVER",
    "And YOU are invited.",
  ],
  // Mystery hint cards shown after the teaser (front shows ??? to build curiosity)
  teaserHints: ["💦", "🗺️", "🔐", "🌙"],
};
