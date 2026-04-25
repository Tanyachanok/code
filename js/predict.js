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

  // 🌟 อ่านข้อมูลที่หน้า home4log เซฟไว้
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

  // 👇 element สำหรับ Gender แบบใหม่
  const genderDisplay = document.getElementById("gender_display"); // ปุ่มสีน้ำเงิน
  const genderValueInput = document.getElementById("gender_value"); // hidden input

  // ตั้งค่า gender: ดึงจาก pe_gender -> pe_login_basic -> default
  if (genderDisplay && genderValueInput) {
    let g =
      genderFromLocal ||          // ⭐ ดึงจาก localStorage: pe_gender
      loginBasic?.gender ||       // เผื่อเซฟอยู่ใน object
      loginBasic?.sex ||
      genderValueInput.value ||
      "Male";

    // รองรับรูปแบบ M / F จาก backend
    if (g === "M") g = "Male";
    if (g === "F") g = "Female";

    genderDisplay.textContent = g;
    genderValueInput.value = g;
  }

  // root URL (devtunnel)
  const API_ROOT = "https://webapp-pe.onrender.com";

  // สำหรับยิง predict แบบ user
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
      //  ถ้าแนบมาใน URL (?patient_id=...)
      const params = new URLSearchParams(window.location.search);
      const pidFromUrl = params.get("patient_id");

      if (pidFromUrl) {
         // ลบ query ออกจาก URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      console.log("patientId =", pidFromUrl);

      // ถ้ามีใน localStorage (จาก home4log)
      if (loginBasic?.no) {
        patientInput.value = loginBasic.no;
        //checkPredictionStatus(loginBasic.no);
        return;
      }

      if (pidFromUrl) {
        patientInput.value = pidFromUrl;
        //checkPredictionStatus(pidFromUrl);
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

      // hemaSection?.classList.remove("hidden");
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

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = collectFormData();

      // อ่าน mode จากปุ่ม (ตั้งไว้ตอน checkPredictionStatus)
      const mode = predictBtn?.dataset.mode || "predict";

      // 🌟 Number of Patient ที่โชว์ในฟอร์ม (no)
      const no = formData.patient_id || loginBasic?.no || "";

      // 🌟 รหัส PNT ที่ backend generate มา (ใช้ตัวนี้เป็น id_patients)
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
        // ไม่ต้อง validate และไม่ต้อง predict ใหม่
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

      /* ================================
       * เคส 2: ยังไม่มี prediction → ต้อง predict ใหม่ แล้วไปหน้า next-step
       * ================================ */

      // clearErrors();
      // const hasError = validateForm(formData);
      // if (hasError) {
      //   alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      //   return;
      // }

      clearErrors();
      const isValid = validateForm(); // ไม่ต้องส่ง formData เพราะฟังก์ชันคุณดึงจาก DOM โดยตรง
      if (!isValid) { // ถ้า "ไม่" valid
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }

      let risk = null;
      let idPredict = null;

      const toBool = (val) =>
        val === "yes" || val === "true" || val === "1";

      try {
        const payload = {
          gender: formData.sex || "Male",
          age: Number(formData.age) || 0,
          ecog: Number(formData.ecog) || 0,
          heart_rate: Number(formData.heart_rate) || 0,
          systolic: Number(formData.systolic_bp) || 0,
          diastolic: Number(formData.diastolic_bp) || 0,
          spo2: Number(formData.spo2) || 0,
          fio2: Number(formData.fio2) || 0,

          hemoptysis: toBool(formData.hemoptysis),
          pleuritic_chest: toBool(formData.pcp),
          syncope: toBool(formData.syncope),
          isolated_leg: toBool(formData.edema),

          type_cancer: formData.type_cancer || "",
          solid_type: formData.solid_cancer_type || "",
          hema_type: formData.hema_cancer_type || "",

          lung_met: toBool(formData.lung_meta),
          chest_xray: formData.cxr_type || "",

          d_dimer: Number(formData.d_dimer) || 0,

          // ส่ง PNTxxx เป็น id_patients
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

        // ถ้า status ไม่ใช่ 2xx → จบเลย
        if (!response.ok) {
          const text = await response.text();
          console.error("Backend error:", response.status, text);
          alert(
            "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (backend)\nStatus: " + response.status
          );
          return;
        }

        // พยายามอ่าน JSON
        let result = {};
        try {
          result = await response.json();
        } catch (e) {
          console.warn("response ไม่ใช่ JSON หรือ body ว่าง:", e);
          result = {};
        }

        console.log("predict result:", result);

        // ใช้ตัวแปร idPredict ตัวเดียว (ไม่ประกาศ const ซ้ำ)
        idPredict =
          result.result?.id_predict ||   // กรณีเป็น {status, message, result: {id_predict, ...}}
          result.result?.id ||           // เผื่อ backend ใช้ชื่อ id เฉย ๆ
          result.id_predict ||           // กรณีอยู่บน root
          result.id ||                   // กรณีอยู่บน root ชื่อ id
          null;

        console.log("PREDICT: idPredict from backend =", idPredict);

        if (idPredict) {
          localStorage.setItem("pe_predict_id", idPredict);
        } else {
          console.warn("Backend ไม่ได้ส่ง id_predict/id กลับมา");
        }


        // risk (เปอร์เซ็นต์ความเสี่ยง)
        risk =
          result.result?.risk_percent ??
          result.risk_percent ??
          50; // default 50% ถ้าไม่เจออะไรเลย
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
        patient_id: no,      // ส่ง Number of Patient ไปโชว์ใน next-step
        sex: formData.sex,
        risk: roundedRisk,
      });

      // แนบ id_predict ไปด้วย ถ้ามี
      if (idPredict) {
        params.append("id_predict", idPredict);
      }

      // 👉 ไปหน้า next to step (ชื่อไฟล์ต้องตรงกับของจริง)
      window.location.href = "/next to step.html?" + params.toString();
    });
  }

  /* ---------- helper ต่าง ๆ ---------- */

  function collectFormData() {
    const data = {};

    data.patient_id =
      (document.getElementById("patient_id")?.value || "").trim();

    const getRadio = (name) => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : "";
    };

    const getByPlaceholder = (ph) => {
      const el = document.querySelector(`input[placeholder="${ph}"]`);
      return el ? el.value.trim() : "";
    };

    // 👇 ปรับให้อ่านจาก hidden input ของ gender ถ้ามี
    const genderHidden = document.getElementById("gender_value");
    if (genderHidden) {
      data.sex = genderHidden.value.trim();
    } else {
      data.sex = getRadio("sex");
    }

    data.age = getByPlaceholder("Years");
    data.ecog = getRadio("ecog");

    data.heart_rate = getByPlaceholder("bpm");

    const mmHgInputs = Array.from(
      document.querySelectorAll('input[placeholder="mmHg"]')
    );
    data.systolic_bp = mmHgInputs[0] ? mmHgInputs[0].value.trim() : "";
    data.diastolic_bp = mmHgInputs[1] ? mmHgInputs[1].value.trim() : "";

    const p95100 = Array.from(
      document.querySelectorAll('input[placeholder="95–100"]')
    );
    data.spo2 = p95100[0] ? p95100[0].value.trim() : "";
    data.fio2 = p95100[1] ? p95100[1].value.trim() : "";

    data.hemoptysis = getRadio("hemoptysis");
    data.pcp = getRadio("pcp");
    data.syncope = getRadio("syncope");
    data.edema = getRadio("edema");

    data.type_cancer = getRadio("type_cancer");
    data.solid_cancer_type =
      document.getElementById("solid_select")?.value || "";
    data.hema_cancer_type =
      document.getElementById("hema_select")?.value || "";

    data.lung_meta = getRadio("lung_meta");
    data.cxr_type = document.getElementById("cxr_select")?.value || "";

    data.d_dimer = getByPlaceholder("Value");

    return data;
  }

