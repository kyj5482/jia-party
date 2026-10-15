// ============================================================
//  Jia The Best World Party — Settings
//  Edit this one file to change everything on the invitation.
//  (이 파일만 수정하면 초대장의 모든 내용이 바뀝니다.)
// ============================================================

const PARTY_CONFIG = {
  // ---------- Basic info ----------
  childName: "Jia",
  partyTitle: "Jia The Best World Party",
  partyDate: "Saturday, November 7, 2026",
  partyTime: "2:00 PM – 6:00 PM",
  partyPlace: "The location will be shared with confirmed guests 💌", // or put the address here
  rsvpDeadline: "Please RSVP by October 31!",

  // Set to true for a pool party → the "bring your swimsuit" checklist
  // appears automatically on the final screen.
  isPoolParty: true,
  poolChecklist: ["Swimsuit 🩱", "Towel 🧺", "Goggles 🥽", "Change of clothes 👕", "Waterproof pouch (optional) 📱"],

  // ---------- RSVP form delivery ----------
  // Create a free form at https://formspree.io and paste the endpoint here.
  // Example: "https://formspree.io/f/abcdwxyz"
  // If left empty (""), buttons to send the RSVP by text message / copy
  // to clipboard will be shown instead.
  formspreeEndpoint: "",
  rsvpPhone: "", // parent phone number for the "Send by text" button, e.g. "15551234567"

  // ---------- Step 2: Get to know Jia (photos) ----------
  // Put photos in assets/photos/ and update src & caption below.
  photos: [
    {
      src: "assets/photos/photo1.svg",
      caption: "Hi! I'm Jia 👋 and this year's birthday party is going to be EPIC!",
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
      caption: "This party is going to be the best one ever. Pass the challenges and come join me!",
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
    "For one day only,",
    "a once-in-a-lifetime party begins",
    "💦 The sound of splashing...?",
    "🗺️ A treasure hidden somewhere...?",
    "🔐 A secret behind a locked door...?",
    "Everything will be revealed",
    "JIA\nTHE BEST WORLD PARTY",
    "And YOU are invited.",
  ],
  // Mystery hint cards shown after the teaser (front shows ??? to build curiosity)
  teaserHints: ["💦", "🗺️", "🔐"],
};
