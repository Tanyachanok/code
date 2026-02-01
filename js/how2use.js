// js/menu-router.js
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.querySelector(".menu");
    if (!menuBtn) return;
  
    menuBtn.addEventListener("click", () => {
      const token = localStorage.getItem("pe_access_token");
  
      // ถ้ามี token → ถือว่าล็อกอินแล้ว
      if (token) {
        window.location.href = "ham-log.html";    // เมนูสำหรับ user ที่ login แล้ว
      } else {
        window.location.href = "ham-guest.html";  // เมนู guest
      }
    });
  });
  