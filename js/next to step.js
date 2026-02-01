// js/next-login.js
document.addEventListener("DOMContentLoaded", () => {
  const riskValueEl = document.querySelector(".risk-value");
  const riskGroupEl = document.querySelector(".risk-group");
  const riskThumbEl = document.querySelector(".risk-thumb");
  const recommendTextEl = document.querySelector(".recommend-text");

  // ปุ่มต่าง ๆ
  const buttons = document.querySelectorAll(".btn-secondary");
  const homeBtn = buttons[0] || null; // ปุ่ม Home (ตัวแรก)
  const nextBtn = buttons[1] || null; // ปุ่ม Next (ตัวที่สอง)
  const menuBtn = document.querySelector(".menu-btn");

  // ----------------------------
  // 0) ปุ่มนำทาง
  // ----------------------------
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "home4log.html";
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      // หน้าถัดไป (Confirm PE)
      window.location.href = "confirm.html";
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      window.location.href = "ham-log.html";
    });
  }

  // ----------------------------
  // 1) CONFIG API + token
  // ----------------------------
  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  const API_ROOT = "https://xgfbbwk2-8000.asse.devtunnels.ms";
  const PREDICT_DETAIL_API = `${API_ROOT}/predict`; // ใช้ GET /predict/{id_predict}

  // ----------------------------
  // 2) หา id_predict จาก URL หรือ localStorage
  // ----------------------------
  const params = new URLSearchParams(window.location.search);

  console.log("NEXT-LOGIN: location.search =", window.location.search);
  console.log(
    "NEXT-LOGIN: pe_predict_id in localStorage =",
    localStorage.getItem("pe_predict_id")
  );

  let idPredict =
    params.get("id_predict") || localStorage.getItem("pe_predict_id") || null;

  console.log("NEXT-LOGIN: idPredict =", idPredict);

  if (idPredict) {
    // ถ้ามี id_predict → ดึงจาก backend ก่อน
    fetchPredictDetail(idPredict);
  } else {
    console.warn("NEXT-LOGIN: ไม่มี id_predict ใช้ fallback localStorage");
    loadFromLocalFallback();
  }

  // ----------------------------
  // 3) ดึงผลจาก backend /predict/{id_predict}
  // ----------------------------
  async function fetchPredictDetail(id) {
    try {
      const url = `${PREDICT_DETAIL_API}/${encodeURIComponent(id)}`;
      console.log("NEXT-LOGIN: call GET", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        console.warn(
          "NEXT-LOGIN: โหลดผลทำนายจาก backend ไม่สำเร็จ status =",
          res.status
        );
        // ถ้า backend ล้มเหลว → ลอง fallback localStorage
        loadFromLocalFallback();
        return;
      }

      const data = await res.json();
      console.log("NEXT-LOGIN: detail from backend =", data);

      const resultData = data.result || data;
      renderRiskFromData(resultData);
    } catch (err) {
      console.error("NEXT-LOGIN: เรียก /predict/{id_predict} ล้มเหลว:", err);
      loadFromLocalFallback();
    }
  }

  // ----------------------------
  // 4) fallback: ใช้ผลเดิมจาก localStorage
  //    รองรับทั้ง pe_login_result และ pe_predict_basic
  // ----------------------------
  function loadFromLocalFallback() {
    let raw =
      localStorage.getItem("pe_login_result") ||
      localStorage.getItem("pe_predict_basic");

    if (!raw) {
      console.warn("NEXT-LOGIN: ไม่พบผลทำนายใน localStorage");
      if (riskValueEl) riskValueEl.textContent = "-";
      if (riskGroupEl)
        riskGroupEl.textContent = "ไม่พบข้อมูลผลการทำนาย";
      if (recommendTextEl)
        recommendTextEl.textContent =
          "กรุณากลับไปกรอกข้อมูลใหม่อีกครั้ง";
      return;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("NEXT-LOGIN: อ่านผลจาก localStorage ไม่ได้:", e);
      if (riskValueEl) riskValueEl.textContent = "-";
      if (riskGroupEl)
        riskGroupEl.textContent = "ไม่สามารถแสดงผลการทำนายได้";
      if (recommendTextEl)
        recommendTextEl.textContent =
          "กรุณากลับไปกรอกข้อมูลใหม่อีกครั้ง";
      return;
    }

    renderRiskFromData(data);
  }

  // ----------------------------
  // 5) ฟังก์ชัน render ค่าความเสี่ยง + group + recommendation
  // ----------------------------
  function renderRiskFromData(data) {
    if (!data || typeof data !== "object") {
      console.warn("NEXT-LOGIN: data ไม่ถูกต้อง:", data);
      if (riskValueEl) riskValueEl.textContent = "-";
      if (riskGroupEl)
        riskGroupEl.textContent = "ไม่สามารถแสดงผลการทำนายได้";
      return;
    }

    // --- 5.1 คำนวณเปอร์เซ็นต์ความเสี่ยง (ใช้ข้อมูลจาก backend/local โดยตรง) ---
    let prob =
      data.risk_percent ??
      data.risk_probability ??
      data.probability ??
      data.prob ??
      data.prob_risk ??
      data.risk ??
      0;

    // ถ้า backend ให้เป็น 0–1 → คูณ 100
    if (prob <= 1) {
      prob = prob * 100;
    }

    let probPercent = Number(prob);
    if (Number.isNaN(probPercent)) probPercent = 0;

    // จำกัดในช่วง 0–100
    probPercent = Math.max(0, Math.min(probPercent, 100));

    if (riskValueEl) {
      riskValueEl.textContent = `${probPercent.toFixed(0)}%`;
    }

    // --- 5.2 ข้อความกลุ่มความเสี่ยง ---
    let groupText =
      data.risk_category ||
      data.risk_group ||
      data.risk_name ||
      "";

    if (!groupText) {
      if (probPercent < 15) {
        groupText = "กลุ่มความเสี่ยงต่ำ";
      } else if (probPercent < 50) {
        groupText = "กลุ่มความเสี่ยงปานกลาง";
      } else {
        groupText = "กลุ่มความเสี่ยงสูง";
      }
    }

    if (riskGroupEl) {
      riskGroupEl.textContent = groupText;
    }

    // --- 5.3 ข้อความคำแนะนำ ---
    let recommendText =
      data.recommendation ||
      data.recommend ||
      data.suggestion ||
      "";

    if (!recommendText) {
      if (probPercent < 15) {
        recommendText =
          "พิจารณาติดตามอาการและประเมินซ้ำเมื่อมีอาการเปลี่ยนแปลง";
      } else if (probPercent < 50) {
        recommendText =
          "ควรพิจารณาส่งตรวจ CT Pulmonary Angiogram ตามดุลยพินิจของแพทย์";
      } else {
        recommendText =
          "ควรส่งตรวจ CT Pulmonary Angiogram และประเมินแนวทางการรักษาอย่างเร่งด่วน";
      }
    }

    if (recommendTextEl) {
      recommendTextEl.textContent = recommendText;
    }

    // --- 5.4 ขยับตัวชี้บน bar ---
    if (riskThumbEl) {
      const thumbPos = 5 + (probPercent / 100) * 90;
      riskThumbEl.style.left = `${thumbPos}%`;
    }

    // --- 5.5 เก็บค่าที่ใช้แสดงไว้ใน localStorage เผื่อหน้า confirm ใช้ต่อ ---
    try {
      const saveObj = {
        id_predict: idPredict,
        risk_percent: probPercent,
        risk_category: groupText,
        recommendation: recommendText,
      };
      localStorage.setItem("pe_login_result", JSON.stringify(saveObj));
    } catch (e) {
      console.error("NEXT-LOGIN: เซฟ pe_login_result ไม่ได้:", e);
    }
  }
});
