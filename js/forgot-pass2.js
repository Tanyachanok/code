// js/forgot-password2.js
document.addEventListener("DOMContentLoaded", () => {
  const emailSpan = document.querySelector(".bold");   
  const resendButton = document.querySelector(".btn");
  const container = document.querySelector(".container");

  const BASE_URL = "https://webapp-pe.onrender.com";

  const messageBox = document.createElement("p");
  messageBox.style.marginTop = "12px";
  messageBox.style.fontSize = "0.9rem";
  messageBox.style.textAlign = "center";
  container.appendChild(messageBox);

  function showMessage(text, type = "info") {
    messageBox.textContent = text;
    messageBox.style.color =
      type === "error"
        ? "#c53030"
        : type === "success"
        ? "#2f855a"
        : "#4a5568";
  }

  // ----- ดึง email ที่จะใช้ -----
  const params = new URLSearchParams(window.location.search);
  let email = params.get("email");

  if (!email) {
    email = localStorage.getItem("pe_reset_email");
  }

  if (!email) {
    window.location.href = "/forget-pass1.html";
    return;
  }

  emailSpan.textContent = email;

  resendButton.addEventListener("click", async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showMessage("ไม่พบอีเมลที่จะใช้ส่งอีกครั้ง", "error");
      return;
    }

    const payload = { email: trimmedEmail };

    resendButton.disabled = true;
    const originalText = resendButton.textContent;
    resendButton.textContent = "Resending...";
    showMessage("กำลังส่งอีเมลอีกครั้ง...", "info");

    try {
      const response = await fetch(`${BASE_URL}/auth/forget_password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) {}

      if (!response.ok) {
        const detail = data.detail || data.message || "ส่งอีเมลไม่สำเร็จ";
        showMessage(detail, "error");
        return;
      }

      showMessage("ส่งอีเมลรีเซ็ตรหัสผ่านอีกครั้งสำเร็จ ✅ กรุณาตรวจสอบกล่องอีเมล/Spam", "success");

      let seconds = 30;
      resendButton.disabled = true;
      const timer = setInterval(() => {
        seconds--;
        resendButton.textContent = `Resend (${seconds}s)`;
        if (seconds <= 0) {
          clearInterval(timer);
          resendButton.disabled = false;
          resendButton.textContent = "Resend email";
        }
      }, 1000);

    } catch (error) {
      console.error("Network error:", error);
      showMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      if (!resendButton.disabled) {
        resendButton.textContent = originalText;
      }
    }
  });
});
