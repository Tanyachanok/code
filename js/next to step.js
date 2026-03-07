document.addEventListener("DOMContentLoaded", () => {
  const riskValueEl = document.querySelector(".risk-value");
  const recommendTextEl = document.querySelector(".recommend-text");

  // ปุ่มนำทาง
  const buttons = document.querySelectorAll(".btn-secondary");
  const homeBtn = buttons[0] || null;
  const nextBtn = buttons[1] || null;
  const menuBtn = document.querySelector(".menu-btn");

  // ----------------------------
  // 0) ปุ่มนำทาง
  // ----------------------------
  if (homeBtn) homeBtn.addEventListener("click", () => { window.location.href = "/home4log.html"; });
  if (nextBtn) nextBtn.addEventListener("click", () => { window.location.href = "/confirm.html"; });
  if (menuBtn) menuBtn.addEventListener("click", () => { window.location.href = "/ham-log.html"; });

  // ----------------------------
  // 1) CONFIG API + token
  // ----------------------------
  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const API_ROOT = "https://webapp-pe.onrender.com";
  const PREDICT_DETAIL_API = `${API_ROOT}/predict`;

  // ----------------------------
  // 2) หา id_predict
  // ----------------------------
  const params = new URLSearchParams(window.location.search);
  let idPredict = params.get("id_predict") || localStorage.getItem("pe_predict_id") || null;

  if (idPredict) {
    fetchPredictDetail(idPredict);
  } else {
    loadFromLocalFallback();
  }

  // ----------------------------
  // 3) ดึงผลจาก backend
  // ----------------------------
  async function fetchPredictDetail(id) {
    try {
      const url = `${PREDICT_DETAIL_API}/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        loadFromLocalFallback();
        return;
      }

      const data = await res.json();
      const resultData = data.result || data;
      renderRiskFromData(resultData);
    } catch (err) {
      console.error("NEXT-LOGIN Error:", err);
      loadFromLocalFallback();
    }
  }

  // ----------------------------
  // 4) Fallback (กรณีไม่พบข้อมูล) - ใช้คำสุภาพ
  // ----------------------------
  function loadFromLocalFallback() {
    let raw = localStorage.getItem("pe_login_result") || localStorage.getItem("pe_predict_basic");

    if (!raw) {
      if (recommendTextEl) {
        recommendTextEl.innerHTML = `
          <div style="color: #64748b; padding: 20px;">
            ขออภัยครับ ไม่พบข้อมูลการวิเคราะห์ผลในระบบ<br>
            <span style="font-size: 0.9em;">กรุณากลับไปที่หน้าบันทึกข้อมูลเพื่อดำเนินการประเมินใหม่อีกครั้ง</span>
          </div>`;
      }
      return;
    }

    try {
      const data = JSON.parse(raw);
      renderRiskFromData(data);
    } catch (e) {
      if (recommendTextEl) recommendTextEl.textContent = "ขออภัย ระบบไม่สามารถดึงข้อมูลผลการประเมินได้ในขณะนี้";
    }
  }

  // ----------------------------
  // 5) Render (เฉพาะวงกลมเปอร์เซ็นต์)
  // ----------------------------
  function renderRiskFromData(data) {
    if (!data || typeof data !== "object") return;

    let prob = data.prob_risk ?? data.risk_percent ?? data.risk_probability ?? 0;
    let probPercent = Math.max(0, Math.min(Number(prob) || 0, 100));

    // แสดงผลเฉพาะวงกลมและตัวเลข
    updateCircularProgress(probPercent);

    // เซฟไว้เผื่อหน้าอื่นต้องใช้ข้อมูลเต็ม
    localStorage.setItem("pe_login_result", JSON.stringify(data));
  }

  function updateCircularProgress(percent) {
    const circle = document.getElementById('risk-circle');
    const text = document.getElementById('risk-percent');

    if (!circle || !text) return;

    const circumference = 565; 
    const offset = circumference - (percent / 100) * circumference;

    circle.style.strokeDashoffset = offset;

    text.textContent = percent;
  }
});