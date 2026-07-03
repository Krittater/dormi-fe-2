/* eslint-disable no-unused-vars */
// import moment from 'moment';

import { DEFAULT_PDF_DOC_STYLES, MM_TO_PT } from '@/constants';
import PdfMake from '@/pdfmake/pdf-make.js';
import moment from 'moment';

var { ccyFormat } = require('@/utils');

function generateMockData({
    classCount = 1,
    assetPerClass = 1,
    poPerAsset = 1
} = {}) {
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const formatNumber = (num) =>
        num.toLocaleString('en-US', { minimumFractionDigits: 2 });
    const randDate = () => {
        const d = String(random(1, 28)).padStart(2, '0');
        const m = String(random(1, 12)).padStart(2, '0');
        const y = `20${String(random(10, 24))}`;
        return `${d}/${m}/${y}`;
    };

    const classes = [];
    for (let c = 0; c < classCount; c++) {
        const classObj = {
            ClassName: `${random(10000, 99999)} MACHINE-TYPE-${c + 1}`,
            Asset: []
        };
        for (let a = 0; a < assetPerClass; a++) {
            const assetObj = {
                name: `MC-${String(c).padStart(2, '0')}-${String(a).padStart(4, '0')} MACHINE-${random(100, 999)}`,
                Status: Math.random() > 0.2 ? "Active" : "Inactive",
                Location: `${random(100, 999)}-${String(random(1, 10)).padStart(2, '0')}`,
                DateAcquired: randDate(),
                Model: `MODEL-${random(1000, 9999)}`,
                Serial: `SN-${random(10000, 99999)}`,
                Tag: `TAG-${c}-${a}`,
                Proc: `P-${random(1, 999)}`,
                AgeY: Number((Math.random() * 20).toFixed(2)),
                PurchaseAmount: formatNumber(random(50000, 1000000)),
                PoList: []
            };
            for (let p = 0; p < poPerAsset; p++) {
                const mat = random(1000, 50000);
                const labor = 0
                const ovh = 0
                const issueDate = randDate();
                const invoiceDate = randDate();
                const warrantyStartDate = randDate();
                const warrantyEndDate = randDate();
                assetObj.PoList.push({
                    Seq: p + 1,
                    RepairRequestNo: `RR-${random(10000, 99999)}`,
                    IssueDate: issueDate,
                    IssueNo: `ISS-${random(10000, 99999)}`,
                    PoLine: `PO-${random(10000, 99999)}-${String(random(1, 99)).padStart(2, '0')}`,
                    InvoiceNo: `INV-${random(10000, 99999)}`,
                    InvoiceDate: invoiceDate,
                    WarrantyStartDate: warrantyStartDate,
                    WarrantyEndDate: warrantyEndDate,
                    VendorCode: `V${random(100000, 999999)}`,
                    VendorName: `Vendor-${random(1, 50)}`,
                    MatlAmt: mat,
                    Lbr: labor,
                    LaborAmt: labor,
                    Overhead: ovh,
                    OvhAmt: ovh,
                    Amount: mat + labor + ovh,
                    ItemDescription: `ITEM-${random(100, 999)} Mock repair ${random(1, 100)}`,
                });
            }
            classObj.Asset.push(assetObj);
        }
        classes.push(classObj);
    }
    return classes;
}

const ENABLE_REPORT_PDF_MOCK_DATA = false;
const MOCK_REPORT_DATA = generateMockData({ classCount: 3, assetPerClass: 4, poPerAsset: 20 });

const FONT_SIZES = {
    topLeft: 9,
    topRight: 12,
    header: 10,
    subHeader: 10,
    tableHeader: 9,
    tableContent: 8,
    bigText: 11,
    data: 7,
};

const AGE_BUCKET_COLUMNS = ['>5 Y', '4-5', '3-4', '2-3', '1-2', '<1Y'];
const EMPTY_CELL_PLACEHOLDER = '-';
const SINGLE_LINE_TEXT_LIMITS = {
    vendor: 36,
    description: 32,
};

const REPORT_LAYOUT_WIDTHS = {
    singleColumnSection: ['*'],
    header: {
        identity: ['auto', '*', 'auto'],
        classRange: ['*', '*'],
    },
    assetInfo: {
        rows: [
            [250, 110, '*'],
            [250, 85, 70, 60],
        ],
    },
    mainTable: {
        seq: 20,
        repairRequestNo: 115,
        issueDate: 48,
        issueNo: 55,
        poLine: 45,
        itemDescriptionLead: 45,
        itemDescriptionFlex: '*',
        overhead: 55,
        amountCost: 60,
    },
    purchaseRepairLabel: ['20%', '80%'],
    summaryTable: [50, 40, 50, 50, 50, 50, 50, 50, 50],
};

