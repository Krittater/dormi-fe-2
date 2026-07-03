// Generate XLSX file from dashboard data (client-side)
// Layout: 1 sheet, pivot table matching the on-screen dashboard
// - Header row: title + year
// - Column header row: # / รหัส / ชื่ออุปกรณ์ / Jan / Feb / ... / Dec
// - Section group header rows: section name (merged, bold, gray bg)
// - Asset rows: row number, asset code, asset name, 12 month cells
// - Cell: 2-char encoding (✓✓, ✗✗, ——, ✓—, OR, ··) + bg color of "worst" combined status

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const COLOR_BY_NAME = {
  green: 'FF66BB6A',
  orange: 'FFFFA726',
  red: 'FFEF5350',
  blue: 'FF42A5F5',
  gray: 'FFE0E0E0',
};

// Encode cell as 2-char text — top half / bottom half
function encodeCell(top, bottom) {
  const map = { green: '✓', orange: '✗', red: '—', blue: 'O', gray: '·' };
  if (top === 'blue' && bottom === 'blue') return 'OR';
  return (map[top] || '·') + (map[bottom] || '·');
}

// "Worst" combined color (severity priority): red > orange > blue > green > gray
function worstColor(top, bottom) {
  const priority = { red: 5, orange: 4, blue: 3, green: 2, gray: 1 };
  const tw = priority[top] || 1;
  const bw = priority[bottom] || 1;
  return tw >= bw ? top : bottom;
}

