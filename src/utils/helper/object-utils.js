import { ASSET_PAYMENT_TYPE_LIST, ASSET_MAIN_LIST, ASSET_STATUS_LIST, ASSET_LOCATION_LIST, UNIT_OF_MEASURE_LIST, CONDITION_LIST } from '@/constants';
function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

function onPareProductObject(data, code, name) {
  let ret = '-';
  if (data) {
    if (code && name) {
      ret = data[code] + '-' + data[name];
    } else if (code) {
      ret = data[code];
    } else if (name) {
      ret = data[name];
    }
  }
  return ret;
}

function onPareAssetObject(data, key, initData) {
  let ret = '-';
  let code = data.value.key;
  let name = data.value.name;
  let valueKey = data.key;
  
  if (data) {
    if (valueKey === 'assetPaymentTypeId') {
      let jsonData = ASSET_PAYMENT_TYPE_LIST.find((ele) => ele.id === initData[key]);
      data = jsonData ? jsonData : {};
    } else if (valueKey === 'isAssetMain') {
      // console.warn('AssetDetailPage onPareObject', key, code, name, valueKey, initData[valueKey]);
      let jsonData = ASSET_MAIN_LIST.find((ele) => ele.db === initData[key]);
      data = jsonData ? jsonData : {};
    } else if (valueKey === 'statusCode') {
      let jsonData = ASSET_STATUS_LIST.find((ele) => ele.code === initData[key]);
      data = jsonData ? jsonData : {};
    } else if (valueKey === 'isAtVendor') {
      // console.warn('KEY', key, initData[key]);
      let jsonData = ASSET_LOCATION_LIST.find((ele) => ele.id === initData[key]);
      data = jsonData ? jsonData : {};
    } else if (valueKey === 'unitMeasureId') {
      let jsonData = UNIT_OF_MEASURE_LIST.find((ele) => ele.id === initData[key]);
      data = jsonData ? jsonData : {};
    } else if (valueKey === 'isMachine' || valueKey === 'isDuplicatePlate' || valueKey === 'useSoftware') {
      let jsonData = CONDITION_LIST.find((ele) => ele.value === initData[key]);
      data = jsonData ? jsonData : {};
    } else {
      data = initData[key];
    }

    let ret = '-';
    if (data) {
      if (code && name) {
        ret = data[code] + '-' + data[name];
      } else if (code) {
        ret = data[code];
      } else if (name) {
        ret = data[name];
      }
    }

    if (valueKey === 'assetMainId') {
      if (ret === '-') {
        ret = initData.assetNumber;
      }
    }
    return ret;
  }
  return ret;
}

export { isEmptyObject, onPareProductObject, onPareAssetObject };