const DASHED_HEADER_LAYOUT = {
    hLineWidth: (lineIndex) => (lineIndex >= 0 && lineIndex <= 2 ? 0.5 : 0),
    vLineWidth: () => 0,
    hLineStyle: (lineIndex) => (lineIndex >= 0 && lineIndex <= 2 ? { dash: { length: 2, space: 3 } } : null),
    paddingLeft: () => 1,
    paddingRight: () => 1,
    paddingTop: () => 2,
    paddingBottom: () => 2,
};

const MAIN_TABLE_HEADER_ROWS = [
    [
        { text: 'Seq.' },
        { text: 'Repair Request No.' },
        { text: 'Issue Date' },
        { text: 'Issue No.' },
        { text: 'PO - Line' },
        { text: 'Invoice No.' },
        { text: 'Invoice Date' },
        { text: 'W Start Date', margin: [4, 0, 0, 0] },
        { text: 'W End Date', margin: [4, 0, 0, 0] },
    ],
    [
        { text: '' },
        { text: 'Vendor', colSpan: 2 },
        {},
        { text: 'MatlAmt', alignment: 'right' },
        { text: 'Lbr  ', alignment: 'right' },
        { text: 'Overhead', alignment: 'right' },
        { text: 'Amount Cost', alignment: 'right' },
        { text: 'Item & Description', colSpan: 2, margin: [4, 0, 0, 0] },
        {},
    ],
];

const PURCHASE_REPAIR_COLUMNS = [
    { text: 'Purchase', alignment: 'left', bold: true, margin: [20, 0, 0, 0] },
    { text: 'Repair Cost', alignment: 'left', bold: true, margin: [50, 0, 0, 0] },
];

