// js/register.js
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form.form");
    const firstNameInput = document.getElementById("first_name");
    const lastNameInput = document.getElementById("last_name");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirm");
    const submitButton = form.querySelector('button[type="submit"]');
  
    // กล่องข้อความแจ้งเตือน / ผลลัพธ์
    const messageBox = document.createElement("p");
    messageBox.style.marginTop = "0.75rem";
    messageBox.style.fontSize = "0.9rem";
    form.appendChild(messageBox);
  
    function showMessage(text, type = "error") {
      messageBox.textContent = text;
  
      if (type === "error") {
        messageBox.style.color = "#c53030"; // แดง
      } else if (type === "success") {
        messageBox.style.color = "#2f855a"; // เขียว
      } else {
        messageBox.style.color = "#4a5568"; // เทา
      }
    }
  
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const firstName = firstNameInput.value.trim();
      const lastName = lastNameInput.value.trim();
      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const confirm = confirmInput.value.trim();
  
      // ตรวจว่ากรอกครบไหม
      if (!firstName || !lastName || !username || !email || !password || !confirm) {
        showMessage("กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
        return;
      }
  
      // ตรวจว่ารหัสผ่านตรงกันไหม
      if (password !== confirm) {
        showMessage("Password และ Confirm Password ไม่ตรงกัน", "error");
        return;
      }
  
      // เงื่อนไขความยาวรหัสผ่าน (จะมีก็ได้ ไม่มีก็ได้)
      if (password.length < 8) {
        showMessage("กรุณาตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร");
        return;
      }
      if (!/[A-Z]/.test(password)) {
        showMessage("ต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว", "error");
        return;
      }
      if (!/[a-z]/.test(password)) {
        showMessage("ต้องมีตัวอักษรพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว", "error");
        return;
      }
      if (!/[0-9]/.test(password)) {
        showMessage("ต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว", "error");
        return;
      }
      
  
      // เตรียม payload ที่ส่งไป backend
      const payload = {
        first_name: firstName,
        last_name: lastName,
        username: username,
        email: email,
        password: password,
        confirm_password: confirm, // ให้ตรงกับ schema UsersCreate ของ FastAPI
      };
  
      // ล็อกปุ่มกันกดซ้ำ
      submitButton.disabled = true;
      submitButton.textContent = "Signing up...";
      showMessage("กำลังสร้างบัญชีผู้ใช้...", "info");
  
      try {
        const response = await fetch("https://webapp-pe.onrender.com", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) {
          let errorDetail = "Register failed";
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (_) {}
          showMessage(errorDetail, "error");
          return;
        }
  
        const data = await response.json();
        console.log("Register success:", data);
  
        showMessage("สมัครสมาชิกสำเร็จ กำลังกลับไปหน้า Login...", "success");
  
        // เปลี่ยนหน้าไป Login หลังสมัครสำเร็จ
        window.location.href = "/login.html";
      } catch (error) {
        console.error("Network error:", error);
        showMessage("error");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Sign Up";
      }
    });
  });
  