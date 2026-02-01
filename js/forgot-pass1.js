// js/forgot-password1.js
document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.querySelector(".input");
    const sendButton = document.querySelector(".btn");
  
    // กล่องแสดงข้อความ
    const messageBox = document.createElement("p");
    messageBox.style.marginTop = "12px";
    messageBox.style.fontSize = "0.9rem";
    messageBox.style.textAlign = "center";
    document.querySelector(".container")?.appendChild(messageBox);
  
    function showMessage(text, type = "error") {
      messageBox.textContent = text;
      messageBox.style.color =
        type === "error" ? "#c53030" : type === "success" ? "#2f855a" : "#4a5568";
    }
  
    sendButton.addEventListener("click", async () => {
      const email = emailInput.value.trim();
  
      if (!email) {
        showMessage("กรุณากรอกอีเมล");
        return;
      }
  
      const payload = { email };
  
      sendButton.disabled = true;
      sendButton.textContent = "Sending...";
      showMessage("กำลังส่งอีเมล...", "info");
  
      try {
        // ✅ ให้ตรงกับ Postman
        const response = await fetch("http://127.0.0.1:8000/auth/forget_password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        });
  
        const text = await response.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (_) {}
  
        if (!response.ok) {
          // FastAPI มักส่ง {detail: "..."} หรือ {message: "..."}
          const detail = data.detail || data.message || "ส่งอีเมลไม่สำเร็จ";
          showMessage(detail, "error");
          return;
        }
  
        showMessage("ส่งอีเมลสำเร็จ! กรุณาตรวจสอบกล่องอีเมล", "success");
  
        // เก็บอีเมลไว้ใช้หน้า 2
        localStorage.setItem("pe_reset_email", email);
  
        // เด้งไปหน้า forgot-password2
        window.location.href = "forgot-password2.html";
      } catch (err) {
        console.error("Network error:", err);
        showMessage("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "error");
      } finally {
        sendButton.disabled = false;
        sendButton.textContent = "Send Email";
      }
    });
  });
  