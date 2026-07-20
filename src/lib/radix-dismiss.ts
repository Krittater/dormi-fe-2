/**
 * กัน Dialog/Sheet ปิดตัวเองเวลา "คลิกบน dropdown ที่ portal ออกไปนอกกล่อง"
 *
 * ที่มา: Radix Select/Dropdown/Popover render เนื้อหา (dropdown) ด้วย Portal ไปแปะที่
 * <body> ซึ่งอยู่ "นอก" DialogContent ใน DOM. เวลาคลิกเลือกใน dropdown, Dialog มองว่า
 * เป็นการคลิกนอกกล่อง (onInteractOutside) แล้วปิดตัวเองทิ้ง ทั้งที่ยังกรอกฟอร์มอยู่.
 *
 * ตัวช่วยนี้เช็คว่า target ของ interaction อยู่ในเนื้อหาที่ portal ออกไปหรือไม่
 * ถ้าใช่ = เพิกเฉย (ไม่ปิด). ส่วนการคลิก backdrop จริงยังปิด Dialog ได้ตามปกติ
 */

/** เนื้อหาที่ถูก portal ออกนอกกล่อง — ไม่ควรทำให้ Dialog/Sheet ปิด */
const PORTALLED_SELECTORS = [
  "[data-radix-popper-content-wrapper]", // Select / Dropdown / Popover / Tooltip (popper)
  "[data-radix-select-viewport]",
  "[data-radix-menu-content]",
  "[data-sonner-toaster]", // toast (sonner)
].join(",");

/**
 * คืน true ถ้า interaction (pointer/focus) เกิดบนเนื้อหาที่ portal ออกไป
 * → ผู้เรียกควร e.preventDefault() เพื่อไม่ให้ Dialog/Sheet ปิด
 */
export function isInteractionInsidePortal(event: {
  detail?: { originalEvent?: Event };
  target?: EventTarget | null;
}): boolean {
  const original = event.detail?.originalEvent;
  const target = (original?.target ?? event.target) as HTMLElement | null;
  return Boolean(target?.closest?.(PORTALLED_SELECTORS));
}
