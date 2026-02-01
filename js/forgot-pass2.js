// js/forgot-password2.js
document.addEventListener("DOMContentLoaded", () => {
    const emailSpan = document.querySelector(".bold");    // ตรง username@gmail.com
    const resendButton = document.querySelector(".btn");  // ปุ่ม Resend email
    const container = document.querySelector(".container");
  
    // สร้าง message box ไว้แสดงผล
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
    // 1) ดูจาก URL เช่น forgot-pass2.html?email=aaa@bbb.com
    const params = new URLSearchParams(window.location.search);
    let email = params.get("email");
  
    // 2) ถ้าไม่มีใน URL ลองอ่านจาก localStorage (ต้องไป set จากหน้า forgot step1)
    if (!email) {
      email = localStorage.getItem("pe_reset_email") || "your email";
    }
  
    // ใส่ email ลงใน span
    emailSpan.textContent = email;
  
    // ----- กดปุ่ม Resend email -----
    resendButton.addEventListener("click", async () => {
      const trimmedEmail = email.trim();
  
      if (!trimmedEmail || trimmedEmail === "your email") {
        showMessage("ไม่พบอีเมลที่จะใช้ส่งอีกครั้ง", "error");
        return;
      }
  
      const payload = {
        email: trimmedEmail,
      };
  
      resendButton.disabled = true;
      resendButton.textContent = "Resending...";
  
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/request_password_reset",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
  
        if (!response.ok) {
          let detail = "ส่งอีเมลไม่สำเร็จ";
          try {
            const err = await response.json();
            detail = err.detail || detail;
          } catch (_) {}
  
          return;
        }
  
        showMessage(
          "ส่งอีเมลรีเซ็ตรหัสผ่านอีกครั้งสำเร็จ กรุณาตรวจสอบกล่องอีเมล"
        );
      } catch (error) {
        console.error("Network error:", error);
        showMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
      } finally {
        resendButton.disabled = false;
        resendButton.textContent = "Resend email";
      }
    });
  });
  