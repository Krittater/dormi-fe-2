const ExcelJS = require('exceljs');
import { saveAs } from 'file-saver';
import itemFieldJson from '@/assets/json/item-fields.json';
import assetFieldJson from '@/assets/json/asset-fields.json';
import { onPareProductObject, numFormat, renderDbDate, renderDbDateOnly, renderDbYearOnly, checkOldItemNumber  } from '@/utils';
import { MASTER_STATUS_CONSTANTS, MASTER_STATUS_CONSTANT_TH, HEADER_ITEM_EXPORT_EXCEL_TO_ST7_LIST, HEADER_ITEM_EXPORT_EXCEL_TO_D365_LIST } from '@/constants';


let development = false;

const exportToExcel = async (req) => {
  var { fileName, dataList, exportType, cellColor } = req;
  try {
    // สร้าง header และ row data
    let headers = await getRowHeaders(exportType);
    let rowData = await getRowData(dataList, exportType);

    // สร้าง Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // headers
    worksheet.columns = headers;

    // เพิ่ม data rows
    worksheet.addRows(rowData);

    // ปรับขนาดความกว้างของคอลัมน์
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2; // เพิ่ม padding
    });

    // ปรับรูปแบบของ Cell
    if (cellColor) {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          // ข้ามแถวแรกที่เป็น header

          const cellName = row.getCell(cellColor); // value of 'status' column
          if (cellName) {
            const cellValue = cellName.value;
            // ตรวจสอบสถานะและปรับสีพื้นหลัง
            if (cellValue) {
              if (cellColor === 'status') {
                let statusObj = MASTER_STATUS_CONSTANT_TH[cellValue];
                if (statusObj && statusObj.color) {
                  let font = {
                    color: { argb: statusObj.color.replace('#', '00') }, // แปลงสีจาก hex เป็น argb
                  };
                  worksheet.getCell(`${cellName.address}`).font = font;
                }
              }
            }
          }
        }
      });
    }

    if (!development) {
      // สร้างไฟล์ Excel และดาวน์โหลด
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName + '.xlsx');
    }
    return true;
  } catch (error) {
    console.error('EXPORT TO EXCEL ERROR --+> ', error);
    return false;
  }
};

