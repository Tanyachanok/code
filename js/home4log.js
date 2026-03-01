// js/home4log.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");
  const countInput = document.getElementById("count");
  const dropdownList = document.getElementById("custom-dropdown"); // ตรวจสอบ ID ให้ตรงกับ HTML
  const dropdownArrow = document.querySelector(".dropdown-arrow"); // ตัวสามเหลี่ยม
  const sexInputs = document.querySelectorAll('input[name="sex"]');
  const menuBtn = document.querySelector(".menu-btn");

  let patientListData = []; // เก็บข้อมูลคนไข้ทั้งหมดจาก DB

  if (!form) return;

  // token & API Config
  // ------------------------------------
  const ACCESS_TOKEN_KEY = "pe_access_token";
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const API_HOST = "https://webapp-pe.onrender.com";
  const PATIENT_API = `${API_HOST}/patient`;
  const PREDICTION_API = `${API_HOST}/api/predictions`;

  if (!token) {
    alert("ไม่พบ token กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
    window.location.href = "/login.html";
    return;
  }

  // 1) ดึงข้อมูล HN ที่เคยบันทึกไว้ 
  // ------------------------------------
  async function loadOptions() {
    try {
      const res = await fetch(`${API_HOST}/patient/dropdown-options`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        patientListData = await res.json();
        console.log("Data loaded:", patientListData.length);
      }
    } catch (err) { 
      console.error("Load fail:", err); 
    }
  }
  loadOptions();

  // 2) ฟังก์ชันสร้างรายการใน Dropdown 
  // ------------------------------------
  function renderDropdown(filterText = "", showAll = false) {
    if (!dropdownList) return;

    const filtered = showAll 
      ? patientListData 
      : patientListData.filter(p => p.no.toString().includes(filterText));

    if (filtered.length > 0) {
      dropdownList.innerHTML = filtered.map(p =>
        `<div class="dropdown-item" data-no="${p.no}">${p.no}</div>`
      ).join("");
      dropdownList.style.display = "block";
    } else {
      dropdownList.style.display = "none";
    }
  }

  // 3) ฟังก์ชันล็อกเพศอัตโนมัติ
  // ------------------------------------
  function syncGender(hnValue) {
    const val = hnValue.trim();
    const found = patientListData.find(p => String(p.no) === val);

    if (found) {
      const genderDb = found.gender.toLowerCase();
      sexInputs.forEach(radio => {
        if (radio.value.toLowerCase() === genderDb) {
          radio.checked = true;
        }
        radio.disabled = true;
        radio.parentElement.style.opacity = "1.0";
      });
    } else {
      sexInputs.forEach(radio => {
        radio.disabled = false;
        radio.parentElement.style.opacity = "1";
      });
    }
  }

  // 4) Events สำหรับ Dropdown
  // ------------------------------------
  
  dropdownArrow.style.pointerEvents = "auto"; // มั่นใจว่าคลิกได้
  dropdownArrow.addEventListener("click", (e) => {
    e.stopPropagation();
    // ถ้าปิดอยู่ให้เปิด (โชว์ทั้งหมด), ถ้าเปิดอยู่ให้ปิด
    if (dropdownList.style.display === "block") {
      dropdownList.style.display = "none";
    } else {
      renderDropdown("", true); // "" คือไม่มีฟิลเตอร์, true คือโชว์ทั้งหมด
    }
  });

  // กฎข้อที่ 2: กล่องข้อความเป็นแบบพิมพ์เพื่อกรอง
  countInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if (val.trim() === "") {
      dropdownList.style.display = "none";
    } else {
      renderDropdown(val, false); // กรองตามตัวหนังสือที่พิมพ์
    }
    syncGender(val);
  });

  // คลิกเลือกจากรายการ
  dropdownList.addEventListener("click", (e) => {
    if (e.target.classList.contains("dropdown-item")) {
      const selectedNo = e.target.getAttribute("data-no");
      countInput.value = selectedNo;
      dropdownList.style.display = "none";
      syncGender(selectedNo);
    }
  });

  // คลิกที่อื่นให้ปิด
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".input-wrap")) {
      dropdownList.style.display = "none";
    }
  });

  // 5) เมนู hamburger
  // ------------------------------------
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      window.location.href = "/ham-log.html";
    });
  }

  // 6) เมื่อกด submit
  // ------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hn = (countInput.value || "").trim();
    if (!hn) {
      alert("กรุณากรอก Number of Patient");
      countInput.focus();
      return;
    }

    let sex = "Male";
    sexInputs.forEach((el) => {
      if (el.checked) {
        sex = el.value.toLowerCase() === "female" ? "Female" : "Male";
      }
    });

    console.log("HOME4LOG: HN =", hn, "Sex =", sex);

    const payload = {
      no: hn,
      gender: sex,
    };

    let generatedId = localStorage.getItem("pe_patient_id") || null;

    try {
      const response = await fetch(PATIENT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (!response.ok) {
        if (response.status === 409) {
          const oldId = localStorage.getItem("pe_patient_id");
          if (oldId) {
            generatedId = oldId;
          } else {
            alert("เลขผู้ป่วยนี้มีอยู่แล้วในระบบ และไม่พบรหัสภายในเดิม (PNTxxx)");
            return;
          }
        } else {
          let msg = data?.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : "ไม่สามารถบันทึกข้อมูลได้";
          alert(msg);
          return;
        }
      } else {
        generatedId = data?.id_patients || data?.id || data?.patient_id || (data?.patient && (data.patient.id_patients || data.patient.id)) || null;
      }
    } catch (err) {
      console.error("Submit fail:", err);
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      return;
    }

    if (!generatedId) {
      alert("Backend ไม่ได้ส่งรหัสผู้ป่วยภายใน (PNTxxx) กลับมา");
      return;
    }

    // เซฟลง localStorage
    localStorage.setItem("pe_hn", hn);
    localStorage.setItem("pe_patient_id", generatedId);
    localStorage.setItem("pe_gender", sex);
    localStorage.setItem("pe_login_basic", JSON.stringify({ no: hn, patient_id: generatedId, gender: sex }));

    // เช็ก prediction เดิม
    try {
      const url = `${PREDICTION_API}/${encodeURIComponent(hn)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const checkData = await res.json();
        if (checkData.exists) {
          localStorage.setItem("pe_login_result", JSON.stringify(checkData.result || checkData));
          window.location.href = "/confirm.html";
          return;
        }
      }
      window.location.href = "/predic.html?patient_id=" + encodeURIComponent(hn);
    } catch (error) {
      window.location.href = "/predic.html?patient_id=" + encodeURIComponent(hn);
    }
  });
});