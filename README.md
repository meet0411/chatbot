# chatbot

🏫 Campus QueryBot

A smart, FAQ-based chatbot built for colleges to answer common student queries such as exams, timetable, facilities, and administration — fast and reliably.

Powered by Google Gemini + Firebase Firestore, Campus QueryBot helps reduce repetitive queries and supports students with instant answers.

👥 Team — Code Mafia
Member	Role
Meet Agrawal	Developer
Pranav Bhatt	Developer
Ishan Chand	    Developer
Varun Baliharia	Developer

College: Vidyavardhini's College Of Engineering & Technology
Year / Branch: SE — Computer(Second Year)


🎯 Problem We’re Solving

Students constantly ask the same questions:

“When are the exams?”
“Where do I submit forms?”
“Who do I contact for fee issues?”
“What is the timetable?”

Teachers & admin spend time answering repeating questions.
👉 Campus QueryBot automates this.


🤖 What is Campus QueryBot?

Campus QueryBot is a college helpdesk chatbot that:

✔ Answers only from verified FAQs stored in database
✔ Prevents wrong or random answers
✔ Gives reliable guidance
✔ Shows admin-approved responses

If an answer is missing, it politely says:
“Please contact the college administration.”


⚙️ How It Works (Flow)

1️⃣ Student types a question
2️⃣ System fetches FAQ data from Firebase Firestore
3️⃣ FAQ data + question is sent to Google Gemini API
4️⃣ Gemini matches the best answer
5️⃣ Bot returns the response in chat UI

Simple, fast, and secure.


🧰 Google Technologies & Tools Used
🔥 Firebase (Backend Database)
Firestore to store FAQs
Fast and secure cloud storage
Easy to manage and update data


🤖 Google Gemini API (AI Brain)

Understands questions
Matches with FAQ
Generates clean answers


🌐 Web Technologies

HTML — UI Layout
CSS — Styling
JavaScript (ES Modules) — Logic and API calls

🧪 MVP (Minimum Viable Product)
✅ Core Features Implemented

✔ Chat interface
✔ FAQ stored in Firestore
✔ AI-powered responses using Gemini
✔ Restricts answers to FAQ only
✔ Fallback message when answer not found

🚀 Next Improvements (Future Scope)

🔹 Admin panel to add FAQs directly
🔹 Student login
🔹 Analytics — what students ask most
🔹 Multi-language support
🔹 Voice-based chatbot

▶️ How to Run

1️⃣ Clone project / download files
2️⃣ Open project in VS Code
3️⃣ Replace GEMINI API key
4️⃣ Open with Live Server
