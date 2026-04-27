document.addEventListener("DOMContentLoaded", () => {
  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!token) {
    alert("ไม่พบ token กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
    window.location.href = "/login.html";
    return;
  }

  const API_ROOT = "https://webapp-pe.onrender.com";
  const PREDICT_API = `${API_ROOT}/clinical/predict/user`;

  const LOGIN_BASIC_KEY = "pe_login_basic";
  const loginBasic = JSON.parse(localStorage.getItem(LOGIN_BASIC_KEY) || "{}");

  const genderDisplay = document.getElementById("gender_display");
  const genderValueInput = document.getElementById("gender_value");

  if (genderDisplay && genderValueInput) {
    let g =
      localStorage.getItem("pe_gender") ||
      loginBasic?.gender ||
      loginBasic?.sex ||
      "Male";

    if (g === "M") g = "Male";
    if (g === "F") g = "Female";

    genderDisplay.textContent = g;
    genderValueInput.value = g;
  }

  const menuBtn = document.querySelector(".menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      window.location.href = "/ham-log.html";
    });
  }

  const patientInput = document.getElementById("patient_id");
  if (patientInput && loginBasic?.no) {
    patientInput.value = loginBasic.no;
  }

  const form = document.querySelector(".form");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      clearErrors();

      if (!validateForm()) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }

      const formData = collectFormData();

      const no = formData.patient_id || loginBasic?.no || "";
      const patientInternalId = loginBasic?.patient_id || null;

      if (!patientInternalId) {
        alert(
          "ระบบไม่พบรหัสผู้ป่วยภายใน (PNTxxx)\n" +
          "กรุณากลับไปหน้ากรอก Number of Patient แล้วบันทึกผู้ป่วยใหม่อีกครั้ง"
        );
        return;
      }

      const toBool = (val) => val === "yes" || val === "true" || val === "1";

      try {
        const payload = {
          gender: formData.sex || "Male",
          pulse_rate: Number(formData.heart_rate) || 0,
          systolic_bp: Number(formData.systolic_bp) || 0,
          diastolic_bp: Number(formData.diastolic_bp) || 0,
          hemoglobin: Number(formData.hemoglobin) || 0,
          o2sat: Number(formData.spo2) || 0,
          hemoptysis: toBool(formData.hemoptysis),
          acute_dyspnea: toBool(formData.acute_dyspnea),
          one_leg_edema: toBool(formData.edema),
          d_dimer: Number(formData.d_dimer) || 0,
          id_patients: String(patientInternalId),
        };

        console.log("predict payload:", payload);

        const response = await fetch(PREDICT_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("Backend error:", response.status, text);
          alert("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (backend)\nStatus: " + response.status);
          return;
        }

        const result = await response.json();
        console.log("predict result:", result);

        const resultObj = result.result || result;

        const idPredict =
          resultObj.id_predict ||
          resultObj.id ||
          result.id_predict ||
          result.id ||
          null;

        console.log("PREDICT: idPredict from backend =", idPredict);

        let risk =
          resultObj.prob_risk ??
          resultObj.risk_percent ??
          resultObj.risk_probability ??
          null;

        if ((risk === null || Number.isNaN(Number(risk))) && idPredict) {
          console.log("risk not found from POST → fetching by idPredict...");
          risk = await fetchRiskByPredictId(idPredict);
        }

        if (risk === null || Number.isNaN(Number(risk))) {
          alert("Backend ไม่ได้ส่งค่าความเสี่ยงกลับมา");
          return;
        }

        const roundedRisk = Math.round(Number(risk));

        localStorage.setItem(
          "pe_predict_basic",
          JSON.stringify({
            no: no,
            patient_id: patientInternalId,
            sex: formData.sex,
          })
        );

        const params = new URLSearchParams({
          patient_id: no,
          sex: formData.sex || "",
          risk: roundedRisk,
        });

        if (idPredict) {
          params.append("id_predict", idPredict);
        }

        window.location.href = "/next to step.html?" + params.toString();
      } catch (err) {
        console.error("Fetch error:", err);
        alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      }
    });
  }

  async function fetchRiskByPredictId(idPredict) {
    const res = await fetch(`${API_ROOT}/predict/${encodeURIComponent(idPredict)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("fetch risk failed:", res.status);
      return null;
    }

    const data = await res.json();
    const result = data.result || data;

    return (
      result.prob_risk ??
      result.risk_percent ??
      result.risk_probability ??
      null
    );
  }

  function collectFormData() {
    const data = {};

    data.patient_id = document.getElementById("patient_id")?.value.trim() || "";

    const inputs = document.querySelectorAll("input.text-input");

    data.heart_rate = inputs[0]?.value.trim() || "";
    data.systolic_bp = inputs[1]?.value.trim() || "";
    data.diastolic_bp = inputs[2]?.value.trim() || "";
    data.hemoglobin = inputs[3]?.value.trim() || "";
    data.spo2 = inputs[4]?.value.trim() || "";
    data.d_dimer = inputs[5]?.value.trim() || "";

    const getRadio = (name) => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : "";
    };

    const genderHidden = document.getElementById("gender_value");
    data.sex = genderHidden ? genderHidden.value.trim() : "Male";

    data.hemoptysis = getRadio("hemoptysis");
    data.acute_dyspnea = getRadio("pcp");
    data.edema = getRadio("edema");

    return data;
  }

  function clearErrors() {
    document.querySelectorAll(".form-group").forEach((group) => {
      group.classList.remove("has-error");
    });
  }

  function validateForm() {
    clearErrors();
    let valid = true;

    const inputs = document.querySelectorAll("input.text-input");
    inputs.forEach((input) => {
      if (input.value.trim() === "") {
        input.closest(".form-group")?.classList.add("has-error");
        valid = false;
      }
    });

    const radioGroups = ["hemoptysis", "pcp", "edema"];

    radioGroups.forEach((name) => {
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      const checked = document.querySelector(`input[name="${name}"]:checked`);

      if (!checked && radios.length > 0) {
        radios[0].closest(".form-group")?.classList.add("has-error");
        valid = false;
      }
    });

    return valid;
  }

  document.querySelectorAll("input.text-input").forEach((input) => {
    input.addEventListener("input", function () {
      if (this.value.trim() !== "") {
        this.closest(".form-group")?.classList.remove("has-error");
      }
    });
  });

  ["hemoptysis", "pcp", "edema"].forEach((name) => {
    document.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
      radio.addEventListener("change", function () {
        this.closest(".form-group")?.classList.remove("has-error");
      });
    });
  });
});