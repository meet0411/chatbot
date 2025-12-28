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
  
  // Create main container div (bot or user)
  const wrapperDiv = document.createElement("div");
  wrapperDiv.className = cls; // "bot" or "user"
  
  // Create the bubble content div
  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.innerText = text;
  
  // Append bubble to wrapper
  wrapperDiv.appendChild(contentDiv);
  
  // Append wrapper to chat box
  box.appendChild(wrapperDiv);
  
  // Auto scroll to bottom
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
  // 👇 STRONG PROMPT: Covers greetings, typos, identity, and strict facts.
  const prompt = `
  SYSTEM ROLE:
  You are the official "College Student Assistant AI". Your tone is helpful, polite, and concise.

  CONTEXT (KNOWLEDGE BASE):
  ${faq}

  YOUR INSTRUCTIONS:
  1. **Analyze the User's Input:**
     - Look for keywords and *intent*, even if there are spelling mistakes, short forms (e.g., "req" for required, "min" for minimum), or bad grammar.
  
  2. **Handle Greetings & Small Talk:**
     - If the user says "Hi", "Hello", "Hey", "Good Morning", etc., reply with a friendly welcome message like: "Hello! I am your College Assistant. How can I help you with your campus queries today?"
     - If the user asks "How are you?", reply politely.

  3. **Handle Identity:**
     - If asked "Who are you?", "What is your name?", or "Who made you?", reply: 
       "I am the College Inquiry Chatbot, developed by Code Mafia Team to help students."

  4. **Answer Questions (The Core Task):**
     - Search the "CONTEXT" above for the answer.
     - **Match the Meaning:** If the user asks "attendance rules" and the FAQ has "What is the minimum attendance?", understand that they match.
     - **Hinglish/Slang:** Try to understand Indian student slang if used (e.g., "exam kab hai?").
     - **Strictness:** Do NOT invent college rules. If the specific answer is not in the CONTEXT, say exactly: "I'm sorry, I don't have information on that specific topic. Please contact the college administration."

  USER INPUT:
  "${user}"
  `;

  // 👇 API REQUEST (Using the working 'flash-latest' alias)
  try {
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
    
    // Safety check: Ensure the response format is correct
    if (data.error) {
        console.error("Gemini API Error:", data.error);
        return "My brain is currently overloaded. Please try again in 30 seconds.";
    }

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Please contact the college administration."
    );

  } catch (error) {
    console.error("Network Error:", error);
    return "I am having trouble connecting to the internet. Please check your connection.";
  }
}

window.sendMessage = sendMessage;

