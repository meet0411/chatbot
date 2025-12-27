// --------- FIREBASE SETUP ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🔥 REPLACE THESE WITH YOUR VALUES (COPY FROM FIREBASE SETTINGS)
const firebaseConfig = {
  apiKey: "AIzaSyAkpzOFIZuu-E_xdmwXPMWRmgkV0AX3QRE",
  authDomain: "chatbot-11042006.firebaseapp.com",
  projectId: "chatbot-11042006",
  storageBucket: "chatbot-11042006.firebasestorage.app",
  messagingSenderId: "25635073514",
  appId: "1:25635073514:web:cd486318c1c9b2f95bd693"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --------- GEMINI API KEY ----------
const GEMINI_KEY = "<YOUR_GEMINI_API_KEY>"; // 👈 REPLACE WITH YOUR KEY

// --------- CHAT LOGIC ----------
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();

  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  addMessage("Thinking…", "bot");

  const faqData = await loadFAQs();
  const reply = await askGemini(faqData, message);

  updateLastBotMessage(reply);
}

function addMessage(text, cls) {
  const box = document.getElementById("chat-box");
  const div = document.createElement("div");
  div.className = cls;
  div.innerText = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function updateLastBotMessage(text) {
  const bots = document.querySelectorAll(".bot");
  bots[bots.length - 1].innerText = text;
}

// --------- LOAD FAQ FROM FIRESTORE ----------
async function loadFAQs() {
  let data = "";
  const querySnapshot = await getDocs(collection(db, "faqs"));

  querySnapshot.forEach(doc => {
    const f = doc.data();
    data += `Q: ${f.question}\nA: ${f.answer}\n\n`;
  });

  return data;
}

async function askGemini(faq, user) {
  const prompt = `
You are a college helpdesk chatbot.
Answer ONLY using the FAQ below.

If answer not available, say:
"Please contact the college administration."

FAQ:
${faq}

User question:
${user}
`;

  // 👈 THIS MUST EXIST
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  const data = await res.json();
  console.log(data);

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Please contact the college administration."
  );
}


window.sendMessage = sendMessage;

