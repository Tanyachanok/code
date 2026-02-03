document.addEventListener("DOMContentLoaded", () => {
  // ✅ เมนู 3 ขีด
  document.querySelector(".menu-btn")?.addEventListener("click", () => {
    window.location.href = "/ham-log.html"; // เปลี่ยนเป็นหน้าที่เธอใช้จริง
  });
  const input = document.querySelector(".search-input");
  const btn = document.querySelector(".search-btn");
  const listCard = document.querySelector(".list-card");

  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  // ✅ ใช้ devtunnels
  const BASE_URL = "https://webapp-pe.onrender.com";
  const TIMELINE_API = `${BASE_URL}/record/timeline`;

  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "/login.html";
    return;
  }

  // (ถ้า input มีค่า HN อยู่แล้ว และอยากให้กดเข้าแล้วโหลดทันที)
  // const prefillHn = input.value.trim();
  // if (prefillHn) loadTimeline(`${TIMELINE_API}?no=${encodeURIComponent(prefillHn)}`);

  btn?.addEventListener("click", () => {
    const hn = input.value.trim();
    if (!hn) {
      alert("กรุณากรอก Hospital Number");
      return;
    }
    const url = `${TIMELINE_API}?no=${encodeURIComponent(hn)}`;
    console.log("CALL TIMELINE =", url);
    loadTimeline(url);
  });

  async function loadTimeline(url) {
    try {
      listCard.innerHTML = "<div class='list-item'>กำลังโหลด...</div>";

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`, // ✅ ส่ง token
        },
        cache: "no-store",
      });

      const text = await res.text();
      console.log("TIMELINE STATUS =", res.status);
      console.log("TIMELINE RAW TEXT =", text);

      let raw = {};
      try { raw = text ? JSON.parse(text) : {}; } catch (_) {}

      if (!res.ok) {
        const detail = raw.detail || raw.message || text || "ไม่พบข้อมูล";
        listCard.innerHTML = `<div class='list-item'>${escapeHtml(
          typeof detail === "string" ? detail : JSON.stringify(detail)
        )}</div>`;
        return;
      }

      const list = raw.result ?? raw.data ?? raw;
      renderList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("ERROR timeline:", err);
      listCard.innerHTML = "<div class='list-item'>เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</div>";
    }
  }

  function formatThaiDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear() + 543;
    return `${day} / ${month} / ${year}`;
  }

  function renderList(list) {
    listCard.innerHTML = "";

    if (!list || list.length === 0) {
      listCard.innerHTML = "<div class='list-item'>ไม่พบข้อมูล</div>";
      return;
    }

    list.forEach((item) => {
      const div = document.createElement("div");
      div.className = "list-item";

      const dateIso = item.predicted_date ?? item.created_at ?? item.date;
      const id = item.predict_id ?? item.id_predict ?? item.id;

      div.textContent = formatThaiDate(dateIso);

      div.addEventListener("click", () => {
        if (!id) {
          alert("ไม่พบรหัสรายการ (id_predict)");
          return;
        }
        window.location.href = `/history2.html?id=${encodeURIComponent(id)}`;
      });

      listCard.appendChild(div);
    });
  }

  // ป้องกันแสดง HTML แปลกๆ ใน error
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
