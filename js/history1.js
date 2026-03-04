function formatThaiDateTime(isoString) {
  if (!isoString) return "-";
  const datePart = isoString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return `${day}-${month}-${year}`;
}

let selectedPredictId = null;

// ฟังก์ชันจัดการตอนกดปุ่ม Confirm (ไม่ให้มันเปลี่ยนหน้า)
function handleConfirm(event, id) {
    event.stopPropagation(); // กันไม่ให้คลิกแล้วไปหน้า history2
    selectedPredictId = id;
    document.getElementById("confirmModal").style.display = "flex";
}

// 2. ฟังก์ชันปิด Popup
function closeConfirmModal() {
    document.getElementById("confirmModal").style.display = "none";
}

// 3. ฟังก์ชันบันทึกลงฐานข้อมูลและโชว์ผลทันที
async function submitConfirmation(status) {
    const token = localStorage.getItem("pe_access_token");
    const CONFIRM_URL = "https://webapp-pe.onrender.com/pe/confirm";

    const isPeBoolean = (status === "PE");

    const payload = {
        id_predict_result: selectedPredictId, 
        pe_result: isPeBoolean 
    };

    console.log("Sending Payload:", payload);

    try {
        const res = await fetch(CONFIRM_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

        // if (res.ok) {
        //     alert("ยืนยันผลสำเร็จ และบันทึกลงคอลัมน์ pe_result แล้ว");
        //     closeConfirmModal();
        //     location.reload(); 
        // } else {
        //     // ถ้ายังไม่ได้ ให้ดูรายละเอียด Error ตรงนี้ใน Console
        //     const errorDetail = await res.json();
        //     console.log("รายละเอียด Error 422:", errorDetail);
        //     alert("บันทึกไม่สำเร็จ: ข้อมูลไม่ตรงตามที่ระบบต้องการ");
        // }
    } catch (err) {
        console.error("Error:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".search-input");
  const btn = document.querySelector(".search-btn");
  const listCard = document.querySelector(".list-card"); // ตรวจสอบว่าใน HTML มีคลาสนี้ไหม
  const monthInput = document.querySelector("#monthInput");
  const tableBody = document.getElementById("tableBody");

  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  const BASE_URL = "https://webapp-pe.onrender.com";
  const RECORD_API = `${BASE_URL}/record`;
  const timelineUrl = `${RECORD_API}/timeline`;
  const searchHnUrl = `${RECORD_API}/search-no`;

  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "/login.html";
    return;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderList(data) {
    tableBody.innerHTML = "";

    if (!data || data.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>ไม่พบข้อมูล</td></tr>";
      return;
    }

    data.forEach(item => {
      const row = document.createElement("tr");
      row.style.cursor = "pointer";

      let resultHTML = "";

      if (item.pe === "PE") {
            
            resultHTML = `<span class="badge status-confirmed-pe">Positive</span>`;
        } else if (item.pe === "No PE") {
            
            resultHTML = `<span class="badge status-confirmed-none">Negative</span>`;
        } else {
            
            resultHTML = `<button class="btn-predict-action" onclick="handleConfirm(event, '${item.id_predict}')">Pending</button>`;
        }

      row.innerHTML = `
        <td>${formatThaiDateTime(item.date)}</td>
        <td>${item.no}</td>
        <td style="text-align:center;">${resultHTML}</td>
    `;

      // คลิกที่แถวเพื่อไปหน้า history2
      row.addEventListener("click", () => {
        const predictId = item.id_predict || item._id;
        window.location.href = `/history2.html?id=${encodeURIComponent(predictId)}`;
      });

      tableBody.appendChild(row);
    });
  }


  async function loadTimeline(url) {
    const titleElement = document.getElementById("timeline-title");
    
    try {
        // 1. จัดการสถานะการโหลดและหัวข้อ (Title)
        tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>กำลังโหลด...</td></tr>";
        if (listCard) listCard.innerHTML = "กำลังโหลด...";

        // เช็คจาก API URL ว่าเป็นเส้นทางหลัก (Timeline) หรือไม่
        const isTimelineApi = url.includes("/timeline");

        if (isTimelineApi) {
            if (titleElement) titleElement.style.display = "block"; // โชว์ "*"
        } else {
            if (titleElement) titleElement.style.display = "none";  // ซ่อน "*" เมื่อค้นหา HN/ปฏิทิน
        }
      
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const text = await res.text();
      let raw = {};
      try { raw = text ? JSON.parse(text) : {}; } catch (_) { }

      if (!res.ok) {
        const detail = raw.detail || "ไม่พบข้อมูล";
        tableBody.innerHTML = `<tr><td colspan='3' style='text-align:center; color:red;'>${escapeHtml(typeof detail === 'string' ? detail : JSON.stringify(detail))}</td></tr>`;
        return;
      }

      const list = raw.result ?? raw.data ?? raw;
      console.log("Data received from Timeline API:", list);
      renderList(Array.isArray(list) ? list : []);
      if (listCard) listCard.innerHTML = ""; // ล้างสถานะเมื่อโหลดเสร็จ
    } catch (err) {
      console.error("ERROR timeline:", err);
      tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>เชื่อมต่อเซิร์ฟเวอร์ผิดพลาด</td></tr>";
    }
  }


  // --- Events ---
  // 1. โหลดข้อมูลเริ่มต้น
  loadTimeline(timelineUrl);

  // 2. ค้นหาแบบ HN
  btn?.addEventListener("click", () => {
    const hn = input.value.trim();
    if (!hn) return alert("กรุณากรอก Hospital Number");
    loadTimeline(`${searchHnUrl}?no=${encodeURIComponent(hn)}`);
  });

  // 3. ตั้งค่า Flatpickr (Popup เลือกเดือน)
  const fp = flatpickr("#monthInput", {
    locale: "th",
    static: true,
    plugins: [
      new monthSelectPlugin({
        shorthand: true,
        dateFormat: "Y-m",
        altInput: true,
        altFormat: "F Y"
      })
    ],
    onChange: function (selectedDates, dateStr) {
      const [year, month] = dateStr.split("-");
      // ใช้ URL ค้นหาตามที่ Backend กำหนด (ตรวจสอบ Path อีกทีว่า /search หรือ /search-period)
      const url = `${RECORD_API}/search?year=${year}&month=${month}`;
      loadTimeline(url);
    }
  });

  // 4. เมื่อคลิกที่รูปภาพ ให้ Popup ปฏิทินเด้งขึ้นมา
  const calendarIcon = document.getElementById("calendarIcon");
  calendarIcon?.addEventListener("click", () => {
    fp.open();
  });

  // 5. ปุ่มเมนู
  document.querySelector(".menu-btn")?.addEventListener("click", () => {
    window.location.href = "/ham-log.html";
  });
});