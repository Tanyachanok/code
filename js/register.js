document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".form");
    if (!form) return;

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirm");
    const submitButton = form?.querySelector('button[type="submit"]');


    const togglePassword = document.getElementById("togglePassword");
    const toggleConfirm = document.getElementById("toggleConfirm");

    const setupPasswordToggle = (btn, input) => {
        if (!btn || !input) return;

        btn.style.cursor = "pointer"; 

        btn.addEventListener("click", () => {
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            btn.src = isPassword ? "/hide.png" : "/view.png";
        });
    };

    setupPasswordToggle(togglePassword, passwordInput);
    setupPasswordToggle(toggleConfirm, confirmInput);

    form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = {
      first_name: document.getElementById("first_name").value.trim(),
      last_name: document.getElementById("last_name").value.trim(),
      username: usernameInput.value.trim(),
      email: document.getElementById("email").value.trim(),
      password: passwordInput.value.trim(),
      confirm_password: confirmInput.value.trim(),
    };

    submitButton.disabled = true;
    submitButton.textContent = "Signing up...";

    try {
      const BASE_URL = "https://webapp-pe.onrender.com";
      const REGISTER_API = `${BASE_URL}/auth/register`;

      const response = await fetch(REGISTER_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorDetail = "สมัครสมาชิกไม่สำเร็จ";
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail;
        } catch (_) {}

        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: errorDetail,
          icon: "error",
          confirmButtonColor: "#e63946"
        });
        return;
      }

      Swal.fire({
        title: "สำเร็จ!",
        text: "สมัครสมาชิกสำเร็จ กำลังกลับไปหน้า Login...",
        icon: "success",
        confirmButtonColor: "#2a9d8f",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "/login.html";
      });

    } catch (error) {
      console.error("Network error:", error);
      Swal.fire("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "โปรดลองใหม่อีกครั้งภายหลัง", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Sign Up";
    }
  });
});


// --- ฟังก์ชันเสริม (Helper Functions) อยู่ข้างนอกได้ ---
function clearErrors() {
    document.querySelectorAll(".field").forEach((field) => {
        field.classList.remove("has-error");
    });
}

function validateForm() {
    clearErrors();
    let isValid = true;

    const requiredInputs = document.querySelectorAll(".form input[required]");
    requiredInputs.forEach((input) => {
        if (input.value.trim() === "") {
            input.closest(".field").classList.add("has-error");
            isValid = false;
        }
    });

    if (!isValid) {
        Swal.fire({
            title: "กรอกข้อมูลไม่ครบ",
            text: "กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน",
            icon: "warning",
            confirmButtonColor: "#f4a261",
        });
        return false;
    }

    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (password !== confirm) {
        document.getElementById("confirm").closest(".field").classList.add("has-error");
        Swal.fire({
            title: "รหัสผ่านไม่ตรงกัน",
            text: "Password และ Confirm Password ต้องเหมือนกัน",
            icon: "error",
            confirmButtonColor: "#e63946",
        });
        return false;
    }
    return true;
}