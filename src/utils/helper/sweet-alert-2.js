import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

function ensureToastOnTop() {
  try {
    const container = Swal.getContainer?.();
    if (container && container.style) {
      container.style.zIndex = '10000';
    }
  } catch (e) {
    // ignore
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function boxConfirm(params = {}) {
  const {
    title = 'คุณแน่ใจที่จะลบข้อมูล ?',
    text = 'ข้อมูลที่ลบจะไม่สามารถกู้คืนได้อีก',
    icon = 'warning',
    confirmButtonText = 'ใช่, ลบข้อมูล',
    cancelButtonText = 'ยกเลิก',
  } = params || {};

  // กำหนดสี icon ตาม type
  const iconColorMap = {
    warning: { bg: '#fff3e0', border: '#ff9800', color: '#e65100', emoji: '⚠️' },
    error: { bg: '#ffebee', border: '#f44336', color: '#c62828', emoji: '❌' },
    info: { bg: '#e3f2fd', border: '#2196f3', color: '#1565c0', emoji: 'ℹ️' },
    success: { bg: '#e8f5e9', border: '#4caf50', color: '#2e7d32', emoji: '✅' },
    question: { bg: '#f3e5f5', border: '#9c27b0', color: '#6a1b9a', emoji: '❓' },
  };
  const theme = iconColorMap[icon] || iconColorMap.warning;

  return new Promise((resolve) => {
    Swal.fire({
      icon: icon,
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      reverseButtons: true,
      width: 480,
      customClass: {
        confirmButton: 'bg-main',
        popup: 'swal2-popup-custom',
      },
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <h2 style="
            margin: 0 0 16px 0;
            font-size: 1.4em;
            font-weight: 600;
            color: #333;
            text-align: center;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 12px;
          ">${title}</h2>
          <div style="
            background: linear-gradient(135deg, ${theme.bg} 0%, ${theme.bg}dd 100%);
            border-left: 4px solid ${theme.border};
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 8px;
          ">
            <div style="
              font-size: 0.95em;
              color: ${theme.color};
              font-weight: 400;
              line-height: 1.6;
              word-break: break-word;
            ">${theme.emoji} ${text}</div>
          </div>
        </div>`,
    }).then((result) => {
      resolve(result.isConfirmed);
    });
  });
}

function boxConfirmSelect(params = {}) {
  const {
    title = 'คุณแน่ใจ?',
    text = 'เลือกเหตุผลเพื่อยืนยัน',
    icon = 'warning',
    confirmButtonText = 'ยืนยัน',
    cancelButtonText = 'ยกเลิก',
    options = [],
  } = params;

  const safeOptions = Array.isArray(options) ? options : [];
  const iconColorMap = {
    warning: { bg: '#fff3e0', border: '#ff9800', color: '#e65100', emoji: '⚠️' },
    error: { bg: '#ffebee', border: '#f44336', color: '#c62828', emoji: '❌' },
    info: { bg: '#e3f2fd', border: '#2196f3', color: '#1565c0', emoji: 'ℹ️' },
    success: { bg: '#e8f5e9', border: '#4caf50', color: '#2e7d32', emoji: '✅' },
    question: { bg: '#f3e5f5', border: '#9c27b0', color: '#6a1b9a', emoji: '❓' },
  };
  const selectableOptions = safeOptions.filter((item) => item && item.id !== undefined && item.name);
  const theme = iconColorMap[icon] || iconColorMap.warning;
  const selectOptionsHtml = selectableOptions
    .map(
      (item) => `
        <button type="button" data-swal-select-option="true" data-value="${escapeHtml(item.id)}" style="
          width: 100%;
          border: none;
          border-radius: 8px;
          padding: 10px 12px;
          background: transparent;
          color: #1f2937;
          font-size: 0.94em;
          font-weight: 400;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
        ">${escapeHtml(item.name)}</button>`,
    )
    .join('');

  return new Promise((resolve) => {
    let cleanupSelectEvents = () => {};

    Swal.fire({
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
      width: 520,
      customClass: {
        confirmButton: 'bg-main',
        popup: 'swal2-popup-custom',
      },
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <h2 style="
            margin: 0 0 16px 0;
            font-size: 1.4em;
            font-weight: 600;
            color: #333;
            text-align: center;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 12px;
          ">${escapeHtml(title)}</h2>
          <div style="
            background: linear-gradient(135deg, ${theme.bg} 0%, ${theme.bg}dd 100%);
            border-left: 4px solid ${theme.border};
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 14px;
          ">
            <div style="
              font-size: 0.95em;
              color: ${theme.color};
              font-weight: 400;
              line-height: 1.6;
              word-break: break-word;
            ">${theme.emoji} ${escapeHtml(text)}</div>
          </div>
          <div style="margin-bottom: 8px;">
            <label for="swal-select-trigger" style="
              display: block;
              font-size: 0.9em;
              font-weight: 600;
              color: #424242;
              margin-bottom: 6px;
            ">เหตุผลการยกเลิก <span style="color: #f44336; font-size: 1.1em;">*</span></label>
            <div id="swal-select-wrapper" style="position: relative;">
              <input id="swal-select-reason" type="hidden" value="" />
              <button id="swal-select-trigger" type="button" style="
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                box-sizing: border-box;
                border: 2px solid #d0d7de;
                border-radius: 10px;
                padding: 11px 12px;
                font-size: 0.95em;
                color: #1f2937;
                background: #ffffff;
                outline: none;
                cursor: pointer;
                transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.16s ease;
              ">
                <span id="swal-select-placeholder" style="
                  color: #6b7280;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">กรุณาเลือกเหตุผลการยกเลิก</span>
                <span id="swal-select-chevron" style="
                  flex-shrink: 0;
                  color: #64748b;
                  font-size: 0.8em;
                  transition: transform 0.18s ease, color 0.18s ease;
                ">▼</span>
              </button>
              <div id="swal-select-dropdown" style="
                max-height: 0;
                opacity: 0;
                overflow: hidden;
                transform: translateY(-6px);
                pointer-events: none;
                margin-top: 0;
                transition: max-height 0.22s ease, opacity 0.18s ease, transform 0.18s ease, margin-top 0.18s ease;
              ">
                <div style="
                  margin-top: 8px;
                  border: 1px solid #dbe2ea;
                  border-radius: 10px;
                  background: #ffffff;
                  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
                  overflow: hidden;
                ">
                  <div style="max-height: 220px; overflow-y: auto; padding: 6px;">
                    ${selectOptionsHtml || '<div style="padding: 10px 12px; color: #6b7280; font-size: 0.9em;">ไม่พบรายการให้เลือก</div>'}
                  </div>
                </div>
              </div>
            </div>
            <div id="swal-select-error" style="
              color: #f44336;
              font-size: 0.82em;
              margin-top: 4px;
              display: none;
            ">กรุณาเลือกเหตุผลการยกเลิก</div>
          </div>
        </div>`,
      didOpen: () => {
        const confirmBtn = Swal.getConfirmButton();
        const selectEl = document.getElementById('swal-select-reason');
        const triggerEl = document.getElementById('swal-select-trigger');
        const wrapperEl = document.getElementById('swal-select-wrapper');
        const dropdownEl = document.getElementById('swal-select-dropdown');
        const placeholderEl = document.getElementById('swal-select-placeholder');
        const chevronEl = document.getElementById('swal-select-chevron');
        const errorEl = document.getElementById('swal-select-error');
        const optionEls = Array.from(document.querySelectorAll('[data-swal-select-option="true"]'));
        let isOpen = false;

        const setConfirmState = (hasValue) => {
          if (!confirmBtn) {
            return;
          }

          confirmBtn.disabled = !hasValue;
          confirmBtn.style.opacity = hasValue ? '1' : '0.4';
          confirmBtn.style.cursor = hasValue ? 'pointer' : 'not-allowed';
          confirmBtn.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
        };

        const setTriggerState = (state) => {
          if (!triggerEl) {
            return;
          }

          const stateMap = {
            default: { border: '#d0d7de', shadow: 'none' },
            focus: { border: '#2196f3', shadow: '0 0 0 3px rgba(33, 150, 243, 0.12)' },
            success: { border: '#4caf50', shadow: '0 0 0 3px rgba(76, 175, 80, 0.10)' },
            error: { border: '#f44336', shadow: '0 0 0 3px rgba(244, 67, 54, 0.12)' },
          };
          const nextState = stateMap[state] || stateMap.default;

          triggerEl.style.borderColor = nextState.border;
          triggerEl.style.boxShadow = nextState.shadow;
        };

        const syncSelectedOptionStyles = () => {
          optionEls.forEach((optionEl) => {
            const isSelected = optionEl.getAttribute('data-value') == selectEl?.value;
            optionEl.style.background = isSelected ? '#e8f5e9' : 'transparent';
            optionEl.style.color = isSelected ? '#1b5e20' : '#1f2937';
            optionEl.style.fontWeight = isSelected ? '600' : '400';
            optionEl.style.transform = 'translateX(0)';
          });
        };

        const closeDropdown = () => {
          if (!dropdownEl || !chevronEl) {
            return;
          }

          isOpen = false;
          dropdownEl.style.maxHeight = '0';
          dropdownEl.style.opacity = '0';
          dropdownEl.style.transform = 'translateY(-6px)';
          dropdownEl.style.pointerEvents = 'none';
          dropdownEl.style.marginTop = '0';
          chevronEl.style.transform = 'rotate(0deg)';
          chevronEl.style.color = '#64748b';
          setTriggerState(selectEl?.value ? 'success' : 'default');
        };

        const openDropdown = () => {
          if (!dropdownEl || !chevronEl || !selectableOptions.length) {
            return;
          }

          isOpen = true;
          dropdownEl.style.maxHeight = '280px';
          dropdownEl.style.opacity = '1';
          dropdownEl.style.transform = 'translateY(0)';
          dropdownEl.style.pointerEvents = 'auto';
          dropdownEl.style.marginTop = '8px';
          chevronEl.style.transform = 'rotate(180deg)';
          chevronEl.style.color = '#2196f3';
          setTriggerState('focus');
        };

        const handleTriggerClick = (event) => {
          event.preventDefault();
          event.stopPropagation();

          if (isOpen) {
            closeDropdown();
            return;
          }

          openDropdown();
        };

        const handleTriggerKeydown = (event) => {
          if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') {
            return;
          }

          event.preventDefault();
          handleTriggerClick(event);
        };

        const handleDocumentClick = (event) => {
          if (!wrapperEl || wrapperEl.contains(event.target)) {
            return;
          }

          closeDropdown();
        };

        setConfirmState(false);

        if (!selectableOptions.length && triggerEl) {
          triggerEl.disabled = true;
          triggerEl.style.cursor = 'not-allowed';
          triggerEl.style.opacity = '0.7';
        }

        if (triggerEl && selectableOptions.length) {
          triggerEl.addEventListener('click', handleTriggerClick);
          triggerEl.addEventListener('keydown', handleTriggerKeydown);
          triggerEl.addEventListener('mousedown', () => {
            triggerEl.style.transform = 'scale(0.995)';
          });
          triggerEl.addEventListener('mouseup', () => {
            triggerEl.style.transform = 'scale(1)';
          });
          triggerEl.addEventListener('mouseleave', () => {
            triggerEl.style.transform = 'scale(1)';
          });
          document.addEventListener('click', handleDocumentClick);
        }

        optionEls.forEach((optionEl) => {
          optionEl.addEventListener('mouseenter', () => {
            if (optionEl.getAttribute('data-value') == selectEl?.value) {
              return;
            }

            optionEl.style.background = '#f8fafc';
            optionEl.style.transform = 'translateX(2px)';
          });

          optionEl.addEventListener('mouseleave', () => {
            if (optionEl.getAttribute('data-value') == selectEl?.value) {
              optionEl.style.transform = 'translateX(0)';
              return;
            }

            optionEl.style.background = 'transparent';
            optionEl.style.transform = 'translateX(0)';
          });

          optionEl.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (selectEl) {
              selectEl.value = optionEl.getAttribute('data-value') || '';
            }
            if (placeholderEl) {
              placeholderEl.textContent = optionEl.textContent?.trim() || 'กรุณาเลือกเหตุผลการยกเลิก';
              placeholderEl.style.color = '#111827';
            }
            if (errorEl) {
              errorEl.style.display = 'none';
            }

            syncSelectedOptionStyles();
            setConfirmState(Boolean(selectEl?.value));
            closeDropdown();
          });
        });

        cleanupSelectEvents = () => {
          if (selectableOptions.length) {
            document.removeEventListener('click', handleDocumentClick);
          }
        };

        syncSelectedOptionStyles();
      },
      willClose: () => {
        cleanupSelectEvents();
      },
      preConfirm: () => {
        const selectEl = document.getElementById('swal-select-reason');
        const triggerEl = document.getElementById('swal-select-trigger');
        const dropdownEl = document.getElementById('swal-select-dropdown');
        const chevronEl = document.getElementById('swal-select-chevron');
        const selectedId = selectEl?.value;

        if (!selectedId) {
          const errorEl = document.getElementById('swal-select-error');

          if (errorEl) {
            errorEl.style.display = 'block';
          }

          if (triggerEl) {
            triggerEl.style.borderColor = '#f44336';
            triggerEl.style.boxShadow = '0 0 0 3px rgba(244, 67, 54, 0.12)';
            triggerEl.focus();
          }

          if (dropdownEl && chevronEl && selectableOptions.length) {
            dropdownEl.style.maxHeight = '280px';
            dropdownEl.style.opacity = '1';
            dropdownEl.style.transform = 'translateY(0)';
            dropdownEl.style.pointerEvents = 'auto';
            dropdownEl.style.marginTop = '8px';
            chevronEl.style.transform = 'rotate(180deg)';
            chevronEl.style.color = '#2196f3';
          }

          return false;
        }

        return selectedId;
      },
    }).then((result) => {
      if (!result.isConfirmed) {
        resolve(null);
        return;
      }

      const selectedItem = safeOptions.find((item) => item?.id == result.value);
      resolve(selectedItem || null);
    });
  });
}



function toastSuccess(params = {}) {
  const { title = 'สำเร็จ', text = 'ดำเนินการเสร็จสิ้น', icon = 'success' } = params || {};

  Swal.fire({
    toast: true, // เปิดโหมด toast
    position: 'top-end', // มุมขวาบน
    width: 400,
    title: title,
    text: text,
    icon: icon,
    showConfirmButton: false, // ไม่แสดงปุ่มยืนยัน
    timer: 3000, // หายไปหลัง 3 วินาที
    timerProgressBar: true, // แถบแสดงความคืบหน้า
    padding: '0.5em', // ลดขนาด padding ให้เล็กลง
    background: '#fff', // พื้นหลังสีขาว
    customClass: {
      popup: 'small-toast', // คลาสสำหรับปรับแต่ง CSS
      title: 'custom-swal2-title',
      htmlContainer: 'custom-swal2-html-container',
    },
    didOpen: ensureToastOnTop,
  });
}

function toastError(params = {}) {
  const { title = 'ผิดพลาด', text = 'กรุณาลองใหม่อีกครั้ง', icon = 'error' } = params || {};

  Swal.fire({
    toast: true, // เปิดโหมด toast
    position: 'top-end', // ตำแหน่งมุมขวาบน (คล้าย Bootstrap-Vue)
    width: 400,
    title: title,
    text: text,
    icon: icon,
    showConfirmButton: false, // ไม่แสดงปุ่มยืนยัน
    timer: 3000, // หายไปอัตโนมัติหลัง 3 วินาที
    timerProgressBar: true, // แสดงแถบ прогресс
    padding: '0.5em', // ลดขนาด padding ให้เล็กลง
    background: '#fff', // พื้นหลังสีขาว (ปรับแต่งได้)
    customClass: {
      popup: 'small-toast', // คลาสสำหรับปรับแต่ง CSS
      title: 'custom-swal2-title',
      htmlContainer: 'custom-swal2-html-container',
    },
    didOpen: ensureToastOnTop,
  });
}

function toastWarning(params = {}) {
  const { title = 'คำเตือน', text = 'กรุณากรอกข้อมูลให้ครบถ้วน', icon = 'warning' } = params || {};

  Swal.fire({
    toast: true, // เปิดโหมด toast
    position: 'top-end', // ตำแหน่งมุมขวาบน (คล้าย Bootstrap-Vue)
    width: 400,
    title: title,
    text: text,
    icon: icon,
    showConfirmButton: false, // ไม่แสดงปุ่มยืนยัน
    timer: 3000, // หายไปอัตโนมัติหลัง 3 วินาที
    timerProgressBar: true, // แสดงแถบ прогресс
    padding: '0.4em', // ลดขนาด padding ให้เล็กลง
    background: '#fff', // พื้นหลังสีขาว (ปรับแต่งได้)
    customClass: {
      popup: 'small-toast', // คลาสสำหรับปรับแต่ง CSS
      title: 'custom-swal2-title',
      htmlContainer: 'custom-swal2-html-container',
    },
    didOpen: ensureToastOnTop,
  });
}

function dialogTextArea(params = {}) {
  const {
    title = 'กรุณากรอกข้อมูล',
    icon = 'warning',
    placeholder = 'หากมีข้อมูลเพิ่มเติมกรุณากรอกที่นี่ (ไม่บังคับ)',
    confirmButtonText = 'ตกลง',
    cancelButtonText = 'ยกเลิก',
  } = params || {};

  return new Promise((resolve) => {
    Swal.fire({
      title: title,
      icon: icon,
      input: 'textarea',
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      reverseButtons: true,
      width: 550,
      customClass: {
        confirmButton: 'bg-main',
      },
    }).then((result) => {
      let ret = {
        isConfirmed: result.isConfirmed,
        value: result.value ? result.value : null,
      };
      resolve(ret); // ส่งค่ากลับ
    });
  });
}



//############################## SWEET ALERT CONFIRM WITH CUSTOM HTML ########################

function boxConfirm2(params = {}) {
  const {
    title = 'คุณแน่ใจที่จะลบข้อมูล ?',
    subtitle = '', // เพิ่ม subtitle
    text = 'ข้อมูลที่ลบจะไม่สามารถกู้คืนได้อีก',
    description = 'ช่างซ่อมทำงานเสร็จแล้ว กรุณาตรวจสอบข้อมูลการซ่อมให้เรียบร้อย เช่น อุปกรณ์ที่ซ่อม, วันที่ซ่อม, ปัญหาที่แก้ไข กดยืนยันเพื่อบันทึกว่าการซ่อมเสร็จเรียบร้อยจริง ๆ',
    icon = 'warning',
    confirmButtonText = 'ใช่, ลบข้อมูล',
    cancelButtonText = 'ยกเลิก',
  } = params || {};

  return new Promise((resolve) => {
    Swal.fire({
      icon: icon,
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      reverseButtons: true,
      width: 520,
      customClass: {
        confirmButton: 'bg-main',
        popup: 'swal2-popup-custom',
      },
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <!-- Title -->
          <h2 style="
            margin: 0 0 16px 0;
            font-size: 1.5em;
            font-weight: 600;
            color: #333;
            text-align: center;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 12px;
          ">${title}</h2>
          
          <!-- Info Section -->
          ${subtitle ? `
          <div style="
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-left: 4px solid #2196f3;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 12px;
          ">
            <div style="
              font-size: 0.85em;
              color: #1565c0;
              font-weight: 600;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">⏱ ระยะเวลา</div>
            <div style="
              font-size: 1em;
              color: #0d47a1;
              font-weight: 500;
            ">${subtitle.replace('ใช้เวลาในการซ่อม : ', '')}</div>
          </div>
          ` : ''}
          
          <!-- Note Section -->
          <div style="
            background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
            border-left: 4px solid #757575;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 12px;
          ">
            <div style="
              font-size: 0.85em;
              color: #616161;
              font-weight: 600;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">📝 โน๊ตซ่อมบำรุง</div>
            <div style="
              font-size: 1em;
              color: #424242;
              font-weight: 400;
              word-break: break-word;
            ">${text.replace('โน๊ตซ่อมบำรุง : ', '')}</div>
          </div>
          
          <!-- Warning Section -->
          <div style="
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            border-left: 4px solid #ff9800;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 8px;
          ">
            <div style="
              font-size: 0.85em;
              color: #e65100;
              font-weight: 600;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">⚠️ คำเตือน</div>
            <div style="
              font-size: 0.95em;
              color: #bf360c;
              font-weight: 400;
              line-height: 1.5;
            ">${description.replace('คำเตือน : ', '')}</div>
          </div>
        </div>`,
    }).then((result) => {
      resolve(result.isConfirmed);
    });
  });
}






function boxConfirm3(params = {}) {
  const {
    title = 'ยืนยันการดำเนินการ',
    text = 'กรุณากรอกเหตุผลก่อนยืนยัน',
    icon = 'warning',
    inputLabel = 'เหตุผล',
    inputPlaceholder = 'กรุณาระบุเหตุผล...',
    confirmButtonText = 'ใช่, ยืนยัน',
    cancelButtonText = 'ยกเลิก',
  } = params || {};

  const iconColorMap = {
    warning: { bg: '#fff3e0', border: '#ff9800', color: '#e65100', emoji: '⚠️' },
    error: { bg: '#ffebee', border: '#f44336', color: '#c62828', emoji: '❌' },
    info: { bg: '#e3f2fd', border: '#2196f3', color: '#1565c0', emoji: 'ℹ️' },
    success: { bg: '#e8f5e9', border: '#4caf50', color: '#2e7d32', emoji: '✅' },
    question: { bg: '#f3e5f5', border: '#9c27b0', color: '#6a1b9a', emoji: '❓' },
  };
  const theme = iconColorMap[icon] || iconColorMap.warning;

  return new Promise((resolve) => {
    Swal.fire({
      icon: icon,
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      reverseButtons: true,
      width: 520,
      customClass: {
        confirmButton: 'bg-main',
        popup: 'swal2-popup-custom',
      },
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <h2 style="
            margin: 0 0 16px 0;
            font-size: 1.4em;
            font-weight: 600;
            color: #333;
            text-align: center;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 12px;
          ">${title}</h2>
          <div style="
            background: linear-gradient(135deg, ${theme.bg} 0%, ${theme.bg}dd 100%);
            border-left: 4px solid ${theme.border};
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 14px;
          ">
            <div style="
              font-size: 0.95em;
              color: ${theme.color};
              font-weight: 400;
              line-height: 1.6;
              word-break: break-word;
            ">${theme.emoji} ${text}</div>
          </div>
          <div style="margin-bottom: 8px;">
            <label style="
              display: block;
              font-size: 0.9em;
              font-weight: 600;
              color: #424242;
              margin-bottom: 6px;
            ">${inputLabel} <span style="color: #f44336; font-size: 1.1em;">*</span></label>
            <textarea id="swal-input-reason" rows="3" placeholder="${inputPlaceholder}" style="
              width: 100%;
              box-sizing: border-box;
              border: 2px solid #e0e0e0;
              border-radius: 8px;
              padding: 10px 12px;
              font-size: 0.95em;
              font-family: inherit;
              resize: vertical;
              transition: border-color 0.2s;
              outline: none;
            " onfocus="this.style.borderColor='#2196f3'" onblur="this.style.borderColor='#e0e0e0'"></textarea>
            <div id="swal-input-error" style="
              color: #f44336;
              font-size: 0.82em;
              margin-top: 4px;
              display: none;
            ">⚠ กรุณากรอกเหตุผลก่อนยืนยัน</div>
          </div>
        </div>`,
      didOpen: () => {
        const confirmBtn = Swal.getConfirmButton();
        const inputEl = document.getElementById('swal-input-reason');
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.style.opacity = '0.4';
          confirmBtn.style.cursor = 'not-allowed';
        }
        if (inputEl) {
          inputEl.addEventListener('input', () => {
            const hasValue = inputEl.value.trim().length > 0;
            if (confirmBtn) {
              confirmBtn.disabled = !hasValue;
              confirmBtn.style.opacity = hasValue ? '1' : '0.4';
              confirmBtn.style.cursor = hasValue ? 'pointer' : 'not-allowed';
            }
            // ซ่อน error เมื่อเริ่มพิมพ์
            const errorEl = document.getElementById('swal-input-error');
            if (hasValue && errorEl) errorEl.style.display = 'none';
            if (hasValue && inputEl.style.borderColor === 'rgb(244, 67, 54)') {
              inputEl.style.borderColor = '#2196f3';
            }
          });
        }
      },
      preConfirm: () => {
        const value = document.getElementById('swal-input-reason').value.trim();
        if (!value) {
          const errorEl = document.getElementById('swal-input-error');
          const inputEl = document.getElementById('swal-input-reason');
          if (errorEl) errorEl.style.display = 'block';
          if (inputEl) inputEl.style.borderColor = '#f44336';
          return false;
        }
        return value;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        resolve({ isConfirmed: true, value: result.value });
      } else {
        resolve({ isConfirmed: false, value: null });
      }
    });
  });
}




export { boxConfirm, boxConfirm2, boxConfirm3, toastSuccess, toastError, toastWarning, dialogTextArea, boxConfirmSelect };
