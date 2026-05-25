import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --------- FIREBASE SETUP ----------
// ⚠️ SECURITY NOTE: Firebase credentials are visible in client-side code.
// For production, use environment variables and security rules in Firebase.
// These rules prevent unauthorized access: only allow READ on 'faqs' collection.
// See: https://firebase.google.com/docs/firestore/security/get-started
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

// IMPORTANT: Replace with your real Gemini API key
// Get your key from: https://ai.google.dev/
// Steps:
// 1. Go to https://ai.google.dev/
// 2. Click "Get API key" 
// 3. Create or use existing Google Cloud project
// 4. Copy the key and replace "YOUR_GEMINI_API_KEY_HERE" below
const GEMINI_KEY = "AIzaSyBoHujXliXeMXW9opXa1fA0WsWRPjqEvS4";

// --------- STATE ----------
const STORAGE_KEY = "college_ai_chat_history_v2";
const THEME_KEY = "college_ai_theme_v2";

let chatHistory = safeParse(localStorage.getItem(STORAGE_KEY), []);
let currentChatMessages = [];
let isChatVisible = false;
let isMinimized = false;

// --------- DOM ----------
const chatContainer = document.getElementById("chatContainer");
const aboutSection = document.getElementById("about-section");
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("userInput");
const historyList = document.getElementById("historyList");
const themeToggle = document.getElementById("themeToggle");
const closeChatBtn = document.getElementById("closeChat");
const minimizeBtn = document.getElementById("minimizeBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const startChatBtn = document.getElementById("startChatBtn");
const newChatBtn = document.getElementById("newChatBtn");

// --------- HELPERS ----------
function safeParse(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function saveHistory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
}

function formatDateTime(date = new Date()) {
    return date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function setTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    const icon = themeToggle.querySelector("i");
    if (icon) {
        icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
}

function getTheme() {
    return localStorage.getItem(THEME_KEY) || "light";
}

function autoGrowTextarea(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
}

function scrollChatToBottom() {
    requestAnimationFrame(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function normalizeMessageText(text) {
    if (typeof text !== "string") return "";

    return text
        .replace(/\r\n/g, "\n")
        .replace(/\\n/g, "\n")
        .trim();
}

function normalizeForMatch(text) {
    return normalizeMessageText(text)
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function buildFaqKnowledgeBase(faqs) {
    return faqs
        .map(faq => `Q: ${faq.question}\nA: ${faq.answer}`)
        .join("\n\n");
}

function findBestFaqMatch(faqs, userQuery) {
    const normalizedUserQuery = normalizeForMatch(userQuery);
    if (!normalizedUserQuery) return null;

    const exactMatch = faqs.find(faq => normalizeForMatch(faq.question) === normalizedUserQuery);
    if (exactMatch) return exactMatch;

    let bestMatch = null;
    let bestScore = 0;
    const userWords = new Set(normalizedUserQuery.split(" ").filter(word => word.length > 2));

    faqs.forEach(faq => {
        const normalizedQuestion = normalizeForMatch(faq.question);
        const questionWords = normalizedQuestion
            .split(" ")
            .filter(word => word.length > 2);

        if (!questionWords.length) return;

        const overlapCount = questionWords.filter(word => userWords.has(word)).length;
        const overlapScore = overlapCount / questionWords.length;
        const containsScore = normalizedUserQuery.includes(normalizedQuestion) ? 1 : 0;
        const score = Math.max(overlapScore, containsScore);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = faq;
        }
    });

    return bestScore >= 0.6 ? bestMatch : null;
}

function renderWelcome() {
    chatBox.innerHTML = "";
    const msg = document.createElement("div");
    msg.className = "message-wrapper bot";
    msg.innerHTML = `
        <div class="message-content">
            <div class="typing-bubble" aria-hidden="true">
                <span></span><span></span><span></span>
            </div>
            <div style="margin-top:8px;">
                Hello! 👋 I'm your 24/7 College Assistant.
                Ask me about attendance, exams, library, notices, or campus rules.
            </div>
        </div>
    `;
    chatBox.appendChild(msg);
    scrollChatToBottom();
}

function addMessage(text, type, meta = "") {
    const wrapper = document.createElement("div");
    wrapper.className = `message-wrapper ${type}`;

    const content = document.createElement("div");
    content.className = "message-content";

    const textEl = document.createElement("div");
    textEl.className = "message-text";
    textEl.textContent = normalizeMessageText(text);

    content.appendChild(textEl);

    wrapper.appendChild(content);

    if (meta) {
        const metaEl = document.createElement("div");
        metaEl.className = "message-meta";
        metaEl.textContent = meta;
        content.appendChild(metaEl);
    }

    chatBox.appendChild(wrapper);
    scrollChatToBottom();
    return wrapper;
}

function addSkeleton() {
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper bot";
    wrapper.innerHTML = `
        <div class="message-content">
            <div class="typing-bubble" aria-hidden="true">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatBox.appendChild(wrapper);
    scrollChatToBottom();
    return wrapper;
}

function buildHistoryItem(chat) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "history-item";
    item.innerHTML = `
        <div class="history-date">${chat.date}</div>
        <div class="history-preview">${chat.preview}</div>
    `;
    item.addEventListener("click", () => loadChatHistory(chat.id));
    return item;
}

// --------- HISTORY ----------
function saveToHistory(userMsg, botMsg) {
    const entry = {
        id: Date.now(),
        date: formatDateTime(),
        preview: userMsg.slice(0, 72) + (userMsg.length > 72 ? "..." : ""),
        messages: [{ user: userMsg, bot: botMsg }]
    };

    chatHistory.unshift(entry);
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(0, 20);
    saveHistory();
}

function loadHistory() {
    historyList.innerHTML = "";

    if (!chatHistory.length) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML = `
            <div>
                <i class="fas fa-clock-rotate-left"></i>
                <p>No chat history yet.</p>
            </div>
        `;
        historyList.appendChild(empty);
        return;
    }

    chatHistory.forEach(chat => historyList.appendChild(buildHistoryItem(chat)));
}

function loadChatHistory(chatId) {
    const chat = chatHistory.find(c => String(c.id) === String(chatId));
    if (!chat) return;

    switchTab("chat");
    chatBox.innerHTML = "";

    chat.messages.forEach(msg => {
        addMessage(msg.user, "user");
        addMessage(msg.bot, "bot");
    });
}

function clearHistory() {
    const ok = confirm("Clear all chat history?");
    if (!ok) return;
    chatHistory = [];
    saveHistory();
    loadHistory();
}

// --------- UI ----------
function openChat() {
    chatContainer.classList.add("active");
    chatContainer.setAttribute("aria-hidden", "false");
    aboutSection.style.display = "none";
    isChatVisible = true;
    isMinimized = false;
    chatContainer.style.pointerEvents = "auto";
    setTimeout(() => userInput.focus(), 150);
}

function closeChat() {
    chatContainer.classList.remove("active");
    chatContainer.setAttribute("aria-hidden", "true");
    aboutSection.style.display = "flex";
    isChatVisible = false;
    isMinimized = false;
}

function minimizeChat() {
    if (!isChatVisible) return;

    isMinimized = !isMinimized;

    if (isMinimized) {
        chatContainer.style.transform = "translateY(calc(100% - 72px)) scale(0.995)";
        chatContainer.style.opacity = "1";
        chatContainer.style.visibility = "visible";
    } else {
        chatContainer.style.transform = "translateY(0) scale(1)";
    }
}

function switchTab(tabName) {
    document.querySelectorAll(".tab-pane").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".nav-btn[data-tab]").forEach(btn => btn.classList.remove("active"));

    const activeTab = document.getElementById(`${tabName}-tab`);
    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);

    if (activeTab) activeTab.classList.add("active");
    if (activeBtn) activeBtn.classList.add("active");

    if (tabName === "history") loadHistory();
    if (tabName === "chat") scrollChatToBottom();
}

function newChat() {
    currentChatMessages = [];
    chatBox.innerHTML = "";
    renderWelcome();
    userInput.value = "";
    autoGrowTextarea(userInput);
    userInput.focus();
}

function setSendBusy(isBusy) {
    sendBtn.disabled = isBusy;
    voiceBtn.disabled = isBusy;
    sendBtn.style.opacity = isBusy ? "0.7" : "1";
    voiceBtn.style.opacity = isBusy ? "0.7" : "1";
}

// --------- FIREBASE / GEMINI ----------
async function loadFAQs() {
    const faqs = [];

    try {
        const querySnapshot = await getDocs(collection(db, "faqs"));
        querySnapshot.forEach(doc => {
            const f = doc.data();
            // Only add FAQs with both question and answer
            if (f.question && f.answer) {
                faqs.push({
                    question: String(f.question).trim(),
                    answer: String(f.answer).trim()
                });
            }
        });
    } catch (error) {
        console.error("Firebase error:", error);
    }

    return faqs;
}

function buildPrompt(faqText, userQuery) {
    return `
SYSTEM ROLE:
You are the official "College Student Assistant AI". Your tone is helpful, polite, and concise.

CONTEXT (KNOWLEDGE BASE):
${faqText || "No FAQ data available for this specific query."}

YOUR INSTRUCTIONS:
1. Analyze the User's Input:
   - Look for keywords and intent, even if there are spelling mistakes, short forms (e.g., "req" for required, "min" for minimum), or bad grammar.

2. Handle Greetings & Small Talk:
   - If the user says "Hi", "Hello", "Hey", etc., reply with a friendly welcome message.

3. Handle Identity:
   - If asked "Who are you?", reply: "I am the College Inquiry Chatbot, developed by Code Mafia Team to help students."

4. Answer Questions (The Core Task):
   - Search the "CONTEXT" above for the answer.
   - Match the Meaning: If the user asks "attendance rules" and the FAQ has "What is the minimum attendance?", understand that they match.
   - Do NOT invent college rules. If the specific answer is not in the CONTEXT, say exactly: "I'm sorry, I don't have information on that specific topic. Please contact the college administration."

USER INPUT:
"${userQuery}"

IMPORTANT: You must provide the actual answer from the context above. Answer in full, complete sentences. Do not cut off your response. 

AI RESPONSE:
`;
}

async function askGemini(faqText, userQuery) {
    if (!GEMINI_KEY || GEMINI_KEY === "G.K") {
        return "Please add your Gemini API key in app.js.";
    }

    const prompt = buildPrompt(faqText, userQuery);

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 1024
                    }
                })
            }
        );

        const data = await res.json();

        if (!res.ok || data.error) {
            console.error("Gemini API Error:", data.error || data);
            return "My brain is busy right now. Please try again in a moment.";
        }

        const parts = data?.candidates?.[0]?.content?.parts || [];
        const reply = parts
            .map(part => part?.text || "")
            .join("\n")
            .trim();

        return reply || "Please contact the college administration.";
    } catch (error) {
        console.error("Network Error:", error);
        return "I am having trouble connecting. Please check your internet connection.";
    }
}

// --------- SEND MESSAGE ----------
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    currentChatMessages.push({ role: "user", text: message });
    userInput.value = "";
    autoGrowTextarea(userInput);

    const skeleton = addSkeleton();
    setSendBusy(true);

    try {
        const faqs = await loadFAQs();
        
        // Validate FAQ data exists
        if (!faqs || faqs.length === 0) {
            skeleton.remove();
            addMessage("I'm unable to access the FAQ database. Please try again later.", "bot");
            return;
        }
        
        // Find best matching FAQ or use Gemini
        const matchedFaq = findBestFaqMatch(faqs, message); 
        
        const reply = matchedFaq
            ? normalizeMessageText(matchedFaq.answer)
            : await askGemini(buildFaqKnowledgeBase(faqs), message);

        // Safe debugging logs
        console.log("1. Did we find an exact match in Firebase?", matchedFaq ? "YES" : "NO");
        console.log("2. The final reply being sent to chat:", reply);

        skeleton.remove();
        addMessage(reply, "bot");

        currentChatMessages.push({ role: "bot", text: reply });
        saveToHistory(message, reply);
    } catch (error) {
        console.error("Chat Error:", error);
        skeleton.remove();
        addMessage("Sorry, something went wrong. Please try again.", "bot");
    } finally {
        setSendBusy(false);
        userInput.focus();
    }
}

// --------- VOICE INPUT ----------
function startVoiceInput() {
    voiceBtn.classList.add("active");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Voice input is not supported in this browser.");
        voiceBtn.classList.remove("active");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        autoGrowTextarea(userInput);
        sendMessage();
    };

    recognition.onend = () => {
        voiceBtn.classList.remove("active");
    };

    recognition.onerror = () => {
        voiceBtn.classList.remove("active");
    };

    recognition.start();
}

// --------- EVENTS ----------
document.addEventListener("DOMContentLoaded", () => {
    setTheme(getTheme());
    renderWelcome();
    loadHistory();
    autoGrowTextarea(userInput);

    startChatBtn.addEventListener("click", openChat);
    newChatBtn.addEventListener("click", newChat);
    closeChatBtn.addEventListener("click", closeChat);
    if (minimizeBtn) {
        minimizeBtn.addEventListener("click", minimizeChat);
    }
    clearHistoryBtn.addEventListener("click", clearHistory);
    themeToggle.addEventListener("click", () => {
        const next = document.body.dataset.theme === "dark" ? "light" : "dark";
        setTheme(next);
    });
    sendBtn.addEventListener("click", sendMessage);
    voiceBtn.addEventListener("click", startVoiceInput);

    document.querySelectorAll(".nav-btn[data-tab]").forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll(".quick-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            userInput.value = btn.dataset.query || "";
            autoGrowTextarea(userInput);
            sendMessage();
        });
    });

    userInput.addEventListener("input", () => autoGrowTextarea(userInput));

    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    
});

// --------- GLOBALS FOR INLINE SAFETY ----------
window.openChat = openChat;
window.closeChat = closeChat;
window.newChat = newChat;
window.switchTab = switchTab;
window.loadChatHistory = loadChatHistory;
window.sendMessage = sendMessage;
window.clearHistory = clearHistory;
window.minimizeChat = minimizeChat; 
