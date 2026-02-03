// how2use.js
document.addEventListener("DOMContentLoaded", () => {
  const btnGuest = document.getElementById("btnGuest");
  const btnUser = document.getElementById("btnUser");
  const sectionGuest = document.getElementById("sectionGuest");
  const sectionUser = document.getElementById("sectionUser");
  const menuBtn = document.querySelector(".menu-btn");

  const ACCESS_TOKEN_KEY = "pe_access_token"; // ✅ ใช้ key เดียวกับหน้าอื่น

  function isLoggedIn() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return !!(token && token.trim().length > 0);
  }

  function setMode(mode) {
    if (mode === "guest") {
      sectionGuest.classList.add("active");
      sectionUser.classList.remove("active");
      btnGuest.classList.add("primary");
      btnGuest.classList.remove("secondary");
      btnUser.classList.add("secondary");
      btnUser.classList.remove("primary");
    } else {
      sectionGuest.classList.remove("active");
      sectionUser.classList.add("active");
      btnGuest.classList.add("secondary");
      btnGuest.classList.remove("primary");
      btnUser.classList.add("primary");
      btnUser.classList.remove("secondary");
    }
  }

  if (btnGuest) btnGuest.addEventListener("click", () => setMode("guest"));
  if (btnUser) btnUser.addEventListener("click", () => setMode("user"));

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      // ✅ ตัดสินจากการ login จริง (token)
      window.location.href = isLoggedIn() ? "./ham-log.html" : "./ham-guest.html";
    });
  }

  setMode("guest");
});
