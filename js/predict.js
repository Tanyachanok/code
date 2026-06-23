// js/predict-pe.js
document.addEventListener("DOMContentLoaded", () => {
  /* -----------------------------------------
   * 0) ตรวจ token + อ่านข้อมูลจาก localStorage
   * ----------------------------------------- */
  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!token) {
    alert("ไม่พบ token กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
    window.location.href = "/login.html";
    return;
  }

  const LOGIN_BASIC_KEY = "pe_login_basic";
  let loginBasic = null;
  try {
    const saved = localStorage.getItem(LOGIN_BASIC_KEY);
    if (saved) {
      loginBasic = JSON.parse(saved);
      console.log("pe_login_basic:", loginBasic);
    }
  } catch (e) {
    console.error("อ่าน pe_login_basic จาก localStorage ไม่ได้:", e);
  }

  const GENDER_KEY = "pe_gender";
  let genderFromLocal = null;
  try {
    genderFromLocal = localStorage.getItem(GENDER_KEY);
    console.log("pe_gender:", genderFromLocal);
  } catch (e) {
    console.error("อ่าน pe_gender จาก localStorage ไม่ได้:", e);
  }

  const genderDisplay = document.getElementById("gender_display"); 
  const genderValueInput = document.getElementById("gender_value"); 

  if (genderDisplay && genderValueInput) {
    let g =
      genderFromLocal ||        
      loginBasic?.gender ||      
      loginBasic?.sex ||
      genderValueInput.value ||
      "Male";

    if (g === "M") g = "Male";
    if (g === "F") g = "Female";

    genderDisplay.textContent = g;
    genderValueInput.value = g;
  }

  const API_ROOT = "https://webapp-pe.onrender.com";

  const PREDICT_API = `${API_ROOT}/clinical/predict/user`;
  const CURRENT_PATIENT_API = `${API_ROOT}/api/current-patient-id`;
  const PREDICTION_STATUS_API = `${API_ROOT}/api/prediction-status`;

  /* -----------------------------------------
   * 0) เมนู Hamburger
   * ----------------------------------------- */
  const menuBtn = document.querySelector(".menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      window.location.href = "/ham-log.html";
    });
  }

  /* -----------------------------------------
   * 0.1) ดึง Number of Patient (no) มาแสดงในฟอร์ม
   * ----------------------------------------- */
  const patientInput = document.getElementById("patient_id");
  const predictBtn = document.getElementById("predict-btn");

  async function loadPatientIdFromBackend() {
    if (!patientInput) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const pidFromUrl = params.get("patient_id");

      if (pidFromUrl) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      console.log("patientId =", pidFromUrl);

      if (loginBasic?.no) {
        patientInput.value = loginBasic.no;
        return;
      }

      if (pidFromUrl) {
        patientInput.value = pidFromUrl;
        return;
      }

      //  ดึงจาก backend ถ้ามี endpoint นี้
      const res = await fetch(CURRENT_PATIENT_API, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.warn("โหลด patient_id ไม่สำเร็จ:", res.status);
        return;
      }

      const data = await res.json();
      
      console.log("current-patient-id:", data);

      if (data && data.patient_id) {
        patientInput.value = data.patient_id;
        checkPredictionStatus(data.patient_id);
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดขณะโหลด patient_id:", err);
    }
  }

  loadPatientIdFromBackend();

  /* -----------------------------------------
   * 0.2) เช็คว่ามี prediction เดิมไหม
   * ----------------------------------------- */
  async function checkPredictionStatus(patientId) {
    if (!predictBtn || !patientId) return;

    try {
      const url = `${PREDICTION_STATUS_API}?patient_id=${encodeURIComponent(
        patientId
      )}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.warn("เช็ค prediction status ไม่สำเร็จ:", res.status);
        return;
      }

      const data = await res.json();
      console.log("prediction-status:", data);

      if (data && data.has_prediction) {
        predictBtn.textContent = "Next";
        predictBtn.dataset.mode = "next";
      } else {
        predictBtn.textContent = "Predict";
        predictBtn.dataset.mode = "predict";
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดขณะเช็ค prediction status:", err);
    }
  }

  /* -----------------------------------------
   * 1) Toggle: Solid vs Hematologic
   * ----------------------------------------- */
  const solidSection = document.getElementById("solid_section");
  const hemaSection = document.getElementById("hema_section");
  const typeSolid = document.getElementById("type_solid");
  const typeHema = document.getElementById("type_hema");

  function updateCancerTypeSection() {
    if (typeSolid && typeSolid.checked) {
      solidSection?.classList.remove("hidden");
      hemaSection?.classList.add("hidden");
    } else if (typeHema && typeHema.checked) {

      hemaSection?.classList.remove("hidden");
      solidSection?.classList.add("hidden");
    }
  }

  if (typeSolid && typeHema) {
    typeSolid.addEventListener("change", updateCancerTypeSection);
    typeHema.addEventListener("change", updateCancerTypeSection);
    updateCancerTypeSection();
  }

  /* -----------------------------------------
   * 2) Handle Predict (submit form)
   * ----------------------------------------- */
  const form = document.querySelector(".form");

  function checkRange(value, min, max, fieldName, inputId) {
    if (value === "" || value === null) return true;
  
    const num = Number(value);
  
    if (num < min || num > max) {
      alert(`${fieldName} ข้อมูลไม่ถูกต้อง กรุณาทำการกรอกข้อมูลใหม่อีกครั้ง`);
  
      document.getElementById(inputId)
        ?.closest(".form-group")
        .classList.add("has-error");
  
      return false;
    }
    return true;
  }
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = collectFormData();

      clearErrors();
      const isValid = validateForm(); 
      if (!isValid) { 
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }

      if (
        !checkRange(formData.heart_rate,44,212,"Pulse Rate", "heart_rate") ||
        !checkRange(formData.systolic_bp,40,210,"Systolic BP", "systolic") ||
        !checkRange(formData.diastolic_bp,30,146,"Diastolic BP", "diastolic") ||
        !checkRange(formData.spo2, 50, 100, "Oxygen Saturation", "spo2") ||
        !checkRange(formData.d_dimer, 169, 67421, "D-dimer", "d_dimer") ||
        !checkRange(formData.hemoglobin, 4, 21, "Hemoglobin", "hemoglobin")
      ) {
        return; // 
      }

      const mode = predictBtn?.dataset.mode || "predict";

      const no = formData.patient_id || loginBasic?.no || "";

      const patientInternalId = loginBasic?.patient_id || null;

      console.log("mode:", mode);
      console.log("HN (no):", no);
      console.log("PNT (patientInternalId):", patientInternalId);

      if (!patientInternalId) {
        alert(
          "ระบบไม่พบรหัสผู้ป่วยภายใน (PNTxxx)\n" +
            "กรุณากลับไปหน้ากรอก Number of Patient แล้วบันทึกผู้ป่วยใหม่อีกครั้ง"
        );
        return;
      }

      /* ================================
       * เคส 1: มี prediction อยู่แล้ว → ไปหน้า confirm เลย
       * ================================ */
      if (mode === "next") {
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
        });

        window.location.href = "/confirm.html?" + params.toString();
        return;
      }
      
      let risk = null;
      let idPredict = null;

      const toBool = (val) =>
        val === "yes" || val === "true" || val === "1";

        const stageRaw = document.querySelector('input[name="stage"]:checked')?.value || "";
        const type_cancer = document.querySelector('input[name="type_cancer"]:checked')?.value || "";
        const solid_type = document.getElementById("solid_select")?.value || "";
        const hema_type = document.getElementById("hema_select")?.value || "";
      

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

          cancer_stage: Number(stageRaw),
          cate_cancer: type_cancer,
          subtype_cancer: type_cancer === "solid" ? solid_type : hema_type,
        
          id_patients: String(patientInternalId),
        };

        console.log("predict payload:", payload);
        console.log("CALL PREDICT_API =", PREDICT_API);

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
          alert(
            "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (backend)\nStatus: " + response.status
          );
          return;
        }

        let result = {};
        try {
          result = await response.json();
        } catch (e) {
          console.warn("response ไม่ใช่ JSON หรือ body ว่าง:", e);
          result = {};
        }
        const resultObj = result.result || result;

        idPredict =
          resultObj.id_predict ||
          resultObj.id ||
          result.id_predict ||
          result.id ||
          null;

        console.log("PREDICT: idPredict from backend =", idPredict);
          // risk (เปอร์เซ็นต์ความเสี่ยง)
        risk =
          resultObj.prob_risk ??
          resultObj.risk_percent ??
          resultObj.risk_probability ??
          null;

if (risk === null || Number.isNaN(Number(risk))) {
alert("Backend ไม่ได้ส่งค่าความเสี่ยงกลับมา");
return;
}
      } catch (err) {
        console.error("Fetch error:", err);
        alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        return;
      }

      const roundedRisk = Math.round(Number(risk));

      // 🌟 เก็บข้อมูลไว้เผื่อใช้หน้า next-step / confirm
      localStorage.setItem(
        "pe_predict_basic",
        JSON.stringify({
          no: no,
          patient_id: patientInternalId,
          sex: formData.sex,
          risk: roundedRisk,
        })
      );

      const params = new URLSearchParams({
        patient_id: no,      
        sex: formData.sex,
        risk: roundedRisk,
      });

      if (idPredict) {
        params.append("id_predict", idPredict);
      }

      window.location.href = "/next to step.html?" + params.toString();
    });
  }

  /* ---------- helper ต่าง ๆ ---------- */

  function collectFormData() {
    const data = {};
  
    data.patient_id = document.getElementById("patient_id")?.value.trim() || "";
  
    const inputs = document.querySelectorAll("input.text-input");
  
    data.heart_rate   = inputs[0]?.value.trim() || "";
    data.systolic_bp  = inputs[1]?.value.trim() || "";
    data.diastolic_bp = inputs[2]?.value.trim() || "";
    data.hemoglobin   = inputs[3]?.value.trim() || "";
    data.spo2         = inputs[4]?.value.trim() || "";
    data.d_dimer      = inputs[5]?.value.trim() || "";
    data.cancer_stage = inputs[6]?.value.trim() || "";
    data.cate_cancer  = inputs[7]?.value.trim() || "";
    data.subtype_cancer = inputs[8]?.value.trim() || "";
  
    const getRadio = (name) => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : "";
    };
  
    const genderHidden = document.getElementById("gender_value");
    data.sex = genderHidden ? genderHidden.value.trim() : "";
  
    data.hemoptysis = getRadio("hemoptysis");
  
    data.acute_dyspnea = getRadio("pcp");
  
    data.edema = getRadio("edema");
  
    return data;
  }

// ----------------------------
  // VALIDATION + RED *
  // ----------------------------
  function clearErrors() {
    document
      .querySelectorAll(".form-group")
      .forEach((group) => {group.classList.remove("has-error");
      });
    }
        

  function validateForm() {
    clearErrors();
    let valid = true;

    // Text input
    const inputs = document.querySelectorAll("input.text-input");
    inputs.forEach((input) => {
      if (input.value.trim() === "") {
        input.closest(".form-group").classList.add("has-error");
        valid = false;
      }
    });

    // Dropdown (ยกเว้นที่อยู่ใน .hidden)
    const selects = document.querySelectorAll(".dropdown-select");
    selects.forEach((sel) => {
      const hiddenWrap = sel.closest(".hidden");
      if (!hiddenWrap && sel.value === "") {
        sel.closest(".form-group").classList.add("has-error");
        valid = false;
      }
    });

    // Radio groups
    const radioGroups = [
      "sex",
      "hemoptysis",
      "pcp",
      "edema",
      "stage",
      "type_cancer",
    ];

    radioGroups.forEach((name) => {
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      const checked = document.querySelector(`input[name="${name}"]:checked`);

      const isHidden = radios.length > 0 && radios[0].closest(".hidden");

      if (!isHidden && !checked && radios.length > 0) {
      radios[0].closest(".form-group").classList.add("has-error");
      valid = false;
      }
    });

    return valid;
  }
  });

  document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll("input.text-input").forEach(input => {
        input.addEventListener("input", function() {
            if (this.value.trim() !== "") {
                this.closest(".form-group").classList.remove("has-error");
            }
        });
    });

    document.querySelectorAll(".dropdown-select").forEach(select => {
        select.addEventListener("change", function() {
            if (this.value !== "") {
                this.closest(".form-group").classList.remove("has-error");
            }
        });
    });

    const radioNames = ["sex", "ecog", "hemoptysis", "pcp", "syncope", "edema", "type_cancer", "lung_meta"];
    radioNames.forEach(name => {
        const radios = document.querySelectorAll(`input[name="${name}"]`);
        radios.forEach(radio => {
            radio.addEventListener("change", function() {
                this.closest(".form-group").classList.remove("has-error");
            });
        });
    });
});