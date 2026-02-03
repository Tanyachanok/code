// js/guest-predict.js
document.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // 0) CONFIG BACKEND
  // ==========================
  const BASE_URL = "https://webapp-pe.onrender.com";
  const GUEST_API = `${BASE_URL}/clinical/predict/guest`; // POST /predict/guest

  // ----------------------------
  // SHOW/HIDE CANCER TYPE
  // ----------------------------
  const solidSection = document.getElementById("solid_section");
  const hemaSection = document.getElementById("hema_section");

  const solidSelect = document.getElementById("solid_select");
  const hemaSelect = document.getElementById("hema_select");

  const cancerRadios = document.querySelectorAll('input[name="type_cancer"]');

  cancerRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.value === "solid") {
        solidSection?.classList.remove("hidden");
        hemaSection?.classList.add("hidden");
        if (hemaSelect) hemaSelect.value = "";
      } else {
        hemaSection?.classList.remove("hidden");
        solidSection?.classList.add("hidden");
        if (solidSelect) solidSelect.value = "";
      }
    });
  });

  // ----------------------------
  // VALIDATION + RED BORDER
  // ----------------------------
  function clearErrors() {
    document
      .querySelectorAll(".input-error, .select-error, .radio-error")
      .forEach((el) => el.classList.remove("input-error", "select-error", "radio-error"));
  }

  function validateForm() {
    clearErrors();
    let valid = true;

    // Text input
    const inputs = document.querySelectorAll("input.text-input");
    inputs.forEach((input) => {
      if (input.value.trim() === "") {
        input.classList.add("input-error");
        valid = false;
      }
    });

    // Dropdown (ยกเว้นที่อยู่ใน .hidden)
    const selects = document.querySelectorAll(".dropdown-select");
    selects.forEach((sel) => {
      const hiddenWrap = sel.closest(".hidden");
      if (!hiddenWrap && sel.value === "") {
        sel.classList.add("select-error");
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

      if (!checked && radios.length > 0) {
        const group = radios[0].closest(".toggle-group");
        if (group) group.classList.add("radio-error");
        valid = false;
      }
    });

    return valid;
  }

  // ----------------------------
  // helpers: safe number parse
  // ----------------------------
  const toInt = (id) => {
    const el = document.getElementById(id);
    const raw = el?.value?.trim() ?? "";
    const n = Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };

  const toFloat = (id) => {
    const el = document.getElementById(id);
    const raw = el?.value?.trim() ?? "";
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  };

  const getRadioValue = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  };

  // ----------------------------
  // BUILD PAYLOAD ส่งเข้า backend
  // ----------------------------
  function buildPayload() {
    // 1) numbers
    const age = toInt("age");
    const heart_rate = toInt("heart_rate");
    const systolic = toInt("systolic");
    const diastolic = toInt("diastolic");
    const spo2 = toInt("spo2");
    const fio2 = toInt("fio2");
    const d_dimer = toFloat("d_dimer");

    // 2) radios
    const sexRadio = document.querySelector('input[name="sex"]:checked');
    if (!sexRadio) throw new Error("Missing/invalid fields: gender");

    const gender = sexRadio.value === "male" ? "Male" : "Female";

    const ecogRaw = getRadioValue("ecog");
    const ecog = ecogRaw !== null ? Number(ecogRaw) : null;

    const hemoptysis = getRadioValue("hemoptysis") === "yes";
    const pleuritic_chest = getRadioValue("pcp") === "yes";
    const syncope = getRadioValue("syncope") === "yes";
    const isolated_leg = getRadioValue("edema") === "yes";
    const type_cancer = getRadioValue("type_cancer"); // "solid" / "hematologic"
    const lung_met = getRadioValue("lung_meta") === "yes";

    // 3) type cancer dropdown
    let solid_type = "";
    let hema_type = "";

    if (type_cancer === "solid") {
      solid_type = solidSelect?.value ?? "";
      hema_type = "";
    } else {
      hema_type = hemaSelect?.value ?? "";
      solid_type = "";
    }

    // 4) chest x-ray
    const chest_xray = document.getElementById("chest_xray")?.value ?? "";

    // 5) final guard (กัน null/NaN หลุด)
    const mustHave = {
      gender, age, ecog, heart_rate, systolic, diastolic, spo2, fio2, d_dimer,
      type_cancer, chest_xray,
    };

    const missing = Object.entries(mustHave)
      .filter(([, v]) => v === null || v === "" || Number.isNaN(v))
      .map(([k]) => k);

    if (missing.length > 0) {
      throw new Error("Missing/invalid fields: " + missing.join(", "));
    }

    return {
      gender,
      age,
      ecog,
      heart_rate,
      systolic,
      diastolic,
      spo2,
      fio2,
      hemoptysis,
      pleuritic_chest,
      syncope,
      isolated_leg,
      type_cancer,
      solid_type,
      hema_type,
      lung_met,
      chest_xray,
      d_dimer,
    };
  }

  // ==========================
  // SUBMIT / PREDICT (CALL BACKEND)
  // ==========================
  const formEl = document.querySelector(".form");
  if (formEl) {
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }

      let payload;
      try {
        payload = buildPayload();
      } catch (err) {
        console.error(err);
        alert("มีข้อมูลบางช่องไม่ถูกต้อง (เช่น d-dimer ต้องเป็นตัวเลข)");
        return;
      }

      console.log("guest payload:", payload);
      console.log("GUEST_API:", GUEST_API);

      try {
        const res = await fetch(GUEST_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await res.text(); // อ่านครั้งเดียวพอ
        if (!res.ok) {
          console.error("Backend error:", res.status, text);
          alert("เกิดข้อผิดพลาดในการส่งข้อมูลไปยังเซิร์ฟเวอร์");
          return;
        }

        const data = text ? JSON.parse(text) : {};
        console.log("guest result:", data);

        const resultData = data.result || data;

        localStorage.setItem("pe_guest_form", JSON.stringify(payload));
        localStorage.setItem("pe_guest_result", JSON.stringify(resultData));

        window.location.href = "./next-guest.html";
      } catch (err) {
        console.error("Fetch error:", err);
        alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
      }
    });
  }

  // ==========================
  // RESET BUTTON
  // ==========================
  const resetBtn = document.querySelector(".btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      clearErrors();

      document.querySelectorAll("input.text-input").forEach((input) => (input.value = ""));

      if (solidSelect) solidSelect.value = "";
      if (hemaSelect) hemaSelect.value = "";

      document.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = false));

      const typeSolid = document.getElementById("type_solid");
      if (typeSolid) typeSolid.checked = true;

      solidSection?.classList.remove("hidden");
      hemaSection?.classList.add("hidden");
    });
  }
});
