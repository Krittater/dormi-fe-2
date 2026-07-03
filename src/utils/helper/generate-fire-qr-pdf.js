/**
 * Generate Fire Equipment QR Code Sticker PDF
 * Layout: A4 Landscape, 6 cols × 2 rows = 12 stickers per page
 * Size: 46.5 × 80 mm (เหมือนบัตรพนักงาน HRM ตรงเป๊ะ)
 * Position: รับ enabledPositions = Set of slot numbers (1-12)
 *
 * Layout reference: เลียนแบบจาก nst_hrm_web_app_v3/src/views/HrmCardPage/index.vue
 *   pageOrientation: 'landscape'
 *   pageMargins: [0, 7mm, 0, 10mm]
 *   STICKER_WIDTH_MM = 46.5
 *   STICKER_HEIGHT_MM = 80
 *   Row 1 (cards 1-6): margin top 12mm
 *   Row 2 (cards 7-12): margin top 8mm
 *   No table borders
 */
import PdfMake from '@/pdfmake/pdf-make.js';
import QRCode from 'qrcode';

const MM_TO_PT = 2.83465;
const STICKER_WIDTH_MM = 46.5;
const STICKER_HEIGHT_MM = 80;
const COLS = 6;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;

// Page margin (mm) — ตรง spec HRM
const PAGE_MARGIN_LEFT_MM = 0;
const PAGE_MARGIN_RIGHT_MM = 0;
const PAGE_MARGIN_TOP_MM = 7;
const PAGE_MARGIN_BOTTOM_MM = 10;

// Spacing ระหว่างแถว (mm) — ตรง spec HRM
const ROW1_MARGIN_TOP_MM = 12;
const ROW1_MARGIN_LEFT_MM = 1;
const ROW2_MARGIN_TOP_MM = 8;
const ROW2_MARGIN_LEFT_MM = 1;

/**
 * @param {Array} items — รายการอุปกรณ์ดับเพลิง (FireEquipment with companyAsset + group info)
 * @param {Object} options
 * @param {string} options.baseUrl — origin URL สำหรับ encode ใน QR (e.g., "https://nst-maintenance.web.app")
 * @param {Set<number>} options.enabledPositions — slot numbers ที่ active บนหน้าแรก (1-12)
 *                       ตัวอื่น (slot 13+) จะใส่ตามลำดับเต็มในหน้าถัดไป
 * @param {Function} options.getGroupName — (code) => name
 * @param {string} options.action — 'download' | 'open' | 'print' | 'dataUrl'
 * @returns {Promise<string|void>} dataUrl ถ้า action='dataUrl', otherwise void
 */
