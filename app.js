// --------- FIREBASE SETUP ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🔥 REPLACE THESE WITH YOUR VALUES (COPY FROM FIREBASE SETTINGS)
const firebaseConfig = {
    apiKey: "AIzaSyAX7W1tGQoduf48cGdsiIEkiWz0QCXgd3I",
  authDomain: "campusquerybot-v2.firebaseapp.com",
  projectId: "campusquerybot-v2",
  storageBucket: "campusquerybot-v2.firebasestorage.app",
  messagingSenderId: "501352991382",
  appId: "1:501352991382:web:a3c50e53f4c8d6f38ed0b7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --------- GEMINI API KEY ----------
const GEMINI_KEY = "AIzaSyA4t37-5Qxs4ZhsmCXU29AOPkGifNsLhJU";

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
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
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