const exportExcelToST7 = async (req) => {
  var { fileName, dataList } = req;
  try {
    // สร้าง header และ row data
    // let headers = getRowHeadersToST7();
    let rowData = getRowDataToST7(dataList);

    // สร้าง Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // สร้าง header สำหรับ ST7
    worksheet.getCell('A2').value = 'รหัสเอกสาร';
    worksheet.getCell('B2').value = 'ITEM NO.';
    worksheet.getCell('C2').value = 'ITEM NAME';
    worksheet.getCell('D2').value = 'DRAWING NO.';
    worksheet.getCell('E2').value = 'มีการออกไปจ้างทำหรือไม่ ?';
    worksheet.getCell('F1').value = 'SOURCE';
    worksheet.getCell('F2').value = 'PURCHASE';
    worksheet.getCell('G2').value = 'MANUFACTURER';
    worksheet.getCell('H2').value = 'CUSTOMER SUPPLIER';
    worksheet.getCell('I2').value = 'STORE LOCATION';
    worksheet.getCell('J2').value = 'ตัวย่อลูกค้า';
    worksheet.getCell('K2').value = 'min weight';
    worksheet.getCell('L2').value = 'max weight';
    worksheet.getCell('M2').value = 'PC/KG';
    worksheet.getCell('N2').value = 'LOT SIZE';


    worksheet.mergeCells('A1:A2');
    worksheet.mergeCells('B1:B2');
    worksheet.mergeCells('C1:C2');
    worksheet.mergeCells('D1:D2');
    worksheet.mergeCells('E1:E2');
    worksheet.mergeCells('F1:H1');
    worksheet.mergeCells('I1:I2');
    worksheet.mergeCells('J1:J2');
    worksheet.mergeCells('K1:K2');
    worksheet.mergeCells('L1:L2');
    worksheet.mergeCells('M1:M2');
    worksheet.mergeCells('N1:N2');

    const headerCells = ['A2', 'B2', 'C2', 'D2', 'E2', 'F1', 'G1', 'H1', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2', 'M2', 'N2'];

    headerCells.forEach((cellRef) => {
      const cell = worksheet.getCell(cellRef);
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        // สีพื้นหลังเหลืองอ่อน
        fgColor: { argb: 'FFFF00' }, // Yellow
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    worksheet.columns = HEADER_ITEM_EXPORT_EXCEL_TO_ST7_LIST;

    // เพิ่ม data rows
    worksheet.addRows(rowData);

    // วนลูปผ่าน dataList (หรือ rowData) เพื่อกำหนดค่าเครื่องหมายถูก
    rowData.forEach((dataRow, index) => {
      const rowIndex = index + 3; // +3 เพราะ Header ใช้ไป 2 แถว และ index เริ่มจาก 0
      const isContractWorkCell = worksheet.getCell(`E${rowIndex}`); // มีการออกไปจ้างทำหรือไม่ ? อยู่ที่คอลัมน์ E
      const purchaseCell = worksheet.getCell(`F${rowIndex}`); // PURCHASED อยู่ที่คอลัมน์ F
      const manufacturerCell = worksheet.getCell(`G${rowIndex}`); // MANUFACTURER อยู่ที่คอลัมน์ G
      const customerSupplierCell = worksheet.getCell(`H${rowIndex}`); // CUSTOMER SUPPLIED อยู่ที่คอลัมน์ H

      // สำหรับ 'มีการออกไปจ้างทำหรือไม่ ?'
      if (dataRow.isContractWork) { // สมมติว่า dataRow.isContractWork เป็น true
          isContractWorkCell.value = '✓';
          isContractWorkCell.font = { name: 'Arial', size: 14 };
          isContractWorkCell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
          isContractWorkCell.value = '';
      }

      // สำหรับ 'PURCHASE'
      if (dataRow.purchase) { // สมมติว่า dataRow.purchase เป็น true
          purchaseCell.value = '✓';
          purchaseCell.font = { name: 'Arial', size: 14 };
          purchaseCell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
          purchaseCell.value = ''; // ถ้าไม่ถูกก็ว่างไว้
      }

      // สำหรับ 'MANUFACTURER'
      if (dataRow.manufacturer) { // สมมติว่า dataRow.manufacturer เป็น true
          manufacturerCell.value = '✓';
          manufacturerCell.font = { name: 'Arial', size: 14 };
          manufacturerCell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
          manufacturerCell.value = '';
      }

      // สำหรับ 'CUSTOMER SUPPLIED'
      if (dataRow.customerSupplier) { // สมมติว่า dataRow.customerSupplier เป็น true
          customerSupplierCell.value = '✓';
          customerSupplierCell.font = { name: 'Arial', size: 14 };
          customerSupplierCell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
          customerSupplierCell.value = '';
      }
    });

    if (!development) {
      // สร้างไฟล์ Excel และดาวน์โหลด
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName + '.xlsx');
    }

    return true;
  } catch (error) {
    console.error('EXPORT TO EXCEL ERROR --+> ', error);
    return false;
  }
};

const exportExcelToD365 = async (req) => {
  var { fileName, dataList } = req;
  try {
    // สร้าง header และ row data
    let headers = HEADER_ITEM_EXPORT_EXCEL_TO_D365_LIST
    let rowData = await getRowDataToD365(dataList); 
    
    // สร้าง Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1'); 

    // A1 - AM1
    const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1', 'P1', 'Q1', 'R1', 'S1', 'T1', 'U1', 'V1', 'W1', 'X1', 'Y1', 'Z1', 'AA1', 'AB1', 'AC1', 'AD1', 'AE1', 'AF1', 'AG1', 'AH1', 'AI1', 'AJ1', 'AK1', 'AL1', 'AM1'];

    headerCells.forEach((cellRef) => {
      const cell = worksheet.getCell(cellRef);
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        // สีพื้นหลังเหลืองอ่อน
        fgColor: { argb: 'FFFF00' }, // Yellow
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // headers 
    worksheet.columns = headers;

    // เพิ่ม data rows
    worksheet.addRows(rowData);

    // ปรับขนาดความกว้างของคอลัมน์
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2; // เพิ่ม padding
    });

    if (!development) {
      // สร้างไฟล์ Excel และดาวน์โหลด
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName + '.xlsx');
    }
    return true;
  } catch (error) {
    console.error('EXPORT TO EXCEL ERROR --+> ', error);
    return false;
  }
};

const getRowHeaders = (exportType) => {
  let headers = [];
  let status = {
    header: 'สถานะ',
    key: 'status',
  };
  let docId = {
    header: 'เลขที่เอกสาร',
    key: 'docId',
  };
  // เพิ่ม status และ docId เข้าไปใน headers
  headers.push(status);
  headers.push(docId);

  let headersJson = [];
  if (exportType === 'item') {
    headersJson = itemFieldJson;
  } else if (exportType === 'asset') {
    headersJson = assetFieldJson;
  }

  let fieldList = headersJson.flatMap((ele) => {
    return ele.fields;
  });
  let filteredFields = fieldList.filter((ele) => {
    return ele.export;
  });

  if (filteredFields.length > 0) {
    // สร้าง header สำหรับ item
    for (let i = 0; i < filteredFields.length; i++) {
      const field = filteredFields[i];

      let header = {
        header: field.label,
        key: field.objectKey,
      };

      headers.push(header);
    }
  }

  let createdAt = {
    header: 'สร้างเมื่อ',
    key: 'createdAt',
  };

  let creator = {
    header: 'ผู้สร้าง',
    key: 'creator',
  };

  headers.push(createdAt);
  headers.push(creator);

  return headers;
};

const getRowData = (dataList, exportType) => {
  let rowDataList = [];
  let headers = [];

  let status = {
    label: 'Status',
    key: 'status',
    type: 'status',
    objectKey: 'status',
  };

  let docId = {
    label: 'Doc ID',
    key: 'docId',
    type: 'string',
    objectKey: 'docId',
  };
  // เพิ่ม status และ docId เข้าไปใน headers
  headers.push(status);
  headers.push(docId);

  let headersJson = [];

  if (exportType === 'item') {
    headersJson = itemFieldJson;
  } else if (exportType === 'asset') {
    headersJson = assetFieldJson;
  }
  let fieldList = headersJson.flatMap((ele) => {
    return ele.fields;
  });
  let filteredFields = fieldList.filter((ele) => {
    return ele.export;
  });

  headers = headers.concat(filteredFields);

  let createdAt = {
    label: 'Created At',
    key: 'createdAt',
    type: 'datetime',
    objectKey: 'createdAt',
  };

  let creator = {
    label: 'Creator',
    key: 'creator',
    type: 'object',
    objectKey: 'creator',
    value: {
      key: 'name',
      name: null,
    },
  };

  // เพิ่ม createdAt และ creator เข้าไปใน filteredFields
  headers.push(createdAt);
  headers.push(creator);

  if (dataList && dataList.length > 0) {
    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      // วน loop obj data เพื่อสร้าง row data
      let rowData = {};
      for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          const value = data[key];

          // ตรวจสอบว่า key อยู่ใน headers หรือไม่
          // console.warn('getRowDataList key', key, 'value', value);
          let field = headers.find((ele) => ele.objectKey === key);
          if (field) {
            // ถ้า key อยู่ใน headers ให้เพิ่มเข้าไปใน rowData
            if (field.type === 'object') {
              // ถ้าเป็น object ให้แปลงเป็น string
              rowData[key] = onPareProductObject(value, field.value.key, field.value.name);
            } else if (field.type === 'decimal') {
              // ถ้าเป็น decimal ให้แปลงเป็น string ด้วย numFormat
              rowData[key] = value ? numFormat(value, '0,0.00000') : '-';
            } else if (field.type === 'datetime') {
              // ถ้าเป็น datetime ให้แปลงเป็น string ด้วย renderDbDate
              rowData[key] = value ? renderDbDate(value) : '-';
            } else if (field.type === 'dateOnly') {
              // ถ้าเป็น dateOnly ให้แปลงเป็น string ด้วย renderDbDateOnly
              rowData[key] = value ? renderDbDateOnly(value) : '-';
            } else if (field.type === 'yearOnly') {
              // ถ้าเป็น yearOnly ให้แปลงเป็น string ด้วย renderDbDateOnly
              rowData[key] = value ? renderDbYearOnly(value) : '-';
            } else if (field.type === 'boolean') {
              // ถ้าเป็น boolean ให้แปลงเป็น string
              rowData[key] = value ? 'Yes' : 'No';
            } else if (field.type === 'status') {
              // ถ้าเป็น status ให้แปลงเป็น string ด้วย MASTER_STATUS_CONSTANTS
              let statusObj = MASTER_STATUS_CONSTANTS[value];
              rowData[key] = statusObj ? statusObj.name : '-';
            } else {
              rowData[key] = value;
            }
          }
        }
      }
      rowDataList.push(rowData);
    }
  }
  return rowDataList;
};

