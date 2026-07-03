/* eslint-disable no-console */
const path = require('path');
const ExcelJS = require('exceljs');

// Sample data (ปรับ/แทนที่ด้วยข้อมูลจริงได้)
const sampleData = [
    {
      "id": 6,
      "PurchReqId": "PR-2025-001",
      "PurchReqName": "สั่งซื้อคอมพิวเตอร์",
      "Originator": "Anuchit",
      "Description": "ต้องการสั่งซื้อคอมพิวเตอร์เพื่อใช้ในโปรเจค",
      "BusinessJustification": "เพิ่มประสิทธิภาพการทำงานของทีม",
      "TransDate": "2025-09-01T12:00:00.000Z",
      "RequiredDate": "2025-10-16T12:00:00.000Z",
      "repaireRequestId": "307",
      "PoId": null,
      "PrItemId": "FS-OIL004",
      "PrItemName": "น้ำมันไฮโดรลิค # 32",
      "PurchId": "PO26-000048",
      "PurchName": "ห้างหุ้นส่วนจำกัด มงคลไพศาลอุตสาหกรรม",
      "OrderAccount": "V001094",
      "ItemId": "SM-130610374-1",
      "ItemName": "BOSS",
      "PurchUnit": "PCS",
      "DeliveryDate": "2026-01-05T05:00:00.000Z",
      "AccountingDate": "2026-01-05T05:00:00.000Z",
      "DiscPercent": "0.00",
      "PurchQty": "400.00",
      "PurchPrice": "11.30",
      "LineAmount": "4520.00",
      "LineNum": 1,
      "UQID": "PO26-000048-1",
      "InvoiceId": 36799,
      "LedgerVouch": "APV2601-0004",
      "InvoiceDate": null,
      "DueDate": "2026-04-01T05:00:00.000Z",
      "SumTax": 2407,
      "InvoiceAmou": null,
      "Currenc": "THB"
    },
    {
      "id": 6,
      "PurchReqId": "PR-2025-001",
      "PurchReqName": "สั่งซื้อคอมพิวเตอร์",
      "Originator": "Anuchit",
      "Description": "ต้องการสั่งซื้อคอมพิวเตอร์เพื่อใช้ในโปรเจค",
      "BusinessJustification": "เพิ่มประสิทธิภาพการทำงานของทีม",
      "TransDate": "2025-09-01T12:00:00.000Z",
      "RequiredDate": "2025-10-16T12:00:00.000Z",
      "repaireRequestId": "307",
      "PoId": null,
      "PrItemId": "FS-OIL004",
      "PrItemName": "น้ำมันไฮโดรลิค # 32",
      "PurchId": "PO26-000048",
      "PurchName": "ห้างหุ้นส่วนจำกัด มงคลไพศาลอุตสาหกรรม",
      "OrderAccount": "V001094",
      "ItemId": "SM-130611285-1",
      "ItemName": "BOSS",
      "PurchUnit": "PCS",
      "DeliveryDate": "2026-01-05T05:00:00.000Z",
      "AccountingDate": "2026-01-05T05:00:00.000Z",
      "DiscPercent": "0.00",
      "PurchQty": "1000.00",
      "PurchPrice": "11.80",
      "LineAmount": "11800.00",
      "LineNum": 2,
      "UQID": "PO26-000048-2",
      "InvoiceId": 36799,
      "LedgerVouch": "APV2601-0004",
      "InvoiceDate": null,
      "DueDate": "2026-04-01T05:00:00.000Z",
      "SumTax": 2407,
      "InvoiceAmou": null,
      "Currenc": "THB"
    },
    {
      "id": 6,
      "PurchReqId": "PR-2025-001",
      "PurchReqName": "สั่งซื้อคอมพิวเตอร์",
      "Originator": "Anuchit",
      "Description": "ต้องการสั่งซื้อคอมพิวเตอร์เพื่อใช้ในโปรเจค",
      "BusinessJustification": "เพิ่มประสิทธิภาพการทำงานของทีม",
      "TransDate": "2025-09-01T12:00:00.000Z",
      "RequiredDate": "2025-10-16T12:00:00.000Z",
      "repaireRequestId": "307",
      "PoId": null,
      "PrItemId": "FS-OIL004",
      "PrItemName": "น้ำมันไฮโดรลิค # 32",
      "PurchId": "PO26-000048",
      "PurchName": "ห้างหุ้นส่วนจำกัด มงคลไพศาลอุตสาหกรรม",
      "OrderAccount": "V001094",
      "ItemId": "SM-130610717A",
      "ItemName": "BOSS",
      "PurchUnit": "PCS",
      "DeliveryDate": "2026-01-05T05:00:00.000Z",
      "AccountingDate": "2026-01-05T05:00:00.000Z",
      "DiscPercent": "0.00",
      "PurchQty": "1600.00",
      "PurchPrice": "14.12",
      "LineAmount": "22592.00",
      "LineNum": 3,
      "UQID": "PO26-000048-3",
      "InvoiceId": 36799,
      "LedgerVouch": "APV2601-0004",
      "InvoiceDate": null,
      "DueDate": "2026-04-01T05:00:00.000Z",
      "SumTax": 2407,
      "InvoiceAmou": null,
      "Currenc": "THB"
    }
  ];

