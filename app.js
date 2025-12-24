function addMessage(text, sender) {
  const box = document.getElementById("chat-box");

  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;

  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  addMessage("Thinking...", "bot");
}
