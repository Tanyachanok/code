// js/forgot-password3.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const passwordInputs = document.querySelectorAll(".input");
  const eyeIcons = document.querySelectorAll(".icon");
  const updateButton = document.querySelector(".btn");

  const [passwordInput, confirmInput] = passwordInputs;

  // message box
  const messageBox = document.createElement("p");
  messageBox.style.marginTop = "12px";
  messageBox.style.fontSize = "0.9rem";
  messageBox.style.textAlign = "center";
  container?.appendChild(messageBox);

  function showMessage(text, type = "info") {
    messageBox.textContent = text;
    messageBox.style.color =
      type === "error" ? "#c53030" : type === "success" ? "#2f855a" : "#4a5568";
  }

  // ✅ อ่าน id จาก URL เช่น forgot-password3.html?id=USR001
  const params = new URLSearchParams(window.location.search);
  const idFromUrl = params.get("id");
  const idFromStorage = localStorage.getItem("pe_reset_user_id"); // (ถ้าคุณเคยเก็บไว้)
  const userId = idFromUrl || idFromStorage;

  if (!userId) {
    showMessage("ไม่พบ user id สำหรับรีเซ็ตรหัสผ่าน (ต้องมี ?id=USRxxx)", "error");
  }

  // toggle show/hide password
  eyeIcons.forEach((icon, index) => {
    icon.style.cursor = "pointer";
    icon.addEventListener("click", () => {
      const input = passwordInputs[index];
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  updateButton.addEventListener("click", async () => {
    const newPassword = passwordInput.value.trim();
    const confirmPassword = confirmInput.value.trim();

    if (!newPassword || !confirmPassword) {
      showMessage("กรุณากรอก Password และ Confirm Password ให้ครบ", "error");
      return;
    }
    if (newPassword.length < 8) {
      showMessage("กรุณาตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("Password และ Confirm Password ไม่ตรงกัน", "error");
      return;
    }
    if (!userId) {
      showMessage("ไม่พบ user id สำหรับรีเซ็ตรหัสผ่าน", "error");
      return;
    }

    // ✅ payload ให้ตรง Postman / schema
    const payload = {
      id: userId,
      new_password: newPassword,
      confirm_new_password: confirmPassword,
    };

    updateButton.disabled = true;
    updateButton.textContent = "Updating...";
    showMessage("กำลังอัปเดตรหัสผ่าน...", "info");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (_) {}

      if (!response.ok) {
        const detail = data.detail || data.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ";
        showMessage(detail, "error");
        return;
      }

      showMessage("เปลี่ยนรหัสผ่านสำเร็จ", "success");

      localStorage.removeItem("pe_reset_email");
      localStorage.removeItem("pe_reset_user_id");

      window.location.href = "forgot-pass4.html";
    } catch (error) {
      console.error("Network error:", error);
      showMessage("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "error");
    } finally {
      updateButton.disabled = false;
      updateButton.textContent = "Update Password";
    }
  });
});
