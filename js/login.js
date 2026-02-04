// js/login.js
document.addEventListener("DOMContentLoaded", () => {
    // --- เลือก element จากหน้าจอ ---
    const form = document.querySelector("form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rememberCheckbox = form.querySelector('input[name="remember"]');
    const submitButton = form.querySelector('button[type="submit"]');
    const closeBtn = document.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        window.location.href = "/index.html";
  });
}

    // ป้องกัน null (กันหน้าไหนไม่มี form แล้วพัง)
    if (!form || !usernameInput || !passwordInput || !submitButton) return;
  
    // --- กล่องแสดงข้อความ Error / Success ---
    // const messageBox = document.createElement("p");
    //messageBox.style.marginTop = "0.75rem";
    //messageBox.style.fontSize = "0.9rem";
    //form.appendChild(messageBox); 

    const passwordError = document.getElementById("password-error");

      function showPasswordError(text) {
        passwordError.textContent = text;
      }

      function clearPasswordError() {
        passwordError.textContent = "";
}
      // เคลียร์ error ตอนพิมพ์
      passwordInput.addEventListener("input", clearPasswordError);
      usernameInput.addEventListener("input", clearPasswordError);

  
    //function showMessage(text, type = "error") {
      //messageBox.textContent = text;
  
      //if (type === "error") {
      //  messageBox.style.color = "#c53030"; // แดง
      //} else if (type === "success") {
      // messageBox.style.color = "#2f855a"; // เขียว
     // } else {
      // messageBox.style.color = "#4a5568"; // เทา
     // }
    //}
  
    // --- ใช้ Remember me ---
    const savedUsername = localStorage.getItem("pe_username");
    if (savedUsername) {
      usernameInput.value = savedUsername;
      rememberCheckbox.checked = true;
    }
  
    // --- ดัก Event เมื่อกด Login ---
    form.addEventListener("submit", async (event) => {
      event.preventDefault(); // กันไม่ให้ Reload หน้า
  
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();
  
      // Validate
      if (!username || !password) {
        showPasswordError("กรุณากรอก Username และ Password");
        return;
      }
  
      // Remember me
      if (rememberCheckbox.checked) {
        localStorage.setItem("pe_username", username);
      } else {
        localStorage.removeItem("pe_username");
      }
  
      // Payload แบบ JSON
      const payload = {
        username: username,
        password: password,
      };
  
      // ล็อกปุ่มกันกดซ้ำ
      submitButton.disabled = true;
      submitButton.textContent = "Logging in...";
      //showMessage("กำลังเข้าสู่ระบบ...", "info");
  
      try {
        // เปลี่ยน URL ตาม backend 
        const BASE_URL = "https://webapp-pe.onrender.com";
        const LOGIN_API = `${BASE_URL}/auth/login`;

        // const body = new URLSearchParams();
        //body.append("username", username);
        //body.append("password", password);
      console.log("payload",payload)
      const response = await fetch(LOGIN_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
      });


  
        if (!response.ok) {
          let errorDetail = "";
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || "Login failed";
          } catch (_) {
            errorDetail = "Login failed";
          }
  
          showPasswordError(errorDetail);
          submitButton.disabled = false;
          submitButton.textContent = "Login";
          return;
        }

        
        
        clearPasswordError();


        const data = await response.json();
        console.log("Login success:", data);
  
        // ถ้ามี access_token (JWT)
        if (data.access_token) {
          localStorage.setItem("pe_access_token", data.access_token);
        }
  
        //showMessage("Login Success", "success");
  
        // เปลี่ยนหน้าไป Home for Login user
        window.location.href = "/home4log.html"; 
      } catch (error) {
        console.error("Network error:", error);
        showPasswordError(
          "error"
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Login";
      }
    });
  });
  