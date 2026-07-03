import { DECIMAL_FORMAT } from '@/constants';

function onCheckNetWeight(req) {
  var { netWeight = 0, minNetWeight = 0, maxNetWeight = 0 } = req;
  var errorMessages = {
    netWeight: null,
    minNetWeight: null,
    maxNetWeight: null,
  };

  if (netWeight === null || netWeight === '') {
    errorMessages['netWeight'] = 'กรุณากรอก Net weight';
    return errorMessages;
  } else if (onCheckDecimal(netWeight)) {
    errorMessages['netWeight'] = `กรุณากรอก Net weight ให้มีทศนิยมไม่เกิน ${DECIMAL_FORMAT.maxDecimal} หลัก`;
    return errorMessages;
  } else {
    let net = Number(netWeight) || 0;
    let min = Number(minNetWeight) || 0;
    let max = Number(maxNetWeight) || 0;

    if (net < min) {
      errorMessages['netWeight'] = 'Net weight ต้องมากกว่าหรือเท่ากับ Min net weight';
      errorMessages['minNetWeight'] = 'Min net weight ต้องน้อยกว่าหรือเท่ากับ Net weight';
    } else {
      errorMessages['netWeight'] = null;
      errorMessages['minNetWeight'] = null;
    }

    if (net < max) {
      errorMessages['netWeight'] = 'Net weight ต้องมากกว่าหรือเท่ากับ Max net weight';
      errorMessages['maxNetWeight'] = 'Max net weight ต้องน้อยกว่าหรือเท่ากับ Net weight';
    } else {
      errorMessages['netWeight'] = errorMessages['netWeight'] || null;
      errorMessages['maxNetWeight'] = null;
    }
    return errorMessages;
  }
}

function onCheckMinNetWeight(req) {
  var { netWeight, minNetWeight, maxNetWeight } = req;
  var errorMessages = {
    netWeight: null,
    minNetWeight: null,
    maxNetWeight: null,
  };
  if (minNetWeight === null || minNetWeight === '') {
    errorMessages['minNetWeight'] = 'กรุณากรอก Min net weight';
    return errorMessages;
  } else if (onCheckDecimal(minNetWeight)) {
    errorMessages['minNetWeight'] = `กรุณากรอก Min net weight ให้มีทศนิยมไม่เกิน ${DECIMAL_FORMAT.maxDecimal} หลัก`;
    return errorMessages;
  } else {
    let net = Number(netWeight) || 0;
    let min = Number(minNetWeight) || 0;
    let max = Number(maxNetWeight) || 0;

    if (min > net) {
      errorMessages['minNetWeight'] = 'Min net weight ต้องน้อยกว่า Net weight';
      errorMessages['netWeight'] = 'Net weight ต้องมากกว่าหรือเท่ากับ Min net weight';
    } else {
      errorMessages['minNetWeight'] = null;
      errorMessages['netWeight'] = null;
    }

    if (min > max) {
      errorMessages['minNetWeight'] = 'Min net weight ต้องน้อยกว่าหรือเท่ากับ Max net weight';
      errorMessages['maxNetWeight'] = 'Max net weight ต้องมากกว่าหรือเท่ากับ Min net weight';
    } else {
      errorMessages['minNetWeight'] = errorMessages['minNetWeight'] || null;
      errorMessages['maxNetWeight'] = null;
    }
    return errorMessages;
  }
}

function onCheckMaxNetWeight(req) {
  var { netWeight, minNetWeight, maxNetWeight } = req;
  var errorMessages = {
    netWeight: null,
    minNetWeight: null,
    maxNetWeight: null,
  };
  if (maxNetWeight === null || maxNetWeight === '') {
    errorMessages['maxNetWeight'] = 'กรุณากรอก Max net weight';
    return errorMessages;
  } else if (onCheckDecimal(maxNetWeight)) {
    errorMessages['maxNetWeight'] = `กรุณากรอก Max net weight ให้มีทศนิยมไม่เกิน ${DECIMAL_FORMAT.maxDecimal} หลัก`;
    return errorMessages;
  } else {
    let net = Number(netWeight) || 0;
    let min = Number(minNetWeight) || 0;
    let max = Number(maxNetWeight) || 0;

    if (max > net) {
      errorMessages['maxNetWeight'] = 'Max net weight ต้องน้อยกว่าหรือเท่ากับ Net weight';
      errorMessages['netWeight'] = 'Net weight ต้องมากกว่าหรือเท่ากับ Max net weight';
    } else {
      errorMessages['maxNetWeight'] = null;
      errorMessages['netWeight'] = null;
    }

    if (max < min) {
      errorMessages['maxNetWeight'] = 'Max net weight ต้องมากกว่าหรือเท่ากับ Min net weight';
      errorMessages['minNetWeight'] = 'Min net weight ต้องน้อยกว่าหรือเท่ากับ Max net weight';
    } else {
      errorMessages['maxNetWeight'] = errorMessages['maxNetWeight'] || null; 
      errorMessages['minNetWeight'] = null;
    }
    return errorMessages;
  }
}

function onCheckDecimal(value) {
  let ret = false;
  let maxDecimal = DECIMAL_FORMAT.maxDecimal;
  let decimalPart = value.toString().split('.')[1];
  if (decimalPart && decimalPart.length > maxDecimal) {
    ret = true;
  }
  return ret;
}

export { onCheckNetWeight, onCheckMinNetWeight, onCheckMaxNetWeight };
