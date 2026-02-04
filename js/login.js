document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const submitButton = form?.querySelector('button[type="submit"]');
  const rememberCheckbox = form?.querySelector('input[name="remember"]');
  const closeBtn = document.querySelector(".close-btn");
  const passwordError = document.getElementById("password-error");

  if (!form || !usernameInput || !passwordInput || !submitButton || !passwordError) return;

  const showPasswordError = (text) => { passwordError.textContent = text || ""; };
  const clearPasswordError = () => { passwordError.textContent = ""; };

  closeBtn?.addEventListener("click", () => (window.location.href = "/index.html"));
  usernameInput.addEventListener("input", clearPasswordError);
  passwordInput.addEventListener("input", clearPasswordError);

  // remember me
  const savedUsername = localStorage.getItem("pe_username");
  if (savedUsername) {
    usernameInput.value = savedUsername;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showPasswordError("กรุณากรอก Username และ Password");
      return;
    }

    if (rememberCheckbox?.checked) localStorage.setItem("pe_username", username);
    else localStorage.removeItem("pe_username");

    submitButton.disabled = true;
    submitButton.textContent = "Logging in...";

    try {
      const LOGIN_API = "https://webapp-pe.onrender.com/auth/login";

      const res = await fetch(LOGIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // ✅ กัน detail ไม่ใช่ string
        let msg = "Incorrect username or password";
        if (typeof data.detail === "string") msg = data.detail;
        else if (Array.isArray(data.detail) && data.detail[0]?.msg) msg = data.detail[0].msg;
        else if (data.message) msg = data.message;

        showPasswordError(msg);
        return;
      }

      clearPasswordError();

      if (data.access_token) localStorage.setItem("pe_access_token", data.access_token);
      window.location.href = "/home4log.html";

    } catch (err) {
      console.error(err);
      showPasswordError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Login";
    }
  });
});
