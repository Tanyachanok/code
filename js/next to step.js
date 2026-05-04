document.addEventListener("DOMContentLoaded", () => {
  const recommendText = document.getElementById("recommend-text");

  const updateRecommendation = (percent) => {
    if (!recommendText) return;

    recommendText.textContent =
      percent > 5
        ? ">5% : ควรพิจารณาส่งตรวจ CTPA เพื่อยืนยันผล"
        : "<5% : แนะนำให้เฝ้าระวังและติดตามอาการอย่างต่อเนื่อง";
  };

  const buttons = document.querySelectorAll(".btn-secondary");
  const homeBtn = buttons[0] || null;
  const nextBtn = buttons[1] || null;
  const menuBtn = document.querySelector(".menu-btn");

  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "/home4log.html";
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      window.location.href = "/confirm.html";
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      window.location.href = "/ham-log.html";
    });
  }

  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  const API_ROOT = "https://webapp-pe.onrender.com";
  const PREDICT_DETAIL_API = `${API_ROOT}/predict`;

  const params = new URLSearchParams(window.location.search);
  const idPredict = params.get("id_predict") || null;

  if (idPredict) {
    fetchPredictDetail(idPredict);
  } else {
    showNoResultMessage();
  }

  if (window.location.search) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

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
        showNoResultMessage();
        return;
      }

      const data = await res.json();
      renderRiskFromData(data.result || data);
    } catch (err) {
      console.error("NEXT-STEP Error:", err);
      showNoResultMessage();
    }
  }

  function renderRiskFromData(data) {
    if (!data || typeof data !== "object") {
      showNoResultMessage();
      return;
    }

    const result = data.result || data;

    const prob =
      result.prob_risk ??
      result.risk_percent ??
      result.risk_probability ??
      null;

    if (prob === null || Number.isNaN(Number(prob))) {
      showNoResultMessage();
      return;
    }

    const probPercent = Math.max(0, Math.min(Number(prob), 100));

    updateCircularProgress(probPercent);
    updateRecommendation(probPercent);
  }

  function updateCircularProgress(percent) {
    const circle = document.getElementById("risk-circle");
    const text = document.getElementById("risk-percent");

    if (!circle || !text) return;

    const circumference = 565;
    const offset = circumference - (percent / 100) * circumference;

    circle.style.strokeDashoffset = offset;
    text.textContent = percent === 0 ? "0" : percent.toFixed(1);
  }

  function showNoResultMessage() {
    updateCircularProgress(0);

    if (recommendText) {
      recommendText.innerHTML = `
        <div style="color: #64748b; padding: 20px;">
          ขออภัย ไม่พบข้อมูลการวิเคราะห์ผลในระบบ<br>
          <span style="font-size: 0.9em;">
            กรุณากลับไปที่หน้าบันทึกข้อมูลเพื่อดำเนินการประเมินใหม่อีกครั้ง
          </span>
        </div>
      `;
    }
  }
});