export async function generateFireQrPdf(items, options = {}) {
  const {
    baseUrl = window.location.origin,
    enabledPositions = null, // null = ใช้ทุกตำแหน่ง
    getGroupName = (code) => code || '',
    action = 'open',
  } = options;

  // 1. Generate QR codes for all items first (async)
  const itemsWithQr = [];
  for (const it of items) {
    const code = it.companyAsset?.assetNumber || '';
    if (!code) continue;
    const url = `${baseUrl}/fire/inspect/${encodeURIComponent(code)}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
    itemsWithQr.push({ item: it, qr: qrDataUrl, code });
  }

  // 2. Build flat list of cells:
  //    - หน้าแรก: เคารพ enabledPositions (slot ที่ disabled → cell ว่าง)
  //    - หน้าถัดไป: เติมต่อ (slot เต็ม)
  const cells = [];
  let itemIndex = 0;
  let pageIdx = 0;
  while (itemIndex < itemsWithQr.length) {
    for (let slot = 0; slot < PER_PAGE; slot++) {
      const slotNumber = slot + 1; // 1-based
      const isFirstPage = pageIdx === 0;
      // ถ้าหน้าแรกและ slot ถูก disable → ใส่ cell ว่าง (เพื่อเลื่อนข้าม)
      if (isFirstPage && enabledPositions && !enabledPositions.has(slotNumber)) {
        cells.push({ blank: true });
        continue;
      }
      if (itemIndex >= itemsWithQr.length) {
        cells.push({ blank: true }); // fill remaining of last page
      } else {
        cells.push(itemsWithQr[itemIndex]);
        itemIndex++;
      }
    }
    pageIdx++;
  }

  // 3. Build pdfmake content
  // เลียนแบบ HRM: per page = 2 tables (Row 1 + Row 2), ไม่มี border
  const widths = Array(COLS).fill(STICKER_WIDTH_MM * MM_TO_PT);
  const heights = [STICKER_HEIGHT_MM * MM_TO_PT];
  const noBorderLayout = {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    hLineColor: () => 'black',
    vLineColor: () => 'black',
  };

  const content = [];
  for (let p = 0; p < cells.length; p += PER_PAGE) {
    const pageCells = cells.slice(p, p + PER_PAGE);
    // Row 1: cells 0-5
    const row1Cells = pageCells.slice(0, COLS).map((c) => buildStickerCell(c, getGroupName));
    // Row 2: cells 6-11
    const row2Cells = pageCells.slice(COLS, COLS * 2).map((c) => buildStickerCell(c, getGroupName));
    // กัน row2 ยังไม่ครบ COLS — pad ด้วย blank
    while (row2Cells.length < COLS) {
      row2Cells.push(buildStickerCell({ blank: true }, getGroupName));
    }

    content.push({
      style: 'tableFirstRow',
      table: { widths, heights, headerRows: 1, body: [row1Cells] },
      layout: noBorderLayout,
    });
    content.push({
      style: 'tableSecondRow',
      table: { widths, heights, headerRows: 1, body: [row2Cells] },
      layout: noBorderLayout,
      pageBreak: p + PER_PAGE < cells.length ? 'after' : undefined,
    });
  }

  const docDefinition = {
    info: {
      title: 'Fire QR Stickers',
      author: 'NST M&M System',
      subject: 'Fire Equipment QR Code Stickers',
    },
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [
      PAGE_MARGIN_LEFT_MM * MM_TO_PT,
      PAGE_MARGIN_TOP_MM * MM_TO_PT,
      PAGE_MARGIN_RIGHT_MM * MM_TO_PT,
      PAGE_MARGIN_BOTTOM_MM * MM_TO_PT,
    ],
    defaultStyle: { font: 'Sarabun', fontSize: 8 },
    content,
    styles: {
      // ตรงตาม HRM
      tableFirstRow: {
        margin: [ROW1_MARGIN_LEFT_MM * MM_TO_PT, ROW1_MARGIN_TOP_MM * MM_TO_PT, 0, 0],
      },
      tableSecondRow: {
        margin: [ROW2_MARGIN_LEFT_MM * MM_TO_PT, ROW2_MARGIN_TOP_MM * MM_TO_PT, 0, 0],
      },
      header: { fontSize: 7, color: '#666666', alignment: 'center' },
      assetCode: { fontSize: 13, bold: true, alignment: 'center' },
      assetName: { fontSize: 8, alignment: 'center', color: '#333333' },
      groupName: { fontSize: 7, color: '#666666', alignment: 'center' },
      footer: { fontSize: 6, color: '#999999', alignment: 'center' },
    },
  };

  const pdf = PdfMake.pdfMake.createPdf(docDefinition);
  if (action === 'download') {
    const filename = `Fire_QR_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.download(filename);
    return;
  }
  if (action === 'print') {
    pdf.print();
    return;
  }
  if (action === 'dataUrl') {
    return new Promise((resolve) => pdf.getDataUrl(resolve));
  }
  // default = open in new tab
  pdf.open();
}

/**
 * สร้าง content ของ cell หนึ่งใน table (1 sticker)
 */
function buildStickerCell(cell, getGroupName) {
  if (!cell || cell.blank) {
    // cell ว่าง (slot ที่ disabled หรือเหลือว่างหน้าสุดท้าย)
    return { text: '', border: [false, false, false, false] };
  }

  const { item, qr, code } = cell;
  const assetName = item.companyAsset?.assetName || '-';
  const groupName = getGroupName(item.equipmentType);

  return {
    stack: [
      // header
      {
        text: 'NST ทะเบียนอุปกรณ์ดับเพลิง',
        style: 'header',
        margin: [0, 4, 0, 2],
      },
      // QR code (กึ่งกลาง)
      {
        image: qr,
        width: 30 * MM_TO_PT,
        height: 30 * MM_TO_PT,
        alignment: 'center',
        margin: [0, 2, 0, 4],
      },
      // asset code (ใหญ่)
      {
        text: code,
        style: 'assetCode',
        margin: [0, 0, 0, 2],
      },
      // asset name (เล็ก, 2 บรรทัด)
      {
        text: assetName,
        style: 'assetName',
        margin: [2, 0, 2, 2],
      },
      // group
      {
        text: groupName,
        style: 'groupName',
        margin: [0, 2, 0, 0],
      },
      // footer
      {
        text: 'สแกนเพื่อตรวจประจำเดือน',
        style: 'footer',
        margin: [0, 4, 0, 0],
      },
    ],
    border: [true, true, true, true],
  };
}

export {
  STICKER_WIDTH_MM,
  STICKER_HEIGHT_MM,
  COLS,
  ROWS,
  PER_PAGE,
};
