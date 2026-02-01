document.addEventListener("DOMContentLoaded", () => {
    const input = document.querySelector(".search-input");
    const btn = document.querySelector(".search-btn");
    const listCard = document.querySelector(".list-card");
  
    const ACCESS_TOKEN_KEY = "pe_access_token";
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  
    const BASE_URL = "http://127.0.0.1:8000/record/timeline";
  
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      window.location.href = "login.html";
      return;
    }
  
    // 🎯 กดค้นหา
    btn.addEventListener("click", () => {
      let hn = input.value.trim();
  
      if (!hn) {
        alert("กรุณากรอก Hospital Number");
        return;
      }
  
      const url = `${BASE_URL}?no=${hn}`;
      console.log("CALL TIMELINE =", url);
  
      loadTimeline(url);
    });
  
    // ==============================
    // 🔧 โหลดข้อมูลจาก backend
    // ==============================
    async function loadTimeline(url) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        });
  
        if (!res.ok) {
          listCard.innerHTML = "<div class='list-item'>ไม่พบข้อมูล</div>";
          return;
        }
  
        const data = await res.json();
        console.log("TIMELINE =", data);
        renderList(data);
  
      } catch (err) {
        console.error("ERROR timeline:", err);
      }
    }
  
    // ==============================
    // 🔧 แปลงวันที่เป็น พ.ศ.
    // ==============================
    function formatThaiDate(iso) {
      const d = new Date(iso);
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear() + 543;
      return `${day} / ${month} / ${year}`;
    }
  
    // ==============================
    // 🔧 แสดงผลลิสต์
    // ==============================
    function renderList(list) {
      listCard.innerHTML = "";
  
      if (list.length === 0) {
        listCard.innerHTML = "<div class='list-item'>ไม่พบข้อมูล</div>";
        return;
      }
  
      list.forEach(item => {
        const div = document.createElement("div");
        div.className = "list-item";
  
        const dateTh = formatThaiDate(item.predicted_date);
        div.textContent = dateTh;
  
        // 👉 คลิกเพื่อดูหน้า history2
        div.addEventListener("click", () => {
          window.location.href = `history2.html?id=${item.predict_id}`;
        });
  
        listCard.appendChild(div);
      });
    }
  });
  