//   function clearErrors() {
//     document
//       .querySelectorAll(".input-error, .select-error, .radio-error")
//       .forEach((el) =>
//         el.classList.remove("input-error", "select-error", "radio-error")
//       );

//     document.querySelectorAll(".error-message").forEach((el) => el.remove());
//   }

//   function validateForm(data) {
//     let hasError = false;

//     const showError = (element, msg, className) => {
//       if (!element) return;
//       hasError = true;
//       if (className) element.classList.add(className);

//       const err = document.createElement("div");
//       err.className = "error-message";
//       err.style.color = "#e63946";
//       err.style.fontSize = "11px";
//       err.style.marginTop = "4px";
//       err.textContent = msg;

//       if (element.parentNode) {
//         element.parentNode.appendChild(err);
//       }
//     };

//     const patientInputEl = document.getElementById("patient_id");
//     if (!data.patient_id) {
//       showError(patientInputEl, "กรุณากรอก Number of Patient", "input-error");
//     }

//     // 👇 ปรับ validate ให้รองรับ gender แบบปุ่มเดียว
//     const sexElement =
//       document.getElementById("gender_display") ||
//       document.querySelector('input[name="sex"]')?.closest(".toggle-group");
//     if (!data.sex && sexElement) {
//       showError(sexElement, "กรุณาเลือกเพศ", "radio-error");
//     }

//     const ageInput = document.querySelector('input[placeholder="Years"]');
//     if (!data.age) {
//       showError(ageInput, "กรุณากรอกอายุ", "input-error");
//     }

