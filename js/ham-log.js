document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".menu-list .item");
    const closeBtn = document.querySelector(".close-btn");
  
    const BASE_URL = "https://xgfbbwk2-8000.asse.devtunnels.ms";
    const LOGOUT_API = `${BASE_URL}/auth/logout`;
  
    async function logoutUser() {
      const token = localStorage.getItem("pe_access_token");
  
      try {
        await fetch(LOGOUT_API, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.error("Logout request failed:", err);
      }
  
      localStorage.removeItem("pe_access_token");
      window.location.href = "login.html";
    }
  
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const target = item.getAttribute("data-target");
  
        if (item.id === "logout-btn") {
          logoutUser();
          return;
        }
  
        if (target) window.location.href = target;
      });
    });
  
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (window.history.length > 1) window.history.back();
      });
    }
  });
  