function _ccyFormat(amount) {
    try {
        return ccyFormat(amount);
    } catch (e) {
        const n = Number(amount);
        if (Number.isFinite(n)) {
            return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return String(amount ?? '');
    }
}

function toNumber(value) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
        const normalized = value.replace(/,/g, '').trim();
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

function formatPercent(value) {
    return toNumber(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function firstDefined(source, keys, fallback = '') {
    for (const key of keys) {
        const value = source?.[key];
        if (typeof value === 'string' && value.trim() === '') {
            continue;
        }

        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
    }

    return fallback;
}

function hasMeaningfulValue(value) {
    if (value === undefined || value === null) {
        return false;
    }

    if (typeof value === 'string') {
        const normalizedValue = value.trim();
        return normalizedValue !== '' && normalizedValue !== EMPTY_CELL_PLACEHOLDER;
    }

    return true;
}

function readLayerCollection(source, keys) {
    if (Array.isArray(source)) {
        return source;
    }

    for (const key of keys) {
        if (Array.isArray(source?.[key])) {
            return source[key];
        }
    }

    return [];
}

function getReportClassListFromPayload(payload) {
    const directCollection = readLayerCollection(payload, [
        'assetHeaderWithInvoiceList',
        'classes',
        'ClassList',
        'classList',
        'items',
        'layers',
        'data',
    ]);

    if (directCollection.length > 0) {
        return directCollection;
    }

    const nestedDataCollection = readLayerCollection(payload?.data, [
        'assetHeaderWithInvoiceList',
        'classes',
        'ClassList',
        'classList',
        'items',
        'layers',
    ]);

    if (nestedDataCollection.length > 0) {
        return nestedDataCollection;
    }

    return [];
}

function normalizeReportData(payload) {
    const rootCollection = getReportClassListFromPayload(payload);
    if (rootCollection.length > 0) {
        return rootCollection;
    }

    if (payload && readLayerCollection(payload, ['Asset', 'asset', 'assets']).length > 0) {
        return [payload];
    }

    if (payload?.data && readLayerCollection(payload.data, ['Asset', 'asset', 'assets']).length > 0) {
        return [payload.data];
    }

    return ENABLE_REPORT_PDF_MOCK_DATA ? MOCK_REPORT_DATA : [];
}

function getAssetList(classItem) {
    return readLayerCollection(classItem, ['Asset', 'asset', 'assets', 'AssetList', 'children']);
}

function getPoList(asset) {
    return readLayerCollection(asset, ['PoList', 'poList', 'POList', 'poItems', 'details', 'children']);
}

function formatDate(value) {
    if (!value) {
        return EMPTY_CELL_PLACEHOLDER;
    }

    const asMoment = moment(value, ['DD/MM/YYYY', moment.ISO_8601, 'YYYY-MM-DD'], true);
    if (asMoment.isValid()) {
        return asMoment.format('DD/MM/YYYY');
    }

    return String(value);
}

function createMultilineText(primaryValue, secondaryValue) {
    return [primaryValue, secondaryValue].filter((value) => value !== '').join('\n');
}

function truncateSingleLineText(value, maxLength) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
        return EMPTY_CELL_PLACEHOLDER;
    }

    if (!Number.isFinite(maxLength) || maxLength <= 0 || normalizedValue.length <= maxLength) {
        return normalizedValue;
    }

    return normalizedValue.slice(0, Math.max(1, maxLength)).trimEnd();
}

function buildPoLineValue(poItem) {
    const directValue = firstDefined(poItem, ['PoLine', 'poLine'], '');
    if (hasMeaningfulValue(directValue)) {
        return directValue;
    }

    const poNumber = firstDefined(poItem, ['PoNum', 'poNum', 'PONumber'], '');
    const poLineNumber = firstDefined(poItem, ['PoLineNumber', 'poLineNumber', 'LineNum', 'lineNum'], '');

    if (hasMeaningfulValue(poNumber) && hasMeaningfulValue(poLineNumber)) {
        return `${poNumber}-${poLineNumber}`;
    }

    return hasMeaningfulValue(poNumber) ? poNumber : EMPTY_CELL_PLACEHOLDER;
}

function buildVendorValue(poItem) {
    const vendorCode = firstDefined(poItem, ['VendorCode', 'vendorCode'], '');
    const vendorName = firstDefined(poItem, ['VendorName', 'vendorName', 'Vendor', 'vendor'], '');

    if (hasMeaningfulValue(vendorCode) && hasMeaningfulValue(vendorName)) {
        return `${vendorCode}-${vendorName}`;
    }

    if (hasMeaningfulValue(vendorName)) {
        return vendorName;
    }

    if (hasMeaningfulValue(vendorCode)) {
        return vendorCode;
    }

    return EMPTY_CELL_PLACEHOLDER;
}

function buildItemDescriptionValue(poItem) {
    const itemCode = firstDefined(poItem, ['ItemCode', 'itemCode', 'ItemNo', 'itemNo'], '');
    const description = firstDefined(poItem, ['ItemDescription', 'itemDescription', 'Description', 'description'], '');

    if (hasMeaningfulValue(itemCode) && hasMeaningfulValue(description)) {
        return `${itemCode} ${description}`;
    }

    if (hasMeaningfulValue(itemCode)) {
        return itemCode;
    }

    if (hasMeaningfulValue(description)) {
        return description;
    }

    return EMPTY_CELL_PLACEHOLDER;
}

function formatClassTitle(classItem, classIndex) {
    const classCode = firstDefined(classItem, ['ClassCode', 'ClassNum', 'classCode', 'Code']);
    const className = firstDefined(classItem, ['ClassName', 'className', 'Name', 'name'], `CLASS-${classIndex + 1}`);
    return `Class : ${classCode ? `${classCode}   ` : ''}${className}`;
}

function buildAssetInfoRows(asset) {
    const assetName = firstDefined(asset, ['name', 'AssetName', 'assetName', 'AssetNum', 'assetNum'], EMPTY_CELL_PLACEHOLDER);
    const status = firstDefined(asset, ['Status', 'status'], EMPTY_CELL_PLACEHOLDER);
    const location = firstDefined(asset, ['Location', 'location'], EMPTY_CELL_PLACEHOLDER);
    const dateAcquired = formatDate(firstDefined(asset, ['DateAcquired', 'dateAcquired', 'AcquireDate'], EMPTY_CELL_PLACEHOLDER));
    const model = firstDefined(asset, ['Model', 'model'], EMPTY_CELL_PLACEHOLDER);
    const serial = firstDefined(asset, ['Serial', 'serial'], EMPTY_CELL_PLACEHOLDER);
    const tag = firstDefined(asset, ['Tag', 'tag'], EMPTY_CELL_PLACEHOLDER);
    const proc = firstDefined(asset, ['Proc', 'proc'], EMPTY_CELL_PLACEHOLDER);
    const ageYear = firstDefined(asset, ['AgeY', 'AgeYear', 'ageY', 'ageYear'], EMPTY_CELL_PLACEHOLDER);

    return [
        [
            { text: `Asset : ${assetName}`, bold: true },
            // { text: `Status: ${status}`, alignment: 'left' },
            { text: `Location : ${location}`, alignment: 'left' },
            { text: `Proc : ${proc}`, alignment: 'left' },
        ],
        [
            { text: `Date Acquired : ${dateAcquired}${model ? ` Model ${model}` : ''}`, alignment: 'left' },
            { text: `Serial : ${serial}`, alignment: 'left' },
            { text: `Tag : ${tag}`, alignment: 'left' },
            { text: `Age(Y) : ${ageYear}`, alignment: 'right' },
        ],
    ].map((row, rowIndex) => applyConfiguredWidths(row, REPORT_LAYOUT_WIDTHS.assetInfo.rows[rowIndex] || []));
}

function createPoDetailRow(poItem, sequence) {
    return {
        sequence: String(firstDefined(poItem, ['Seq', 'seq'], sequence + 1)),
        repairRequestNo: firstDefined(poItem, ['RepairRequestNo', 'repairRequestNo', 'RequestNo', 'requestNo'], EMPTY_CELL_PLACEHOLDER),
        issueDate: formatDate(firstDefined(poItem, ['IssueDate', 'issueDate', 'CreatedDate', 'createdDate'], EMPTY_CELL_PLACEHOLDER)),
        issueNo: firstDefined(poItem, ['IssueNo', 'issueNo', 'IssueDocumentNo', 'issueDocumentNo'], EMPTY_CELL_PLACEHOLDER),
        poLine: buildPoLineValue(poItem),
        invoiceNo: firstDefined(poItem, ['InvoiceNo', 'invoiceNo', 'InvNum', 'invNum', 'InvoiceNumber'], EMPTY_CELL_PLACEHOLDER),
        invoiceDate: formatDate(firstDefined(poItem, ['InvoiceDate', 'invoiceDate', 'InvDate', 'invDate'], EMPTY_CELL_PLACEHOLDER)),
        warrantyStartDate: formatDate(firstDefined(poItem, ['WarrantyStartDate', 'warrantyStartDate', 'StartDate', 'startDate'], EMPTY_CELL_PLACEHOLDER)),
        warrantyEndDate: formatDate(firstDefined(poItem, ['WarrantyEndDate', 'warrantyEndDate', 'EndDate', 'endDate'], EMPTY_CELL_PLACEHOLDER)),
    };
}

function createPoVendorSummary(poItem) {
    return {
        vendor: truncateSingleLineText(buildVendorValue(poItem), SINGLE_LINE_TEXT_LIMITS.vendor),
        poAmount: _ccyFormat(firstDefined(poItem, ['MatlAmt', 'matlAmt', 'MaterialAmount'], 0)),
        laborAmount: _ccyFormat(firstDefined(poItem, ['Lbr', 'lbr', 'LaborAmt', 'laborAmt', 'LaborAmount'], 0)),
        description: buildItemDescriptionValue(poItem),
        ovhAmount: _ccyFormat(firstDefined(poItem, ['Overhead', 'overhead', 'OvhAmt', 'ovhAmt', 'OverheadAmount'], 0)),
        amount: _ccyFormat(firstDefined(poItem, ['AmountCost', 'amountCost', 'Amount', 'amount'], 0)),
    };
}

function summarizeAssetTotals(poList) {
    return poList.reduce((summary, poItem) => {
        const materialAmount = toNumber(firstDefined(poItem, ['MatlAmt', 'matlAmt', 'MaterialAmount'], 0));
        const laborAmount = toNumber(firstDefined(poItem, ['Lbr', 'lbr', 'LaborAmt', 'laborAmt', 'LaborAmount'], 0));
        const overheadAmount = toNumber(firstDefined(poItem, ['Overhead', 'overhead', 'OvhAmt', 'ovhAmt', 'OverheadAmount'], 0));
        const totalAmount = toNumber(firstDefined(poItem, ['AmountCost', 'amountCost', 'Amount', 'amount'], materialAmount + laborAmount + overheadAmount));

        summary.poAmount += materialAmount;
        summary.laborAmount += laborAmount;
        summary.overheadAmount += overheadAmount;
        summary.totalAmount += totalAmount;

        return summary;
    }, {
        poAmount: 0,
        laborAmount: 0,
        overheadAmount: 0,
        totalAmount: 0,
    });
}

function getAssetTotalsFromResponse(asset) {
    const assetTotal = asset?.AssetTotal;
    if (assetTotal && (assetTotal.Amount !== null && assetTotal.Amount !== undefined)) {
        return {
            poAmount: toNumber(assetTotal.MatlAmt),
            laborAmount: toNumber(assetTotal.Lbr),
            overheadAmount: toNumber(assetTotal.Overhead),
            totalAmount: toNumber(assetTotal.Amount),
        };
    }
    const poList = getPoList(asset);
    return summarizeAssetTotals(poList);
}

function resolveAgeBucket(ageValue) {
    const age = toNumber(ageValue);

    if (age > 5) {
        return AGE_BUCKET_COLUMNS[0];
    }

    if (age >= 4) {
        return AGE_BUCKET_COLUMNS[1];
    }

    if (age >= 3) {
        return AGE_BUCKET_COLUMNS[2];
    }

    if (age >= 2) {
        return AGE_BUCKET_COLUMNS[3];
    }

    if (age >= 1) {
        return AGE_BUCKET_COLUMNS[4];
    }

    return AGE_BUCKET_COLUMNS[5];
}

function buildPurchaseRepairSummaryData(asset, totals) {
    const purchaseAmount = toNumber(firstDefined(asset, ['PurchaseAmount', 'purchaseAmount', 'PurchaseCost'], 0));
    const bucketKey = resolveAgeBucket(firstDefined(asset, ['AgeY', 'AgeYear', 'ageY', 'ageYear'], 0));
    const buckets = AGE_BUCKET_COLUMNS.reduce((result, key) => {
        result[key] = {
            material: 0,
            labor: 0,
            overhead: 0,
            total: 0,
        };
        return result;
    }, {});

    buckets[bucketKey] = {
        material: totals.poAmount,
        labor: totals.laborAmount,
        overhead: totals.overheadAmount,
        total: totals.totalAmount,
    };

    const totalAmount = totals.totalAmount;

    return [
        ['', '', ...AGE_BUCKET_COLUMNS, 'Total'],
        [
            purchaseAmount > 0 ? _ccyFormat(purchaseAmount) : '',
            'Matl Amt',
            ...AGE_BUCKET_COLUMNS.map((key) => buckets[key].material > 0 ? _ccyFormat(buckets[key].material) : ''),
            _ccyFormat(totals.poAmount),
        ],
        [
            '',
            'Lbr Amt',
            ...AGE_BUCKET_COLUMNS.map((key) => buckets[key].labor > 0 ? _ccyFormat(buckets[key].labor) : ''),
            _ccyFormat(totals.laborAmount),
        ],
        [
            '',
            'Ovh Amt',
            ...AGE_BUCKET_COLUMNS.map((key) => buckets[key].overhead > 0 ? _ccyFormat(buckets[key].overhead) : ''),
            _ccyFormat(totals.overheadAmount),
        ],
        [
            purchaseAmount > 0 ? _ccyFormat(purchaseAmount) : '',
            '',
            ...AGE_BUCKET_COLUMNS.map((key) => buckets[key].total > 0 ? _ccyFormat(buckets[key].total) : ''),
            _ccyFormat(totalAmount),
        ],
        [
            '',
            '% Repaire',
            ...AGE_BUCKET_COLUMNS.map((key) => buckets[key].total > 0 && totalAmount > 0 ? formatPercent((buckets[key].total / totalAmount) * 100) : ''),
            totalAmount > 0 ? '100.00' : '',
        ],
        [
            '',
            '% Repaire / Purchase Cost',
            '', '', '', '', '', '',
            purchaseAmount > 0 ? formatPercent((totalAmount / purchaseAmount) * 100) : '',
        ],
    ];
}

function createEmptyBucketTotals() {
    return AGE_BUCKET_COLUMNS.reduce((result, key) => {
        result[key] = {
            material: 0,
            labor: 0,
            overhead: 0,
            total: 0,
        };
        return result;
    }, {});
}

function summarizeReportPurchaseRepair(classList, allClassTotalCost) {
    const summary = {
        purchaseAmount: 0,
        poAmount: 0,
        laborAmount: 0,
        overheadAmount: 0,
        totalAmount: 0,
        buckets: createEmptyBucketTotals(),
    };

    classList.forEach((classItem) => {
        getAssetList(classItem).forEach((asset) => {
            const assetTotals = getAssetTotalsFromResponse(asset);
            const purchaseAmount = toNumber(firstDefined(asset, ['PurchaseAmount', 'purchaseAmount', 'PurchaseCost'], 0));
            const bucketKey = resolveAgeBucket(firstDefined(asset, ['AgeY', 'AgeYear', 'ageY', 'ageYear'], 0));

            summary.purchaseAmount += purchaseAmount;
            summary.poAmount += assetTotals.poAmount;
            summary.laborAmount += assetTotals.laborAmount;
            summary.overheadAmount += assetTotals.overheadAmount;
            summary.totalAmount += assetTotals.totalAmount;

            summary.buckets[bucketKey].material += assetTotals.poAmount;
            summary.buckets[bucketKey].labor += assetTotals.laborAmount;
            summary.buckets[bucketKey].overhead += assetTotals.overheadAmount;
            summary.buckets[bucketKey].total += assetTotals.totalAmount;
        });
    });

    if (allClassTotalCost) {
        if (allClassTotalCost.MatlAmt !== null && allClassTotalCost.MatlAmt !== undefined) {
            summary.poAmount = toNumber(allClassTotalCost.MatlAmt);
        }
        if (allClassTotalCost.Lbr !== null && allClassTotalCost.Lbr !== undefined) {
            summary.laborAmount = toNumber(allClassTotalCost.Lbr);
        }
        if (allClassTotalCost.Overhead !== null && allClassTotalCost.Overhead !== undefined) {
            summary.overheadAmount = toNumber(allClassTotalCost.Overhead);
        }
        if (allClassTotalCost.Amount !== null && allClassTotalCost.Amount !== undefined) {
            summary.totalAmount = toNumber(allClassTotalCost.Amount);
        }
    }

    return summary;
}

function buildReportPurchaseRepairSummaryRows(reportSummary) {
    return [
        ['', '', ...AGE_BUCKET_COLUMNS, 'Total'],
        [
            reportSummary.purchaseAmount > 0 ? _ccyFormat(reportSummary.purchaseAmount) : '',
            'Matl Amt',
            ...AGE_BUCKET_COLUMNS.map((key) => reportSummary.buckets[key].material > 0 ? _ccyFormat(reportSummary.buckets[key].material) : ''),
            _ccyFormat(reportSummary.poAmount),
        ],
        [
            '',
            'Lbr Amt',
            ...AGE_BUCKET_COLUMNS.map((key) => reportSummary.buckets[key].labor > 0 ? _ccyFormat(reportSummary.buckets[key].labor) : ''),
            _ccyFormat(reportSummary.laborAmount),
        ],
        [
            '',
            'Ovh Amt',
            ...AGE_BUCKET_COLUMNS.map((key) => reportSummary.buckets[key].overhead > 0 ? _ccyFormat(reportSummary.buckets[key].overhead) : ''),
            _ccyFormat(reportSummary.overheadAmount),
        ],
        [
            reportSummary.purchaseAmount > 0 ? _ccyFormat(reportSummary.purchaseAmount) : '',
            '',
            ...AGE_BUCKET_COLUMNS.map((key) => reportSummary.buckets[key].total > 0 ? _ccyFormat(reportSummary.buckets[key].total) : ''),
            _ccyFormat(reportSummary.totalAmount),
        ],
        [
            '',
            '% Repaire',
            ...AGE_BUCKET_COLUMNS.map((key) => reportSummary.buckets[key].total > 0 && reportSummary.totalAmount > 0
                ? formatPercent((reportSummary.buckets[key].total / reportSummary.totalAmount) * 100)
                : ''),
            reportSummary.totalAmount > 0 ? '100.00' : '',
        ],
        [
            '',
            '% Repaire / Purchase Cost',
            '', '', '', '', '', '',
            reportSummary.purchaseAmount > 0 ? formatPercent((reportSummary.totalAmount / reportSummary.purchaseAmount) * 100) : '',
        ],
    ];
}

function createTextCell(text, options = {}) {
    const { preserveEmpty = false, ...cellOptions } = options;

    return {
        text: preserveEmpty || (text !== undefined && text !== null && text !== '')
            ? text
            : EMPTY_CELL_PLACEHOLDER,
        bold: false,
        fontSize: FONT_SIZES.data,
        ...cellOptions,
    };
}

function getMainTableWidths() {
    const widths = REPORT_LAYOUT_WIDTHS.mainTable;

    return [
        widths.seq,
        widths.repairRequestNo,
        widths.issueDate,
        widths.issueNo,
        widths.poLine,
        widths.overhead,
        widths.amountCost,
        widths.itemDescriptionLead,
        widths.itemDescriptionFlex,
    ];
}

function applyConfiguredWidths(columns, widths) {
    return columns.map((column, index) => ({
        ...column,
        width: widths[index] ?? column.width ?? '*',
    }));
}

function cloneRow(row) {
    return row.map((cell) => ({ ...cell }));
}

function createMainTableHeaderRows() {
    return MAIN_TABLE_HEADER_ROWS.map((row) => row.map((cell) => ('text' in cell
        ? createTextCell(cell.text, { ...cell, preserveEmpty: cell.text === '' })
        : {})));
}

function createDetailRow(sequence, detail) {
    return [
        createTextCell(sequence),
        createTextCell(detail.repairRequestNo),
        createTextCell(detail.issueDate),
        createTextCell(detail.issueNo),
        createTextCell(detail.poLine),
        createTextCell(detail.invoiceNo),
        createTextCell(detail.invoiceDate),
        createTextCell(detail.warrantyStartDate),
        createTextCell(detail.warrantyEndDate),
    ];
}

function createVendorSummaryRow(summary) {
    return [
        createTextCell('', { preserveEmpty: true }),
        createTextCell(summary.vendor, { colSpan: 2, noWrap: true }),
        {},
        createTextCell(summary.poAmount, { alignment: 'right' }),
        createTextCell(summary.laborAmount, { alignment: 'right' }),
        createTextCell(summary.ovhAmount, { alignment: 'right' }),
        createTextCell(summary.amount, { alignment: 'right' }),
        createTextCell(summary.description, { colSpan: 2, noWrap: true }),
        {},
    ];
}

function buildMainTableRows(poList) {
    if (poList.length === 0) {
        return [[
            createTextCell('', { preserveEmpty: true, border: [false, false, false, false] }),
            createTextCell('No repair history', {
                colSpan: 8,
                alignment: 'center',
                border: [false, false, false, false],
            }),
            {},
            {},
            {},
            {},
            {},
            {},
            {},
        ]];
    }

    return poList.flatMap((poItem, index) => {
        const detailRow = createPoDetailRow(poItem, index);
        const vendorSummary = createPoVendorSummary(poItem);

        return [
            createDetailRow(detailRow.sequence, detailRow),
            createVendorSummaryRow(vendorSummary),
        ];
    });
}

function buildMainTableBlocks(rows) {
    const headerRows = createMainTableHeaderRows();
    return [{
        margin: [0, 5, 0, 0],
        table: {
            headerRows: headerRows.length,
            widths: getMainTableWidths(),
            body: [...headerRows.map((row) => cloneRow(row)), ...rows],
            dontBreakRows: true,
        },
        layout: DASHED_HEADER_LAYOUT,
    }];
}

function buildAssetInfoSection(asset) {
    return {
        margin: [0, 2, 0, 0],
        table: {
            headerRows: 0,
            widths: REPORT_LAYOUT_WIDTHS.singleColumnSection,
            body: buildAssetInfoRows(asset).map((row) => [
                {
                    stack: [
                        {
                            columns: row.map((column) => createTextCell(column.text, column)),
                            columnGap: 6,
                        },
                    ],
                    margin: [0, 0, 0, 0],
                },
            ]),
        },
        layout: {
            hLineWidth: (lineIndex) => (lineIndex === 0 ? 0.5 : 0),
            vLineWidth: () => 0,
            hLineStyle: (lineIndex) => (lineIndex === 0 ? { dash: { length: 2, space: 3 } } : null),
        },
        // layout: {
        //     hLineWidth: () => 0,
        //     vLineWidth: () => 0,
        // }
    };
}

function buildAssetClassTitle(classItem, classIndex, pageBreakBefore = false) {
    return {
        pageBreak: pageBreakBefore ? 'before' : undefined,
        table: {
            widths: REPORT_LAYOUT_WIDTHS.singleColumnSection,
            body: [[
                {
                    text: formatClassTitle(classItem, classIndex),
                    margin: [0, 0, 0, 2],
                    alignment: 'left',
                    fontSize: FONT_SIZES.bigText,
                    bold: true,
                }
            ]]
        },
        layout: {
            hLineWidth: (lineIndex, node) => (lineIndex === 0 ? 0.5 : 0),
            vLineWidth: () => 0,
            hLineStyle: (lineIndex, node) =>
                lineIndex === 0 || lineIndex === node.table.body.length ? { dash: { length: 2, space: 3 } } : null,
        },
    };
}

function buildAssetTotalSection(totals) {
    return {
        margin: [0, 5, 0, 0],
        table: {
            widths: getMainTableWidths(),
            body: [
                [
                    createTextCell('', { preserveEmpty: true, border: [false, false, false, false] }),
                    createTextCell('ASSET Total', {
                        colSpan: 2,
                        alignment: 'center',
                        border: [false, false, false, false],
                    }),
                    {},
                    createTextCell(_ccyFormat(totals.poAmount), { alignment: 'right', border: [false, true, false, true] }),
                    createTextCell(_ccyFormat(totals.laborAmount), { alignment: 'right', border: [false, true, false, true] }),
                    createTextCell(_ccyFormat(totals.overheadAmount), { alignment: 'right', border: [false, true, false, true] }),
                    createTextCell(_ccyFormat(totals.totalAmount), { alignment: 'right', border: [false, true, false, true] }),
                    createTextCell('', { preserveEmpty: true, border: [false, false, false, false] }),
                    createTextCell('', { preserveEmpty: true, border: [false, false, false, false] }),
                ],
            ],
        },
        layout: {
            vLineWidth: () => 0,
            hLineWidth: (lineIndex, node) => (lineIndex === 0 || lineIndex === node.table.body.length ? 1.5 : 0),
            hLineStyle: (lineIndex, node) =>
                lineIndex === 0 || lineIndex === node.table.body.length ? { dash: { length: 2, space: 2 } } : null,
            paddingLeft: () => 1,
            paddingRight: () => 1,
            paddingTop: () => 2,
            paddingBottom: () => 2,
        },
    };
}

function buildPurchaseRepairLabelRow() {
    return {
        margin: [0, 0, 0, 0],
        widths: REPORT_LAYOUT_WIDTHS.purchaseRepairLabel,
        columns: PURCHASE_REPAIR_COLUMNS.map((column) => createTextCell(column.text, column)),
    };
}

function createSummaryCell(value, columnIndex, rowIndex) {
    const cell = createTextCell(value, {
        alignment: columnIndex === 1 ? 'left' : 'right',
        preserveEmpty: rowIndex === 0,
    });

    if (columnIndex === 1 && rowIndex > 0) {
        cell.bold = true;
    }

    return cell;
}

function buildPurchaseRepairSummaryRows(summaryRows) {
    return summaryRows.map((row, rowIndex) => {
        if (rowIndex === 6) {
            return [
                createSummaryCell(row[0], 0, rowIndex),
                createTextCell(row[1], { alignment: 'left', bold: true, colSpan: 2 }),
                {},
                createSummaryCell(row[3], 3, rowIndex),
                createSummaryCell(row[4], 4, rowIndex),
                createSummaryCell(row[5], 5, rowIndex),
                createSummaryCell(row[6], 6, rowIndex),
                createSummaryCell(row[7], 7, rowIndex),
                createSummaryCell(row[8], 8, rowIndex),
            ];
        }

        return row.map((value, columnIndex) => createSummaryCell(value, columnIndex, rowIndex));
    });
}

function buildPurchaseRepairSummarySection(summaryRows) {
    return {
        margin: [0, 5, 0, 0],
        table: {
            widths: REPORT_LAYOUT_WIDTHS.summaryTable,
            body: buildPurchaseRepairSummaryRows(summaryRows),
        },
        layout: {
            hLineWidth: (lineIndex) => (lineIndex === 0 || lineIndex === 1 || lineIndex === 4 || lineIndex === 5 ? 0.5 : 0),
            vLineWidth: () => 0,
            hLineStyle: (lineIndex) =>
                lineIndex === 0 || lineIndex === 1 || lineIndex === 4 || lineIndex === 5
                    ? { dash: { length: 2, space: 3 } }
                    : null,
        },
    };
}

function getReportUserFromPayload(payload) {
    const resolvedUser = firstDefined(payload, [
        'USER',
        'User',
        'user',
        'CreatedBy',
        'createdBy',
    ], '');

    if (hasMeaningfulValue(resolvedUser)) {
        return resolvedUser;
    }

    return firstDefined(payload?.data, [
        'USER',
        'User',
        'user',
        'CreatedBy',
        'createdBy',
    ], '?');
}

function buildReportHeader(dateNow, timeNow, classList, payload) {
    const firstClass = classList[0];
    const lastClass = classList[classList.length - 1];
    const reportUser = getReportUserFromPayload(payload);
    const classFrom = firstClass ? firstDefined(firstClass, ['ClassCode', 'ClassName', 'classCode', 'className'], '?') : '?';
    const classTo = lastClass ? firstDefined(lastClass, ['ClassCode', 'ClassName', 'classCode', 'className'], '?') : '?';
    const [leftHeaderWidth, centerHeaderWidth, rightHeaderWidth] = REPORT_LAYOUT_WIDTHS.header.identity;
    const [classFromWidth, classToWidth] = REPORT_LAYOUT_WIDTHS.header.classRange;

    return (currentPage) => ({
        margin: [20, 10, 20, 0],
        stack: [
            {
                columns: [
                    {
                        text: `User : ${reportUser}`,
                        fontSize: FONT_SIZES.topLeft,
                        alignment: 'left',
                        width: leftHeaderWidth,
                        margin: [0, 0, 0, 0],
                    },
                    {
                        text: 'NEW SOMTHAI MOTOR WORK CO.,LTD. \n Fixed Asset Cost By Asset Num',
                        fontSize: FONT_SIZES.header,
                        alignment: 'center',
                        width: centerHeaderWidth,
                        margin: [0, 0, 0, 0],
                    },
                    {
                        text: `${dateNow}   ${timeNow} \n Page ${currentPage}`,
                        fontSize: FONT_SIZES.topLeft,
                        alignment: 'right',
                        width: rightHeaderWidth,
                        margin: [0, 0, 0, 0],
                    },
                ],
                columnGap: 8,
            },
            {
                columns: [
                    { text: `Class : ${classFrom}`, fontSize: FONT_SIZES.data, alignment: 'center', width: classFromWidth, margin: [0, 0, 0, 0] },
                    { text: `To : ${classTo}`, fontSize: FONT_SIZES.data, alignment: 'center', width: classToWidth, margin: [0, 0, 0, 0] },
                ],
            },
        ],
    });
}

function buildReportContent(payload) {
    const classList = normalizeReportData(payload);
    const allClassTotalCost = payload?.data?.allClassTotalCost ?? payload?.allClassTotalCost ?? null;
    const reportSummary = summarizeReportPurchaseRepair(classList, allClassTotalCost);
    const sections = classList.flatMap((classItem, classIndex) => {
        const assetList = getAssetList(classItem);
        const classSections = [buildAssetClassTitle(classItem, classIndex, classIndex > 0)];

        if (assetList.length === 0) {
            classSections.push({
                margin: [0, 8, 0, 0],
                text: 'No asset data',
                fontSize: FONT_SIZES.data,
            });
            return classSections;
        }

        assetList.forEach((asset) => {
            const poList = getPoList(asset);
            const totals = getAssetTotalsFromResponse(asset);

            classSections.push(buildAssetInfoSection(asset));
            classSections.push(...buildMainTableBlocks(buildMainTableRows(poList)));
            classSections.push(buildAssetTotalSection(totals));
        });

        return classSections;
    });

    sections.push(buildPurchaseRepairLabelRow());
    sections.push(buildPurchaseRepairSummarySection(buildReportPurchaseRepairSummaryRows(reportSummary)));

    return sections;
}

async function generateReportOne(payload) {
    const dateNow = moment().format('DD/MM/YYYY');
    const timeNow = moment().format('h:mm:ssA');
    const classList = normalizeReportData(payload);

    try {
        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: [5, 50, 5, 20],
            styles: {
                ...DEFAULT_PDF_DOC_STYLES,
            },
            header: buildReportHeader(dateNow, timeNow, classList, payload),
            content: buildReportContent(payload),
        };

        const createPDF = await PdfMake.pdfMake.createPdf(docDefinition);
        createPDF.open();

        return { status: 'success', message: 'generateReportOne success' };
    } catch (error) {
        console.error('generateReportOne error --> ', error);
        return { status: 'error', message: 'generateReportOne error ' + error.message };
    }
}

export { generateReportOne };