const getRowDataToST7 = (dataList) => {
  // สร้าง row data สำหรับ ST7
  let rowDataList = [];

  dataList.sort((a, b) => {
    if (a.docId < b.docId) return -1;
    if (a.docId > b.docId) return 1;
    return 0;
  });

  if (dataList.length > 0) {
    for (let i = 0; i < dataList.length; i++) {
      const item = dataList[i];
      let data = {
        ...item,
        manufacturer: false,
        purchase: false,
        customerSupplier: false,
      }

      data['searchName'] = checkOldItemNumber(item);
      // data['isContractWork'] = item.isContractWork ? 'Yes' : 'No';

      if (item.itemType === 'Manufactured') {
        data.manufacturer = true;
      } else if (item.itemType === 'Purchased') {
        data.purchase = true;
      } else if (item.itemType === 'Customer Supplied') {
        data.customerSupplier = true;
      }

      rowDataList.push(data)
    }
  }

  return rowDataList;
};

const getRowDataToD365 = async (dataList) => {
  // สร้าง row data สำหรับ D365
  let rowDataList = [];

  if (dataList.length > 0) {
    for (let i = 0; i < dataList.length; i++) {
      const item = dataList[i];
      let data = {
        ...item,
      }

      data['searchName'] = checkOldItemNumber(item);
      data['itemSalesTaxGroup2'] = item.itemSalesTaxGroup
      data['itemGroup2'] = item.itemGroup
      data['itemGroup3'] = item.itemGroup
      
      // แปลงค่า minNetWeight และ maxNetWeight เป็น string ด้วย numFormat
      data['minNetWeight'] = item.minNetWeight ? numFormat(item.minNetWeight, '0,0.00000') : '-';
      data['maxNetWeight'] = item.maxNetWeight ? numFormat(item.maxNetWeight, '0,0.00000') : '-';
      data['netWeight'] = item.netWeight ? numFormat(item.netWeight, '0,0.00000') : '-';

      rowDataList.push(data);
    }
  }

  return rowDataList
};


const exportXlsxFormAccountingManageRepairRequestPage = (dataList) => {

};



export { exportToExcel, exportExcelToST7, exportExcelToD365 };