// Format ISO date → "DD/MM/YYYY HH:mm" (Bangkok time) — ไม่ดึง moment เพราะ excel util ควรเบา
function formatExcelDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  // ใช้ local time (browser timezone) — server ส่ง ISO ที่มี +07:00 อยู่แล้วจะถูกต้อง
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function generateDashboardExcel(dashboardData) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Dashboard ${dashboardData.year}`);

  // Title row
  ws.mergeCells('A1:O1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `สรุปการตรวจอุปกรณ์ดับเพลิง ปี ${dashboardData.year}`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  ws.getRow(1).height = 24;

  // Column headers (row 3)
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  ws.getRow(3).values = ['#', 'รหัส', 'ชื่ออุปกรณ์', ...monthLabels];
  ws.getRow(3).font = { bold: true };
  ws.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
  ws.getRow(3).alignment = { horizontal: 'center', vertical: 'middle' };

  // Column widths
  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 30;
  for (let i = 4; i <= 15; i++) ws.getColumn(i).width = 7;

  let rowNum = 4;
  for (const section of dashboardData.sections) {
    // Section header row — แสดง ฝ่าย → แผนก
    ws.mergeCells(`A${rowNum}:O${rowNum}`);
    const sectionCell = ws.getCell(`A${rowNum}`);
    const headerLabel = section.departmentName
      ? `📁 ฝ่าย ${section.departmentName} → ${section.sectionName}  (${section.assetCount} อุปกรณ์)`
      : `📁 ${section.sectionName}  (${section.assetCount} อุปกรณ์)`;
    sectionCell.value = headerLabel;
    sectionCell.font = { bold: true };
    sectionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0E8F2' } };
    rowNum++;

    let idx = 1;
    for (const asset of section.assets) {
      const rowValues = [idx, asset.assetCode, asset.assetName];
      for (const cell of asset.months) {
        rowValues.push(encodeCell(cell.top, cell.bottom));
      }
      const row = ws.getRow(rowNum);
      row.values = rowValues;
      row.alignment = { horizontal: 'center', vertical: 'middle' };

      // Apply cell colors + comment (hover ใน Excel เพื่อดูรายละเอียดผู้ตรวจ)
      for (let i = 0; i < 12; i++) {
        const colIdx = 4 + i; // months start at column D
        const cellData = asset.months[i];
        const xlsxCell = row.getCell(colIdx);
        const bg = COLOR_BY_NAME[worstColor(cellData.top, cellData.bottom)];
        xlsxCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        xlsxCell.font = { size: 10, bold: true };

        // Build comment text
        const lines = [];
        if (cellData.inspectorEmployeeId || cellData.inspectorName) {
          const idPart = cellData.inspectorEmployeeId || '';
          const namePart = cellData.inspectorName || '';
          const sep = idPart && namePart ? ' - ' : '';
          lines.push(`ผู้ตรวจ: ${idPart}${sep}${namePart}`);
        }
        if (cellData.inspectedAt) {
          lines.push(`ตรวจเมื่อ: ${formatExcelDate(cellData.inspectedAt)}`);
        }
        if (cellData.approverEmployeeId || cellData.approverName) {
          const idPart = cellData.approverEmployeeId || '';
          const namePart = cellData.approverName || '';
          const sep = idPart && namePart ? ' - ' : '';
          lines.push(`ผู้อนุมัติ: ${idPart}${sep}${namePart}`);
        }
        if (cellData.approvedAt) {
          lines.push(`อนุมัติเมื่อ: ${formatExcelDate(cellData.approvedAt)}`);
        }
        if (cellData.overallResult) {
          lines.push(`ผล: ${cellData.overallResult === 'pass' ? 'ผ่าน' : 'ไม่ผ่าน'}`);
        }
        if (cellData.failItems && cellData.failItems.length) {
          lines.push(`ข้อไม่ผ่าน: ${cellData.failItems.join(', ')}`);
        }
        if (lines.length) {
          xlsxCell.note = lines.join('\n');
        }
      }
      rowNum++;
      idx++;
    }
    rowNum++; // blank row between sections
  }

  // ============================================================
  // SHEET 2: Raw data — สำหรับ KPI / pivot ต่อใน Excel
  // 1 row = 1 cell ใน dashboard (asset × month)
  // ============================================================
  const wsRaw = wb.addWorksheet(`ข้อมูลดิบ ${dashboardData.year}`);

  // Map status code → Thai label (ใช้กับ raw sheet)
  const statusToThai = {
    approved: 'อนุมัติแล้ว',
    rejected: 'จป.ไม่อนุมัติ',
    safety_officer_override: 'จป.ตรวจแทน',
    pending_in_window: 'รออนุมัติ',
    pending_overdue: 'รออนุมัติ (เลยเดือน)',
    not_inspected: 'ไม่มีการตรวจ',
    user_overdue_so_in_window: 'พนักงานเลยเวลา',
    in_window: 'ในช่วงตรวจ',
    future: 'ยังไม่ถึงเดือน',
    before_asset_created: 'ก่อนติดตั้ง',
    after_deactivation: 'ปิดใช้งานแล้ว',
    not_in_section: 'ไม่อยู่ในแผนกนี้',
  };

  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  // Headers
  const rawHeaders = [
    'ปี', 'เดือน (เลข)', 'เดือน',
    'รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'ประเภท', 'ใช้งาน',
    'ฝ่าย', 'แผนก',
    'สถานะ', 'ผลตรวจ',
    'รหัสผู้ตรวจ', 'ชื่อผู้ตรวจ', 'วันที่ตรวจ',
    'รหัสผู้อนุมัติ', 'ชื่อผู้อนุมัติ', 'วันที่อนุมัติ',
    'จำนวนวันรอ approve',
    'เหตุผลไม่อนุมัติ', 'จำนวนข้อไม่ผ่าน', 'รายการข้อไม่ผ่าน',
    // flag columns สำหรับ COUNTIF / SUMIF ง่ายๆ
    'flag_passed', 'flag_failed', 'flag_missed', 'flag_pending', 'flag_rejected', 'flag_override',
  ];
  wsRaw.getRow(1).values = rawHeaders;
  wsRaw.getRow(1).font = { bold: true };
  wsRaw.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };

  // Column widths
  const widths = [6, 9, 8, 14, 30, 12, 9, 22, 22, 22, 10, 12, 25, 18, 12, 25, 18, 10, 25, 9, 40, 8, 8, 8, 8, 8, 8];
  widths.forEach((w, i) => { wsRaw.getColumn(i + 1).width = w; });

  let rawRowNum = 2;
  for (const section of dashboardData.sections) {
    for (const asset of section.assets) {
      for (const cell of asset.months) {
        // ข้าม cell ที่ "ไม่เกี่ยว" (ก่อนติดตั้ง / ปิดใช้ / ยังไม่ถึง / not_in_section)
        // คงไว้แต่ในสถิติจริง: approved/rejected/override/pending/not_inspected/user_overdue_so_in_window
        const relevantStatuses = ['approved', 'rejected', 'safety_officer_override', 'pending_in_window', 'pending_overdue', 'not_inspected', 'user_overdue_so_in_window'];
        if (!relevantStatuses.includes(cell.status)) continue;

        const isPass = cell.overallResult === 'pass';
        const isFail = cell.overallResult === 'fail';

        // จำนวนวันรอ approve (ถ้ามี approvedAt + inspectedAt)
        let daysToApprove = '';
        if (cell.inspectedAt && cell.approvedAt) {
          const d1 = new Date(cell.inspectedAt);
          const d2 = new Date(cell.approvedAt);
          if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            daysToApprove = Math.round(((d2 - d1) / 86400000) * 10) / 10;
          }
        }

        const row = wsRaw.getRow(rawRowNum);
        row.values = [
          dashboardData.year,
          cell.m,
          monthNames[cell.m - 1] || '',
          asset.assetCode || '',
          asset.assetName || '',
          asset.equipmentType || '',
          asset.isActive ? 'ใช้งาน' : 'ปิด',
          section.departmentName || '',
          section.sectionName || '',
          statusToThai[cell.status] || cell.status,
          cell.overallResult === 'pass' ? 'ผ่าน' : (cell.overallResult === 'fail' ? 'ไม่ผ่าน' : ''),
          cell.inspectorEmployeeId || '',
          cell.inspectorName || '',
          cell.inspectedAt ? formatExcelDate(cell.inspectedAt) : '',
          cell.approverEmployeeId || '',
          cell.approverName || '',
          cell.approvedAt ? formatExcelDate(cell.approvedAt) : '',
          daysToApprove,
          cell.rejectReason || '',
          cell.failItems ? cell.failItems.length : 0,
          cell.failItems ? cell.failItems.join(' | ') : '',
          // flag columns (1 หรือ 0 ใช้ SUM ตรงๆ ได้)
          (cell.status === 'approved' && isPass) ? 1 : 0,
          (cell.status === 'approved' && isFail) || (cell.status === 'safety_officer_override' && isFail) ? 1 : 0,
          cell.status === 'not_inspected' || cell.status === 'user_overdue_so_in_window' ? 1 : 0,
          cell.status === 'pending_in_window' || cell.status === 'pending_overdue' ? 1 : 0,
          cell.status === 'rejected' ? 1 : 0,
          cell.status === 'safety_officer_override' ? 1 : 0,
        ];
        rawRowNum++;
      }
    }
  }

  // Freeze top row + auto filter
  wsRaw.views = [{ state: 'frozen', ySplit: 1 }];
  if (rawRowNum > 2) {
    wsRaw.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rawRowNum - 1, column: rawHeaders.length },
    };
  }

  // ============================================================
  // SHEET 3: Summary — สถิติรวม (อ่านสวย + เอาไป copy ไป report ได้)
  // ============================================================
  const wsSum = wb.addWorksheet(`สถิติรวม ${dashboardData.year}`);
  wsSum.getColumn(1).width = 28;
  wsSum.getColumn(2).width = 14;
  wsSum.getColumn(3).width = 14;

  // คำนวณจาก raw rows
  let total = 0, pass = 0, fail = 0, missed = 0, pending = 0, rejected = 0, override = 0;
  for (const section of dashboardData.sections) {
    for (const asset of section.assets) {
      for (const cell of asset.months) {
        if (['future', 'in_window', 'before_asset_created', 'not_in_section', 'after_deactivation'].includes(cell.status)) continue;
        total++;
        if (cell.status === 'approved') {
          if (cell.overallResult === 'pass') pass++; else fail++;
        } else if (cell.status === 'rejected') rejected++;
        else if (cell.status === 'safety_officer_override') {
          override++;
          if (cell.overallResult === 'pass') pass++; else fail++;
        } else if (cell.status === 'pending_in_window' || cell.status === 'pending_overdue') pending++;
        else if (cell.status === 'not_inspected' || cell.status === 'user_overdue_so_in_window') missed++;
      }
    }
  }
  const pct = (n) => total > 0 ? Math.round((n / total) * 1000) / 10 : 0;

  wsSum.getRow(1).values = [`สถิติการตรวจอุปกรณ์ดับเพลิง ปี ${dashboardData.year}`];
  wsSum.getRow(1).font = { size: 14, bold: true };
  wsSum.mergeCells('A1:C1');
  wsSum.getRow(3).values = ['รายการ', 'จำนวน', '%'];
  wsSum.getRow(3).font = { bold: true };
  wsSum.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
  const summaryRows = [
    ['รวมทั้งหมด', total, '100%'],
    ['✅ ผ่าน', pass, `${pct(pass)}%`],
    ['⚠️ ไม่ผ่าน', fail, `${pct(fail)}%`],
    ['❌ ไม่ตรวจ (พลาด)', missed, `${pct(missed)}%`],
    ['⏳ รออนุมัติ', pending, `${pct(pending)}%`],
    ['🚫 จป.ไม่อนุมัติ', rejected, `${pct(rejected)}%`],
    ['🛡️ จป.ตรวจแทน', override, `${pct(override)}%`],
    [],
    ['📊 อัตราผ่าน', `${pass + fail + missed > 0 ? Math.round((pass / (pass + fail + missed)) * 1000) / 10 : 0}%`, '(pass / (pass+fail+missed))'],
  ];
  let sumRow = 4;
  for (const r of summaryRows) {
    if (r.length) wsSum.getRow(sumRow).values = r;
    sumRow++;
  }

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `fire-inspection-dashboard-${dashboardData.year}.xlsx`);
}