//     const ecogGroup = document
//       .querySelector('input[name="ecog"]')
//       ?.closest(".toggle-group");
//     if (!data.ecog) {
//       showError(ecogGroup, "กรุณาเลือก ECOG status", "radio-error");
//     }

//     const hrInput = document.querySelector('input[placeholder="bpm"]');
//     if (!data.heart_rate) {
//       showError(hrInput, "กรุณากรอก Heart Rate", "input-error");
//     }

//     const mmHgInputs = Array.from(
//       document.querySelectorAll('input[placeholder="mmHg"]')
//     );
//     if (!data.systolic_bp && mmHgInputs[0]) {
//       showError(mmHgInputs[0], "กรุณากรอก Systolic BP", "input-error");
//     }
//     if (!data.diastolic_bp && mmHgInputs[1]) {
//       showError(mmHgInputs[1], "กรุณากรอก Diastolic BP", "input-error");
//     }

//     const p95100 = Array.from(
//       document.querySelectorAll('input[placeholder="95–100"]')
//     );
//     if (!data.spo2 && p95100[0]) {
//       showError(p95100[0], "กรุณากรอก SpO₂", "input-error");
//     }
//     if (!data.fio2 && p95100[1]) {
//       showError(p95100[1], "กรุณากรอก FiO₂", "input-error");
//     }

//     const radioCheck = (name, msg) => {
//       const group = document
//         .querySelector(`input[name="${name}"]`)
//         ?.closest(".toggle-group");
//       if (!data[name]) {
//         showError(group, msg, "radio-error");
//       }
//     };

//     radioCheck("hemoptysis", "กรุณาเลือก Hemoptysis");
//     radioCheck("pcp", "กรุณาเลือก Pleuritic chest pain");
//     radioCheck("syncope", "กรุณาเลือก Syncope");
//     radioCheck("edema", "กรุณาเลือก One leg edema");

//     const typeGroup = document
//       .querySelector('input[name="type_cancer"]')
//       ?.closest(".toggle-group");
//     if (!data.type_cancer) {
//       showError(typeGroup, "กรุณาเลือกชนิดมะเร็ง", "radio-error");
//     } else if (data.type_cancer === "solid") {
//       const solidSelect = document.getElementById("solid_select");
//       if (!data.solid_cancer_type) {
//         showError(
//           solidSelect,
//           "กรุณาเลือก Solid cancer type",
//           "select-error"
//         );
//       }
//     } else if (data.type_cancer === "hematologic") {
//       const hemaSelect = document.getElementById("hema_select");
//       if (!data.hema_cancer_type) {
//         showError(
//           hemaSelect,
//           "กรุณาเลือก Hematologic cancer type",
//           "select-error"
//         );
//       }
//     }

//     const lungGroup = document
//       .querySelector('input[name="lung_meta"]')
//       ?.closest(".toggle-group");
//     if (!data.lung_meta) {
//       showError(lungGroup, "กรุณาเลือก Lung metastasis", "radio-error");
//     }

//     const cxrSelect = document.getElementById("cxr_select");
//     if (!data.cxr_type) {
//       showError(cxrSelect, "กรุณาเลือก Chest X-ray type", "select-error");
//     }

//     const ddimerInput = document.querySelector('input[placeholder="Value"]');
//     if (!data.d_dimer) {
//       showError(ddimerInput, "กรุณากรอกค่า D-dimer", "input-error");
//     }

//     return hasError;
//   }
// });


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
      "ecog",
      "hemoptysis",
      "pcp",
      "syncope",
      "edema",
      "type_cancer",
      "lung_meta",
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
    // สำหรับ Text Inputs: หายทันทีที่พิมพ์
    document.querySelectorAll("input.text-input").forEach(input => {
        input.addEventListener("input", function() {
            if (this.value.trim() !== "") {
                this.closest(".form-group").classList.remove("has-error");
            }
        });
    });

    // สำหรับ Dropdowns: หายทันทีที่เลือกค่า
    document.querySelectorAll(".dropdown-select").forEach(select => {
        select.addEventListener("change", function() {
            if (this.value !== "") {
                this.closest(".form-group").classList.remove("has-error");
            }
        });
    });

    // adio Groups: หายทันทีที่คลิกเลือกข้อใดข้อหนึ่ง
    const radioNames = ["sex", "ecog", "hemoptysis", "pcp", "syncope", "edema", "type_cancer", "lung_meta"];
    radioNames.forEach(name => {
        const radios = document.querySelectorAll(`input[name="${name}"]`);
        radios.forEach(radio => {
            radio.addEventListener("change", function() {
                // เมื่อเลือกปุ่มใดปุ่มหนึ่งในกลุ่ม ให้เอา error ของกลุ่มนั้นออก
                this.closest(".form-group").classList.remove("has-error");
            });
        });
    });
});