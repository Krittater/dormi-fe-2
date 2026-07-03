const ExcelJS = require('exceljs');
import { saveAs } from 'file-saver';
import moment from 'moment';

const OLD_HISTORY_IMPORT_STATUS_META = Object.freeze({
  success: { label: 'สำเร็จ', color: 'success' },
  partial: { label: 'สำเร็จบางส่วน', color: 'warning' },
  skipped: { label: 'ข้าม', color: 'warning' },
  failed: { label: 'ล้มเหลว', color: 'error' },
  pending: { label: 'รอดำเนินการ', color: 'info' },
  not_applicable: { label: 'ไม่เกี่ยวข้อง', color: 'secondary' },
  inserted: { label: 'Inserted', color: 'success' },
  already_exists: { label: 'Existing', color: 'info' },
  duplicate_in_payload: { label: 'Duplicate', color: 'warning' },
  missing_key: { label: 'Missing Key', color: 'error' },
  skipped_key: { label: 'Skipped', color: 'warning' },
});

const OLD_HISTORY_IMPORT_STEP_LABELS = Object.freeze({
  repairRequest: 'Repair Request',
  purchaseRequisitionLine: 'PR Line',
  purchaseOrderLine: 'PO Line',
  invoice: 'Invoice',
  purchaseOrderInvoiceLink: 'PO-Invoice Link',
  movementJournal: 'Movement Journal',
});

const EXCEL_THEME = Object.freeze({
  headerFill: 'FFFF00',
  headerFont: '000000',
  summaryAccentFill: 'D9E2F3',
  summaryAccentFont: '1F1F1F',
  borderColor: 'BFBFBF',
});

const getOldHistoryImportStatusMeta = (status) => {
  return OLD_HISTORY_IMPORT_STATUS_META[status] || {
    label: status || '-',
    color: 'secondary',
  };
};

const autoFitWorksheetColumns = (worksheet, minimumWidth = 14) => {
  worksheet.columns.forEach((column) => {
    let maxLength = minimumWidth;

    column.eachCell({ includeEmpty: true }, (cell) => {
      const rawValue = cell.value;
      const cellValue = rawValue && typeof rawValue === 'object' && rawValue.richText
        ? rawValue.richText.map((item) => item.text).join('')
        : rawValue;
      const columnLength = String(cellValue || '').length;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });

    column.width = Math.min(maxLength + 2, 48);
  });
};

const applyCellBorder = (cell) => {
  cell.border = {
    top: { style: 'thin', color: { argb: EXCEL_THEME.borderColor } },
    left: { style: 'thin', color: { argb: EXCEL_THEME.borderColor } },
    bottom: { style: 'thin', color: { argb: EXCEL_THEME.borderColor } },
    right: { style: 'thin', color: { argb: EXCEL_THEME.borderColor } },
  };
};

const styleHeaderRow = (worksheet, rowNumber = 1) => {
  const row = worksheet.getRow(rowNumber);

  row.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: EXCEL_THEME.headerFont },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_THEME.headerFill },
    };
    applyCellBorder(cell);
  });
};

const styleWorksheetBody = (worksheet, startRow = 2) => {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) {
      return;
    }

    row.eachCell((cell) => {
      cell.alignment = {
        vertical: 'top',
        horizontal: 'left',
        wrapText: true,
      };
      applyCellBorder(cell);
    });
  });
};

const styleSummarySectionRow = (worksheet, rowNumber) => {
  const row = worksheet.getRow(rowNumber);

  row.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: EXCEL_THEME.summaryAccentFont },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_THEME.summaryAccentFill },
    };
    applyCellBorder(cell);
  });
};

const addAutoFilter = (worksheet) => {
  if (!worksheet.columnCount || worksheet.rowCount < 1) {
    return;
  }

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount },
  };
};

