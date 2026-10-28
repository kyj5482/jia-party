// ============================================================
//  Jia's Birthday Party (Version 2 — simple) — Settings
//  Edit this one file to change everything on the v2 invitation.
//  (이 파일만 수정하면 v2 초대장의 모든 내용이 바뀝니다.)
// ============================================================

const PARTY_CONFIG_V2 = {
  // ---------- Basic info ----------
  childName: "Jia",
  partyTitle: "Jia's Birthday Party",
  partyDate: "Saturday, November 14",
  partyTime: "3:00 PM",
  dropOff: "14 Thunder Trail, Irvine",
  pickupPlace: "14 Thunder Trail, Irvine",
  pickupTime: "Sunday, November 15 · 11:00 AM",
  bringList: ["Swimsuit 🩱", "Pajamas 🌙"],

  // ---------- RSVP form delivery ----------
  // Formspree endpoint — RSVP가 이메일로 도착합니다.
  formspreeEndpoint: "https://formspree.io/f/mvkzdker",

  // ---------- O/X quiz about Jia ----------
  // answer: true = O is correct, false = X is correct
  quiz: [
    {
      question: "Is my favorite color purple?",
      answer: true,
      explain: "Yes! Purple is my favorite color 💜",
    },
    {
      question: "Do I have a sibling?",
      answer: true,
      explain: "Yes, I do! 👧👦",
    },
    {
      question: "Is my favorite animal cat?",
      answer: false,
      explain: "Nope! Cats are cute, but they're not my favorite 🐱",
    },
    {
      question: "Is my dream pet bear?",
      answer: true,
      explain: "Yes!! My dream pet is a bear 🐻",
    },
    {
      question: "Is my swimming team in Woodbridge?",
      answer: false,
      explain: "Nope, my swimming team isn't in Woodbridge! 🏊‍♀️",
    },
  ],
  quizPassScore: 3, // correct answers needed to pass
};