const COLUMNS = [
    { header: 'PurchReqId', key: 'PurchReqId', width: 16 },
    { header: 'PurchReqName', key: 'PurchReqName', width: 26 },
    { header: 'Originator', key: 'Originator', width: 16 },
    { header: 'TransDate', key: 'TransDate', width: 14, type: 'date' },
    { header: 'RequiredDate', key: 'RequiredDate', width: 14, type: 'date' },
    { header: 'PurchId', key: 'PurchId', width: 16 },
    { header: 'PurchName', key: 'PurchName', width: 34 },
    { header: 'OrderAccount', key: 'OrderAccount', width: 14 },
    { header: 'ItemId', key: 'ItemId', width: 14 },
    { header: 'ItemName', key: 'ItemName', width: 28 },
    { header: 'PurchQty', key: 'PurchQty', width: 12, type: 'number2' },
    { header: 'PurchPrice', key: 'PurchPrice', width: 12, type: 'number2' },
    { header: 'LineAmount', key: 'LineAmount', width: 14, type: 'number2' },
    { header: 'InvoiceId', key: 'InvoiceId', width: 14 },
    { header: 'InvoiceDate', key: 'InvoiceDate', width: 14, type: 'date' },
    { header: 'DueDate', key: 'DueDate', width: 14, type: 'date' },
    { header: 'SumTax', key: 'SumTax', width: 12, type: 'number0' },
];

function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function excelColumnLetter(index1Based) {
    let dividend = index1Based;
    let columnName = '';
    while (dividend > 0) {
        let modulo = (dividend - 1) % 26;
        columnName = String.fromCharCode(65 + modulo) + columnName;
        dividend = Math.floor((dividend - modulo) / 26);
    }
    return columnName;
}

async function exportExcelManageRepaireRequest(input, outputPath) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'nst-mam-web-app';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('ManageRepaireRequest', {
        views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = COLUMNS.map((c) => ({
        header: c.header,
        key: c.key,
        width: c.width,
    }));

    // Header styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
    headerRow.height = 15;
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF9CB3DF' } },
            left: { style: 'thin', color: { argb: 'FF9CB3DF' } },
            bottom: { style: 'thin', color: { argb: 'FF9CB3DF' } },
            right: { style: 'thin', color: { argb: 'FF9CB3DF' } },
        };
    });

    // Data rows with type conversion
    const rows = (Array.isArray(input) ? input : []).map((item) => {
        const row = { ...item };
        for (const col of COLUMNS) {
            if (col.type === 'date') row[col.key] = toDate(item[col.key]);
            if (col.type === 'number2' || col.type === 'number0') row[col.key] = toNumber(item[col.key]);
        }
        return row;
    });

    worksheet.addRows(rows);

    // Column formats
    // Note: Setting column alignment affects the header cell too, so we only right-align
    // numeric *data* cells (row 2+) and keep the header row left-aligned.
    for (const col of COLUMNS) {
        const excelCol = worksheet.getColumn(col.key);
        if (col.type === 'date') excelCol.numFmt = 'yyyy-mm-dd';
        if (col.type === 'number2') excelCol.numFmt = '#,##0.00';
        if (col.type === 'number0') excelCol.numFmt = '#,##0';
    }

    // Right-align numeric data cells (row 2+)
    for (const col of COLUMNS) {
        if (col.type !== 'number2' && col.type !== 'number0') continue;
        const colIndex = worksheet.getColumn(col.key).number;
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
            const cell = worksheet.getRow(rowNumber).getCell(colIndex);
            cell.alignment = { ...(cell.alignment || {}), horizontal: 'right', vertical: 'middle' };
        }
    }

    // Re-assert header alignment (in case any column-level formatting impacted it)
    headerRow.eachCell((cell) => {
        cell.alignment = { ...(cell.alignment || {}), vertical: 'middle', horizontal: 'left' };
    });

    // Borders for data cells
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // ข้าม header

        // กำหนดสีสลับ แถวคู่กับคี่
        const fillColor = rowNumber % 2 === 0 ? 'FFFFFFFF' : 'FFD9E1F2';

        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: fillColor },
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF9CB3DF' } },
                left: { style: 'thin', color: { argb: 'FF9CB3DF' } },
                bottom: { style: 'thin', color: { argb: 'FF9CB3DF' } },
                right: { style: 'thin', color: { argb: 'FF9CB3DF' } },
            };
            cell.alignment = cell.alignment || { vertical: 'middle' };
        });
    });

    // Auto filter
    const lastColLetter = excelColumnLetter(COLUMNS.length);
    worksheet.autoFilter = {
        from: 'A1',
        to: `${lastColLetter}1`,
    };

    const outputFile = outputPath || path.resolve(process.cwd(), 'manage-repaire-request.xlsx');
    await workbook.xlsx.writeFile(outputFile);
    return outputFile;
}

module.exports = {
    exportExcelManageRepaireRequest,
};

// Run directly: node src/utils/test-excel.js
if (require.main === module) {
    exportExcelManageRepaireRequest(sampleData)
        .then((outputFile) => {
            console.log(`Excel exported: ${outputFile}`);
        })
        .catch((err) => {
            console.error('Export failed:', err);
            process.exitCode = 1;
        });
}