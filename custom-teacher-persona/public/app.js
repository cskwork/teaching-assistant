// URL에서 teacherId 추출
const teacherId = window.location.pathname.split("/").pop();
let sessionId = localStorage.getItem(`session_${teacherId}`);

const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// 선생님 정보 로드
async function loadTeacher() {
  try {
    const res = await fetch(`/api/teachers/${teacherId}`);
    if (!res.ok) throw new Error("Teacher not found");

    const teacher = await res.json();
    document.getElementById("teacherName").textContent = teacher.name;
    document.getElementById("teacherDesc").textContent = teacher.description;
    document.title = `Chat with ${teacher.name}`;
  } catch (e) {
    document.getElementById("teacherName").textContent = "Unknown Teacher";
  }
}

// 메시지 추가
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

// 로딩 표시
function showLoading() {
  const div = document.createElement("div");
  div.className = "message assistant";
  div.id = "loading";
  div.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideLoading() {
  const el = document.getElementById("loading");
  if (el) el.remove();
}

// 메시지 전송
async function sendMessage() {
  const message = inputEl.value.trim();
  if (!message) return;

  inputEl.value = "";
  sendBtn.disabled = true;

  addMessage(message, "user");
  showLoading();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, message, sessionId })
    });

    hideLoading();

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantDiv = null;
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;

        try {
          const data = JSON.parse(line.slice(5).trim());

          if (data.type === "text" && data.content) {
            if (!assistantDiv) {
              assistantDiv = addMessage("", "assistant");
            }
            fullText = data.content;
            assistantDiv.textContent = fullText;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }

          if (data.sessionId && data.sessionId !== sessionId) {
            sessionId = data.sessionId;
            localStorage.setItem(`session_${teacherId}`, sessionId);
          }

          if (data.type === "error") {
            if (!assistantDiv) {
              assistantDiv = addMessage("", "assistant");
            }
            assistantDiv.textContent = `Error: ${data.content}`;
          }
        } catch (e) {
          // JSON 파싱 실패 무시
        }
      }
    }
  } catch (e) {
    hideLoading();
    addMessage(`Error: ${e.message}`, "assistant");
  }

  sendBtn.disabled = false;
  inputEl.focus();
}

// 이벤트 리스너
sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 초기화
loadTeacher();
inputEl.focus();
