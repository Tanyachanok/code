// js/forgot-pass1.js
document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.querySelector(".input");
  const sendButton = document.querySelector(".btn");

  const BASE_URL = "https://xgfbbwk2-8000.asse.devtunnels.ms";

  // กล่องแสดงข้อความ (optional)
  const messageBox = document.createElement("p");
  messageBox.style.marginTop = "12px";
  messageBox.style.fontSize = "0.9rem";
  messageBox.style.textAlign = "center";
  document.querySelector(".container")?.appendChild(messageBox);

  function showMessage(text, type = "info") {
    messageBox.textContent = text;
    messageBox.style.color =
      type === "error" ? "#c53030" : type === "success" ? "#2f855a" : "#4a5568";
  }

  sendButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) return showMessage("กรุณากรอกอีเมล", "error");

    sendButton.disabled = true;
    sendButton.textContent = "Sending...";
    showMessage("กำลังส่งอีเมล...", "info");

    try {
      const res = await fetch(`${BASE_URL}/auth/forget_password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showMessage(data.detail || data.message || "ส่งอีเมลไม่สำเร็จ", "error");
        sendButton.disabled = false;
        sendButton.textContent = "Send Email";
        return;
      }

      // ✅ เก็บอีเมลไว้ให้หน้า 2 แสดง
      localStorage.setItem("pe_reset_email", email);

      // ✅ เด้งไปหน้า 2
      window.location.href = "forgot-pass2.html";
    } catch (err) {
      console.error(err);
      showMessage("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "error");
      sendButton.disabled = false;
      sendButton.textContent = "Send Email";
    }
  });
});
