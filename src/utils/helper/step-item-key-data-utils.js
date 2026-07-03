let devMode = true; // Set to true for development mode

function itemStepTwo(req) {
  var {
    // ขั้นที่ 1
    subItemId,
    itemNumber,
    itemName,
    itemTypeId,
    isContractWork,
    productLifeCycleStateId,
    lotSize,
    customerAbbreviation,
  } = req;

  let ret = false;

  if (subItemId === 1 || subItemId === 4) {
    if (itemNumber && itemName && itemTypeId && productLifeCycleStateId && lotSize && customerAbbreviation) {
      if (itemTypeId === 2) {
        if (isContractWork !== null) {
          ret = true;
        }
      } else {
        ret = true;
      }
    }
  } else {
    if (subItemId && itemNumber && itemName && itemTypeId && productLifeCycleStateId) {
      ret = true;
    }
  }

  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function itemStepThree(req) {
  var {
    // ขั้นที่ 2
    itemGroupId,
    productCategoriesId,
    buyerGroupId,
    costGroupId,
    storageDimensionGroupId,
    trackingDimensionGroupId,
    productTypeId,
    itemSalesTaxGroupId,
  } = req;

  let ret = false;

  // console.warn('ITEM GROUP ID', itemGroupId);
  // console.warn('PRODUCT CATEGORIES ID', productCategoriesId);
  // console.warn('BUYER GROUP ID', buyerGroupId);
  // console.warn('COST GROUP ID', costGroupId);
  // console.warn('STORAGE DIMENSION GROUP ID', storageDimensionGroupId);
  // console.warn('TRACKING DIMENSION GROUP ID', trackingDimensionGroupId);
  // console.warn('PRODUCT TYPE ID', productTypeId);
  // console.warn('ITEM SALES TAX GROUP ID', itemSalesTaxGroupId);
  

  if (
    itemGroupId &&
    productCategoriesId &&
    buyerGroupId &&
    costGroupId &&
    storageDimensionGroupId &&
    trackingDimensionGroupId &&
    productTypeId &&
    itemSalesTaxGroupId &&
    itemStepTwo(req)
  ) {
    ret = true;
  }

  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function itemStepFour(req) {
  var {
    // ขั้นที่ 3
    inventoryUnitId,
    salesUnitId,
    purchaseUnitId,
    bomUnitId,
    reservationHierarchiesId,
  } = req;

  let ret = false;

  if (inventoryUnitId && salesUnitId && purchaseUnitId && bomUnitId && reservationHierarchiesId && itemStepThree(req)) {
    ret = true;
  }

  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function itemStepFive(req) {
  var {
    // ขั้นที่ 4
    siteId,
    salesWherehouseId,
    inventoryWherehouseId,
  } = req;

  let ret = false;

  if (siteId && salesWherehouseId && inventoryWherehouseId && itemStepFour(req)) {
    ret = true;
  }

  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function itemStepSix(req) {
  var {
    // ขั้นที่ 5
    approvedVendorCheckMethodId,
    productionTypeId,
    coverageGroupId,
    latestPurchasePriceId,
    latestCostPriceId,
  } = req;

  let ret = false;

  if (approvedVendorCheckMethodId && productionTypeId && coverageGroupId && latestPurchasePriceId && latestCostPriceId && itemStepFive(req)) {
    ret = true;
  }

  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function itemStepSeven(req) {
  var {
    // ขั้นที่ 6
    netWeight,
    minNetWeight,
    maxNetWeight,
  } = req;
  let ret = false;

  if (netWeight !== null && netWeight !== undefined && minNetWeight !== null && minNetWeight !== undefined && maxNetWeight !== null && maxNetWeight !== undefined && itemStepSix(req)) {
    ret = true;
  }
  
  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function onCheckInvalidItem(req) {
  if (devMode) {
    return false; // For development mode, always return true
  }
  if (!itemStepTwo(req)) return true;
  if (!itemStepThree(req)) return true;
  if (!itemStepFour(req)) return true;
  if (!itemStepFive(req)) return true;
  if (!itemStepSix(req)) return true;
  if (!itemStepSeven(req)) return true;
  return false;
}

export { itemStepTwo, itemStepThree, itemStepFour, itemStepFive, itemStepSix, itemStepSeven, onCheckInvalidItem };
