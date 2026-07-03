import moment from 'moment';

import { MM_TO_PT, DEFAULT_PDF_DOC_STYLES, LOGO_BASE64 } from '@/constants';

import PdfMake from '@/pdfmake/pdf-make.js';

async function genCreateItemPdf() {
  let pdfFileName = moment().format('YYYYMMDD_HHmmss') + '_create_item.pdf';
  let headTitle = 'ooxoox xoxox';
  let docDefinition = {};
  let docFooterSection = {};
  let pdfDocData = null;

  let defaultDocDefinition = {
    info: {
      title: headTitle,
      author: 'NST MASTER DATA SYSTEM',
      subject: headTitle,
      keywords: 'master data, item, pdf',
    },
    // a string or { width: number, height: number }
    pageSize: 'A4',

    // by default we use portrait, you can change it to landscape if you wish
    pageOrientation: 'portrait',

    // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
    pageMargins: [10, 10, 10, 10],
    styles: DEFAULT_PDF_DOC_STYLES,
    content: [],

    //add border to all cells
    defaultStyle: {
      border: [true, true, true, true],
    },
  };

  let defaultDocStyles = DEFAULT_PDF_DOC_STYLES;

  let defaultDocPageMargins = [
    5 * MM_TO_PT, // left
    5 * MM_TO_PT, // top
    5 * MM_TO_PT, // right
    10 * MM_TO_PT, // bottom
  ];

  // let defaultDocPageHeaderMargins = [
  //   15 * MM_TO_PT,
  //   5 * MM_TO_PT,
  //   10 * MM_TO_PT,
  //   0,
  // ];

  let defaultDocPageFooterMargins = [5 * MM_TO_PT, 0 * MM_TO_PT, 5 * MM_TO_PT, 0 * MM_TO_PT];

  docFooterSection['margin'] = defaultDocPageFooterMargins;

  let docBodyContentList = [];
  let mode = 'page-by-data-list';
  let footerMode = 'last-page';

  // on Setup Default
  docDefinition = {
    ...defaultDocDefinition,
  };
  if (defaultDocStyles) {
    docDefinition['styles'] = defaultDocStyles;
  }

  if (defaultDocPageMargins) {
    docDefinition['pageMargins'] = defaultDocPageMargins;
  }

  if (pdfFileName) {
    if (docDefinition['info']) {
      docDefinition['info']['title'] = pdfFileName;
    }
  }

  let content = {}; // START CONTENT

  //   let requestData = {
  //     name: 'Item Name',
  //     code: 'ITEM-001',
  //     description: 'This is a sample item description.',
  //     category: 'Electronics',
  //     unit: 'pcs',
  //     barcode: '1234567890123',
  //     salesPrice: 100.0,
  //     costPrice: 80.0,
  //     salesTaxRate: 7.0,
  //     inventoryTaxRate: 7.0,
  //     salesWherehouseId: 'WH-001',
  //     inventoryWherehouseId: 'WH-002',
  //     approvedVendorCheckMethodId: 'VENDOR-001',
  //     productionTypeId: 'PROD-001',
  //     coverageGroupId: 'COVER-001',
  //     latestPurchasePriceId: 'PURCHASE-001',
  //     latestCostPriceId: 'COST-001',
  //     netWeight: 1.5,
  //   };

  let rowTitle = {
    stack: [
      {
        text: 'สวัสดีครับ/ค่ะ',
        style: 'header',
      },
      genLineCanvas(50),
      {
        text: 'Generated on: ' + moment().format('YYYY-MM-DD HH:mm:ss'),
        style: 'subheader',
      },
    ],
  };

  let logoImage = {
    image: LOGO_BASE64,
    width: 50 * MM_TO_PT, // 50mm to points
    height: 50 * MM_TO_PT, // 50mm to points
    alignment: 'left',
    margin: [0, 0, 0, 10], // [left, top, right, bottom]
  };

  content = {
    stack: [
      logoImage,
      rowTitle, // หัวเรื่อง
    ],
  };

  docBodyContentList.push(content);

  let contentFinal = [];
  if (mode === 'page-by-data-list') {
    let dataList = docBodyContentList;
    for (var i = 0; i < dataList.length; i++) {
      let pageBreakStr = ' ';
      let pageBreakText = {
        text: pageBreakStr,
        style: 'pageBreakHeader',
      };

      if (i > 0) {
        pageBreakText['pageBreak'] = 'before';
      }

      contentFinal.push(pageBreakText);
      //## Body
      contentFinal.push(dataList[i]);

      //## Footer (Sign Section) last Page
      if (footerMode === 'every-page') {
        // contentFinal.push(docFooterSection);
      }

      //## Footer (Sign Section) last Page
      if (footerMode === 'last-page') {
        // contentFinal.push(docFooterSection);
      }
    }
  } else {
    let dataList = docBodyContentList;
    for (let i = 0; i < dataList.length; i++) {
      //## ----------- One Page Data --------------

      //## Body
      contentFinal.push(dataList[i]);

      //## Footer (Sign Section) Every Page
      if (footerMode === 'every-page') {
        // docDefinition['footer'] = this.footerDefinitionFn;
        // [DEBUG]
        // console.log('***** every-page footer used ***: ',this.footerSectionHeight)
        // contentFinal.push(docFooterSection);
      }

      //## Footer (Sign Section) last Page
      if (footerMode === 'last-page') {
        // contentFinal.push(docFooterSection);
      }
    }
  }

  docDefinition['content'] = contentFinal;
  // docDefinition['footer'] = docFooterSection;
  pdfDocData = docDefinition;
  // console.warn('pdfDocData --+> ', pdfDocData);
  let createPDF = await PdfMake.pdfMake.createPdf(pdfDocData);

  createPDF.open();
  createPDF.download(pdfFileName);

  return { status: 'success', message: 'genTrainingReacordPdf success' };
}

function genLineCanvas(width) {
  let line_divider = {
    canvas: [
      {
        // เส้นประ
        type: 'line',
        x1: 0,
        y1: 0,
        x2: width * MM_TO_PT,
        y2: 0,
        lineWidth: 1,
        lineColor: '#000000',
        dash: { length: 1 },
      },
    ],
    margin: [0, 0, 0, 0],
  };

  return line_divider;
}

export { genCreateItemPdf };
