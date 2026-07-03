import moment from 'moment';
import * as XLSX from 'xlsx';

const ISO_DATE_FORMAT = 'YYYY-MM-DD';
const EXCEL_SERIAL_EPOCH = moment.utc('1899-12-30', ISO_DATE_FORMAT, true);
const SUPPORTED_DATE_FORMATS = [
	ISO_DATE_FORMAT,
	'YYYY/M/D',
	'YYYY.M.D',
	'D/M/YYYY',
	'D-M-YYYY',
	'D.M.YYYY',
];

const IMPORT_OLD_REPAIR_HISTORY_SCHEMA = Object.freeze([
	{
		key: 'docId',
		headers: ['DocId', 'Doc ID', 'Document Id', 'DocumentID'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'assetGroups',
		headers: ['Asset Groups', 'AssetGroups', 'Asset Group'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'assetGroupsDescription',
		headers: ['Asset Groups Description', 'AssetGroup Description', 'Asset Groups Desc', 'AssetGroupDescription'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'subItem',
		headers: ['SubItem', 'Sub Item', 'Sub-Item'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'subItemDescription',
		headers: ['SubItem Description', 'Sub Item Description', 'SubItem Desc', 'SubItemDescription'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'assetCode',
		headers: ['AssetCode', 'Asset Code', 'Asset code'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'startDate',
		headers: ['Start Date', 'StartDate'],
		type: 'date',
		defaultValue: null,
	},
	{
		key: 'successDate',
		headers: ['Success Date', 'SuccessDate'],
		type: 'date',
		defaultValue: null,
	},
	{
		key: 'completedDate',
		headers: ['Completed Date', 'CompletedDate'],
		type: 'date',
		defaultValue: null,
	},
	{
		key: 'createdAt',
		headers: ['CreatedAt', 'Created At', 'Created Date'],
		type: 'date',
		defaultValue: null,
	},
	{
		key: 'acquisitionPrice',
		headers: ['AcquisitionPrice', 'Acquisition Price', 'Acquisition price'],
		type: 'number',
		defaultValue: null,
	},
	{
		key: 'vendNum',
		headers: ['vend_num', 'Vend Num', 'Vendor Number', 'VendNum'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'pr',
		headers: ['PR', 'Pr'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'po',
		headers: ['PO', 'Purchase Order', 'PurchaseOrder', 'PO Number'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'poLine',
		headers: ['PO Line', 'PO No Line', 'PO Line No', 'PO Line Number', 'POLine'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'poSl',
		headers: ['PO SL', 'PO SL No', 'POSL', 'PO_SL'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'poSlLine',
		headers: ['PO SL Line', 'PO SL Line No', 'POSLLine', 'PO_SL_LINE'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'journalId',
		headers: ['JournalId', 'Journal ID', 'Journal Id'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'invoice',
		headers: ['Invoice', 'Invoice Id', 'Invoice ID', 'Invoice No', 'Invoice Number'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'journalSlId',
		headers: ['Journal SL Id', 'Journal SL ID', 'JournalSLId', 'Journal SL'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'warrantyMonths',
		headers: ['จำนวนเดือนรับประกัน', 'Warranty Months', 'Warranty Month'],
		type: 'number',
		defaultValue: null,
	},
	{
		key: 'employeeId',
		headers: ['Employee Id', 'EmployeeID', 'Employee Id ', 'EmployeeId'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'employeeName',
		headers: ['Employee Name', 'EmployeeName', 'Employee name'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'invoiceDate',
		headers: ['Invoice Date', 'InvoiceDate', 'Invoice date'],
		type: 'date',
		defaultValue: null,
	},
	{
		key: 'costType',
		headers: ['cost_type', 'Cost Type', 'CostType', 'cost type'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'repairType',
		headers: ['RepairType', 'Repair Type'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'mainReason',
		headers: ['เหตุผลหลัก', 'Reason Main', 'Main Reason'],
		type: 'string',
		defaultValue: '',
	},
	{
		key: 'repairCost',
		headers: ['ราคาซ่อม', 'ราคาซ่อม ', 'Repair Cost', 'RepairCost'],
		type: 'number',
		defaultValue: null,
	},
]);

function normalizeHeader(header) {
	return String(header || '')
		.normalize('NFKC')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}

function compactHeader(header) {
	return normalizeHeader(header).replace(/\s+/g, '');
}

function getHeaderValue(row, headers) {
	const normalizedHeaders = headers.map((header) => normalizeHeader(header));
	const compactHeaders = headers.map((header) => compactHeader(header));

	for (const [rawKey, value] of Object.entries(row || {})) {
		const normalizedRawKey = normalizeHeader(rawKey);
		const compactRawKey = compactHeader(rawKey);

		if (normalizedHeaders.includes(normalizedRawKey) || compactHeaders.includes(compactRawKey)) {
			return value;
		}
	}

	return undefined;
}

function normalizeString(value, defaultValue = '') {
	if (value === null || value === undefined) {
		return defaultValue;
	}

	return String(value).trim();
}

function normalizeNumber(value, defaultValue = null) {
	if (value === null || value === undefined || value === '') {
		return defaultValue;
	}

	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	const normalizedValue = String(value).replace(/,/g, '').trim();
	if (!normalizedValue) {
		return defaultValue;
	}

	const parsedNumber = Number(normalizedValue);
	return Number.isFinite(parsedNumber) ? parsedNumber : defaultValue;
}

function convertExcelSerialDate(serial) {
	if (!Number.isFinite(serial)) {
		return null;
	}

	const parsedDate = EXCEL_SERIAL_EPOCH.clone().add(serial, 'days');
	if (!parsedDate.isValid()) {
		return null;
	}

	return parsedDate;
}

function buildUtcDate(year, month, day) {
	const parsedDate = moment.utc({
		year,
		month: month - 1,
		date: day,
	});

	if (!parsedDate.isValid()) {
		return null;
	}

	if (parsedDate.year() !== year || parsedDate.month() !== month - 1 || parsedDate.date() !== day) {
		return null;
	}

	return parsedDate;
}

function parseDateString(value) {
	const normalizedValue = String(value || '').trim();
	if (!normalizedValue) {
		return null;
	}

	const datePart = normalizedValue.split(/\s+/)[0];
	const strictMatch = moment.utc(datePart, SUPPORTED_DATE_FORMATS, true);
	if (strictMatch.isValid()) {
		return strictMatch;
	}

	const yearFirstMatch = datePart.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
	if (yearFirstMatch) {
		const [, year, month, day] = yearFirstMatch;
		return buildUtcDate(Number(year), Number(month), Number(day));
	}

	const dayFirstMatch = datePart.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
	if (dayFirstMatch) {
		const [, day, month, year] = dayFirstMatch;
		return buildUtcDate(Number(year), Number(month), Number(day));
	}

	return null;
}

function formatDateToIso(value) {
	if (value === null || value === undefined || value === '') {
		return null;
	}

	if (moment.isMoment(value)) {
		return value.isValid() ? value.clone().utc().format(ISO_DATE_FORMAT) : null;
	}

	if (value instanceof Date) {
		const parsedDate = moment.utc(value);
		return parsedDate.isValid() ? parsedDate.format(ISO_DATE_FORMAT) : null;
	}

	if (typeof value === 'number') {
		const excelDate = convertExcelSerialDate(value);
		return excelDate ? excelDate.format(ISO_DATE_FORMAT) : null;
	}

	const parsedDateFromString = parseDateString(value);
	if (parsedDateFromString) {
		return parsedDateFromString.format(ISO_DATE_FORMAT);
	}

	const parsedDate = moment.utc(value);
	if (!parsedDate.isValid()) {
		return null;
	}

	return parsedDate.format(ISO_DATE_FORMAT);
}

function normalizeValueByType(value, field) {
	switch (field.type) {
		case 'number':
			return normalizeNumber(value, field.defaultValue);
		case 'date':
			return formatDateToIso(value);
		case 'string':
		default:
			return normalizeString(value, field.defaultValue);
	}
}

function mapOldRepairHistoryRow(row) {
	return IMPORT_OLD_REPAIR_HISTORY_SCHEMA.reduce((result, field) => {
		const rawValue = getHeaderValue(row, field.headers);
		result[field.key] = normalizeValueByType(rawValue, field);
		return result;
	}, {});
}

function mapOldRepairHistoryRows(rows = []) {
	return rows.map((row) => mapOldRepairHistoryRow(row));
}

async function readExcelRows(file) {
	if (!file) {
		return [];
	}

	const arrayBuffer = await file.arrayBuffer();
	const workbook = XLSX.read(arrayBuffer, {
		type: 'array',
		cellDates: true,
	});

	const firstSheetName = workbook.SheetNames?.[0];

	if (!firstSheetName) {
		return [];
	}

	const worksheet = workbook.Sheets[firstSheetName];
	if (!worksheet) {
		return [];
	}

	return XLSX.utils.sheet_to_json(worksheet, {
		defval: '',
		raw: true,
	});
}

async function importOldRepairHistoryExcel(file) {
	const rows = await readExcelRows(file);
	return mapOldRepairHistoryRows(rows);
}

export {
	IMPORT_OLD_REPAIR_HISTORY_SCHEMA,
	getHeaderValue,
	mapOldRepairHistoryRow,
	mapOldRepairHistoryRows,
	readExcelRows,
	importOldRepairHistoryExcel,
};
