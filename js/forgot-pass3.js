document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const passwordInputs = document.querySelectorAll(".input");
  const eyeIcons = document.querySelectorAll(".icon");
  const updateButton = document.querySelector(".btn");
  const [passwordInput, confirmInput] = passwordInputs;

  const BASE_URL = "https://webapp-pe.onrender.com";
  const RESET_ENDPOINT = "/auth/reset"; 
  // 👆 สำคัญ: เปลี่ยนให้ “ตรงกับ Swagger ของ backend” ของเธอ
  // ถ้าใน Swagger เป็น /auth/reset ก็ใส่ "/auth/reset"
  // ถ้าเป็น /auth/reset_password ก็ใช้แบบนี้

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

  // ✅ อ่าน token จาก URL (เมลใช้ ref ก็ได้)
  const params = new URLSearchParams(window.location.search);
  const token = params.get("ref") || params.get("token");

  if (!token) {
    showMessage("ลิงก์ไม่ถูกต้อง (ไม่พบ token/ref) กรุณาขอลิงก์ใหม่", "error");
    updateButton.disabled = true;
    return;
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

    // ✅ payload ตามที่เธอบอก backend ต้องการ
    const payload = {
      token: token,
      new_password: newPassword,
      confirm_new_password: confirmPassword,
    };

    updateButton.disabled = true;
    updateButton.textContent = "Updating...";
    showMessage("กำลังอัปเดตรหัสผ่าน...", "info");

    try {
      const res = await fetch(`${BASE_URL}${RESET_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      // ✅ debug เวลาเจอ 422 จะเห็น detail ชัด
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) {}

      if (!res.ok) {
        const detail = data.detail || data.message || text || "เปลี่ยนรหัสผ่านไม่สำเร็จ";
        showMessage(typeof detail === "string" ? detail : JSON.stringify(detail), "error");
        return;
      }

      showMessage("เปลี่ยนรหัสผ่านสำเร็จ ✅", "success");
      localStorage.removeItem("pe_reset_email");
      window.location.href = "./forgot-pass4.html";
    } catch (err) {
      console.error(err);
      showMessage("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "error");
    } finally {
      updateButton.disabled = false;
      updateButton.textContent = "Update Password";
    }
  });
});