export const exportOldHistoryImportResultExcel = async ({ result, tableRows }) => {
  const workbook = new ExcelJS.Workbook();
  const summaryWorksheet = workbook.addWorksheet('Import Summary');
  const detailWorksheet = workbook.addWorksheet('Row Results');
  const exportTimestamp = moment().format('YYYYMMDD_HHmmss');
  const generatedAt = moment().format('YYYY-MM-DD HH:mm:ss');

  summaryWorksheet.columns = [
    { header: 'หัวข้อ', key: 'label', width: 30 },
    { header: 'ค่า', key: 'value', width: 24 },
  ];
  summaryWorksheet.addRows([
    { label: 'Generated At', value: generatedAt },
    { label: 'File Name', value: result.receivedFileName || '-' },
    { label: 'Import State', value: result.state ? 'success' : 'failed' },
    { label: 'Message', value: result.message || '-' },
    { label: 'Received Rows Count', value: result.receivedRowsCount || 0 },
    { label: 'Matched Company Asset Count', value: result.matchedCompanyAssetCount || 0 },
    { label: 'Missing Sub Item Count', value: result.missingSubItemCount || 0 },
  ]);

  summaryWorksheet.addRow({});
  summaryWorksheet.addRow({ label: 'Row Status Summary', value: '' });
  const rowStatusSummaryTitleRow = summaryWorksheet.lastRow?.number;
  Object.entries(result.rowStatusSummary || {}).forEach(([key, value]) => {
    summaryWorksheet.addRow({ label: getOldHistoryImportStatusMeta(key).label, value });
  });

  summaryWorksheet.addRow({});
  summaryWorksheet.addRow({ label: 'Import Step Summary', value: '' });
  const importStepSummaryTitleRow = summaryWorksheet.lastRow?.number;
  Object.keys(OLD_HISTORY_IMPORT_STEP_LABELS).forEach((key) => {
    const item = result.importSummary?.[key];
    if (!item) {
      return;
    }

    summaryWorksheet.addRow({ label: `${OLD_HISTORY_IMPORT_STEP_LABELS[key]} - Inserted`, value: item.insertedCount || 0 });
    summaryWorksheet.addRow({ label: `${OLD_HISTORY_IMPORT_STEP_LABELS[key]} - Existing`, value: item.skippedExistingCount || 0 });
    summaryWorksheet.addRow({ label: `${OLD_HISTORY_IMPORT_STEP_LABELS[key]} - Duplicate`, value: item.skippedDuplicateCount || 0 });
    summaryWorksheet.addRow({ label: `${OLD_HISTORY_IMPORT_STEP_LABELS[key]} - Missing Key`, value: item.skippedMissingKeyCount || 0 });
  });

  detailWorksheet.columns = [
    { header: '#', key: 'rowNo', width: 8 },
    { header: 'Doc ID', key: 'docId', width: 18 },
    { header: 'Asset Code', key: 'assetCode', width: 18 },
    { header: 'Sub Item', key: 'subItem', width: 14 },
    { header: 'Sub Item Description', key: 'subItemDescription', width: 22 },
    { header: 'Overall Status', key: 'statusLabel', width: 18 },
    { header: 'Summary', key: 'summary', width: 42 },
    { header: 'Warnings', key: 'warningsText', width: 42 },
    { header: 'Repair Request Status', key: 'repairRequestStatus', width: 18 },
    { header: 'Repair Request Key', key: 'repairRequestKey', width: 28 },
    { header: 'Repair Request Reason', key: 'repairRequestReason', width: 30 },
    { header: 'PR Line Status', key: 'purchaseRequisitionLineStatus', width: 18 },
    { header: 'PR Line Key', key: 'purchaseRequisitionLineKey', width: 28 },
    { header: 'PR Line Reason', key: 'purchaseRequisitionLineReason', width: 30 },
    { header: 'PO Line Status', key: 'purchaseOrderLineStatus', width: 18 },
    { header: 'PO Line Key', key: 'purchaseOrderLineKey', width: 28 },
    { header: 'PO Line Reason', key: 'purchaseOrderLineReason', width: 30 },
    { header: 'Invoice Status', key: 'invoiceStatus', width: 18 },
    { header: 'Invoice Key', key: 'invoiceKey', width: 28 },
    { header: 'Invoice Reason', key: 'invoiceReason', width: 30 },
    { header: 'PO-Invoice Link Status', key: 'purchaseOrderInvoiceLinkStatus', width: 18 },
    { header: 'PO-Invoice Link Key', key: 'purchaseOrderInvoiceLinkKey', width: 30 },
    { header: 'PO-Invoice Link Reason', key: 'purchaseOrderInvoiceLinkReason', width: 32 },
    { header: 'Movement Journal Status', key: 'movementJournalStatus', width: 18 },
    { header: 'Movement Journal Key', key: 'movementJournalKey', width: 24 },
    { header: 'Movement Journal Reason', key: 'movementJournalReason', width: 30 },
  ];

  detailWorksheet.addRows(
    tableRows.map((item) => ({
      rowNo: item.rowNo,
      docId: item.docId,
      assetCode: item.assetCode,
      subItem: item.subItem,
      subItemDescription: item.subItemDescription,
      statusLabel: getOldHistoryImportStatusMeta(item.status).label,
      summary: item.summary,
      warningsText: item.warningsText,
      repairRequestStatus: getOldHistoryImportStatusMeta(item.repairRequest.status).label,
      repairRequestKey: item.repairRequest.key || '',
      repairRequestReason: item.repairRequest.reason || '',
      purchaseRequisitionLineStatus: getOldHistoryImportStatusMeta(item.purchaseRequisitionLine.status).label,
      purchaseRequisitionLineKey: item.purchaseRequisitionLine.key || '',
      purchaseRequisitionLineReason: item.purchaseRequisitionLine.reason || '',
      purchaseOrderLineStatus: getOldHistoryImportStatusMeta(item.purchaseOrderLine.status).label,
      purchaseOrderLineKey: item.purchaseOrderLine.key || '',
      purchaseOrderLineReason: item.purchaseOrderLine.reason || '',
      invoiceStatus: getOldHistoryImportStatusMeta(item.invoice.status).label,
      invoiceKey: item.invoice.key || '',
      invoiceReason: item.invoice.reason || '',
      purchaseOrderInvoiceLinkStatus: getOldHistoryImportStatusMeta(item.purchaseOrderInvoiceLink.status).label,
      purchaseOrderInvoiceLinkKey: item.purchaseOrderInvoiceLink.key || '',
      purchaseOrderInvoiceLinkReason: item.purchaseOrderInvoiceLink.reason || '',
      movementJournalStatus: getOldHistoryImportStatusMeta(item.movementJournal.status).label,
      movementJournalKey: item.movementJournal.key || '',
      movementJournalReason: item.movementJournal.reason || '',
    }))
  );

  styleHeaderRow(summaryWorksheet, 1);
  styleHeaderRow(detailWorksheet, 1);
  styleWorksheetBody(summaryWorksheet, 2);
  styleWorksheetBody(detailWorksheet, 2);

  if (rowStatusSummaryTitleRow) {
    styleSummarySectionRow(summaryWorksheet, rowStatusSummaryTitleRow);
  }

  if (importStepSummaryTitleRow) {
    styleSummarySectionRow(summaryWorksheet, importStepSummaryTitleRow);
  }

  addAutoFilter(summaryWorksheet);
  addAutoFilter(detailWorksheet);

  summaryWorksheet.views = [{ state: 'frozen', ySplit: 1 }];
  detailWorksheet.views = [{ state: 'frozen', ySplit: 1 }];

  [summaryWorksheet, detailWorksheet].forEach((worksheet) => {
    autoFitWorksheetColumns(worksheet);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Log-Dump-History-${exportTimestamp}.xlsx`);
};