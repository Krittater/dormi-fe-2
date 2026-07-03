function ensureStore(store) {
  if (!store || typeof store.dispatch !== 'function') {
    throw new Error('Store is not available');
  }
}

function formatUniquePurchReqIds(list) {
  const result = [];
  const seen = new Set();

  for (const item of Array.isArray(list) ? list : []) {
    const id = item?.PurchReqId;
    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    result.push({ PurchReqId: id });
  }

  return result;
}

function normalizePurchaseOrderLines(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function expandPOInvoiceLines(input) {
  const result = [];
  const poLines = Array.isArray(input)
    ? input
    : Array.isArray(input?.data)
      ? input.data
      : [];
  const processedCombos = new Set();

  const buildComboKey = (poLine, invoice) => {
    const poUq = poLine?.UQID ?? 'NO_PO_UQID';
    if (!invoice) {
      return `${poUq}_NO_INVOICE`;
    }

    const invUq = invoice?.UQID ?? invoice?.InvoiceId ?? 'NO_INV_UQID';
    return `${poUq}_${invUq}`;
  };

  for (const poLine of poLines) {
    const invoiceList = poLine.InvoiceList || [];

    if (invoiceList.length === 0) {
      const key = buildComboKey(poLine, null);

      if (!processedCombos.has(key)) {
        processedCombos.add(key);
        result.push({
          PurchId: poLine.PurchId,
          OrderAccount: poLine.OrderAccount,
          PurchName: poLine.PurchName,
          ItemId: poLine.ItemId,
          ItemName: poLine.ItemName,
          PurchUnit: poLine.PurchUnit,
          POLineUQ: poLine.UQID,
          InvoiceLineUQ: null,
          LineNum: poLine.LineNum,
          PurchQty: poLine.PurchQty,
          PurchPrice: poLine.PurchPrice,
          LineAmount: poLine.LineAmount,
          DeliveryDate: poLine.DeliveryDate,
          AccountingDate: poLine.AccountingDate,
          InvoiceId: null,
          LedgerVoucher: null,
          InvoiceDate: null,
          DueDate: null,
          SumTax: null,
          InvoiceAmount: null,
        });
      }

      continue;
    }

    for (const invoice of invoiceList) {
      const key = buildComboKey(poLine, invoice);

      if (!processedCombos.has(key)) {
        processedCombos.add(key);
        result.push({
          PurchId: poLine.PurchId,
          OrderAccount: poLine.OrderAccount,
          PurchName: poLine.PurchName,
          ItemId: poLine.ItemId,
          ItemName: poLine.ItemName,
          PurchUnit: poLine.PurchUnit,
          POLineUQ: poLine.UQID,
          InvoiceLineUQ: invoice.UQID,
          LineNum: poLine.LineNum,
          PurchQty: poLine.PurchQty,
          PurchPrice: poLine.PurchPrice,
          LineAmount: poLine.LineAmount,
          DeliveryDate: poLine.DeliveryDate,
          AccountingDate: poLine.AccountingDate,
          InvoiceId: invoice.InvoiceId,
          LedgerVoucher: invoice.LedgerVoucher,
          InvoiceDate: invoice.InvoiceDate,
          DueDate: invoice.DueDate,
          SumTax: invoice.SumTax,
          InvoiceAmount: invoice.InvoiceAmount,
          CurrencyCode: invoice.CurrencyCode,
        });
      }
    }
  }

  return result;
}

function processPoLinesPreSave(rawData) {
  return rawData.map((line) => ({
    LineNum: line.LineNum,
    UQID: line.UQID,
    PurchId: line.PurchId,
    OrderAccount: line.OrderAccount,
    PurchName: line.PurchName,
    ItemId: line.ItemId,
    ItemName: line.ItemName,
    PurchUnit: line.PurchUnit,
    DeliveryDate: line.DeliveryDate,
    DiscPercent: line.DiscPercent,
    AccountingDate: line.AccountingDate,
    RecId: line.RecId,
    PurchQty: line.PurchQty,
    PurchPrice: line.PurchPrice,
    LineAmount: line.LineAmount,
    PrLineUQ: line.PrLineUQ,
  }));
}

function processInvoicesPreSave(rawData) {
  const map = new Map();

  for (const line of rawData) {
    for (const inv of line.InvoiceList || []) {
      if (!map.has(inv.UQID)) {
        map.set(inv.UQID, {
          PurchId: inv.PurchId,
          InvoiceId: inv.InvoiceId,
          UQID: inv.UQID,
          LedgerVoucher: inv.LedgerVoucher,
          CurrencyCode: inv.CurrencyCode,
          InvoiceDate: inv.InvoiceDate,
          DueDate: inv.DueDate,
          RecId: inv.RecId,
          SumTax: inv.SumTax,
          InvoiceAmount: inv.InvoiceAmount,
          LineNumber: inv.LineNumber,
          ItemId: inv.ItemId,
          ItemName: inv.ItemName,
          Description: inv.Description,
          LineAmount: inv.LineAmount,
          Qty: inv.Qty,
          PurchPrice: inv.PurchPrice,
        });
      }
    }
  }

  return Array.from(map.values());
}

function processPoLineInvoiceMap(rawData) {
  const result = [];

  for (const line of rawData) {
    for (const inv of line.InvoiceList || []) {
      result.push({
        purchaseOrderUQID: line.UQID,
        InvoiceUQID: inv.UQID,
      });
    }
  }

  return result;
}

function buildInvoiceSavePayload(rawData) {
  return {
    poLines: processPoLinesPreSave(rawData),
    invoices: processInvoicesPreSave(rawData),
    poLineInvoiceMap: processPoLineInvoiceMap(rawData),
  };
}

async function fetchInvoiceDataFromD365(store, purchaseRequisitionList) {
  ensureStore(store);

  const normalizedPurchaseRequisitionList = Array.isArray(purchaseRequisitionList) ? purchaseRequisitionList : [];
  if (normalizedPurchaseRequisitionList.length === 0) {
    throw new Error('ไม่มีการเปิดPR ในการซ่อม');
  }

  const purchaseReqIdList = formatUniquePurchReqIds(normalizedPurchaseRequisitionList);
  if (purchaseReqIdList.length === 0) {
    throw new Error('ไม่พบเลขที่ PR สำหรับดึงข้อมูลจาก D365');
  }

  const response = await store.dispatch('purchaseOrderD365/getOne', {
    purchaseRequisitionList: purchaseReqIdList,
  });

  if (response === null) {
    throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลจาก D365');
  }

  const poLines = normalizePurchaseOrderLines(response);
  const expandedLines = expandPOInvoiceLines(poLines);

  if (expandedLines.length === 0) {
    throw new Error('ไม่พบข้อมูล PO/Invoice จาก D365');
  }

  return {
    poLines,
    expandedLines,
  };
}

async function saveInvoiceDataToDatabase(store, rawData) {
  ensureStore(store);

  const normalizedRawData = Array.isArray(rawData) ? rawData : [];
  if (normalizedRawData.length === 0) {
    throw new Error('ไม่มีข้อมูล PO/Invoice สำหรับบันทึก');
  }

  const payload = buildInvoiceSavePayload(normalizedRawData);
  const response = await store.dispatch('serviceCreateVendInvoiceJoursPurchaseOrders/createNew', payload);

  if (!response?.state) {
    throw new Error(response?.message || 'บันทึกไม่สำเร็จ');
  }

  return {
    payload,
    response,
  };
}

async function fetchAndSaveInvoiceDataFromD365(store, purchaseRequisitionList) {
  const { poLines, expandedLines } = await fetchInvoiceDataFromD365(store, purchaseRequisitionList);
  const { payload, response } = await saveInvoiceDataToDatabase(store, poLines);

  return {
    poLines,
    expandedLines,
    payload,
    response,
  };
}

export {
  expandPOInvoiceLines,
  fetchAndSaveInvoiceDataFromD365,
  fetchInvoiceDataFromD365,
  saveInvoiceDataToDatabase,
};