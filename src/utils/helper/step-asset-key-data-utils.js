let devMode = false; // Set to true for development mode

function assetStepOne(req) {
  var { assetPaymentTypeId, subItemId, isAssetMain } = req;
  let ret = false;
  if (assetPaymentTypeId && subItemId && isAssetMain !== null && isAssetMain !== undefined) {
    ret = true;
  }

  if (devMode) {
    ret = true; // For development mode, always return true
  }
  return ret;
}

function assetStepTwo(req) {
  var { assetName, statusCode, acquisitionDate, isAssetMain, assetMainId } = req;
  let ret = false;

  if (assetName && statusCode && acquisitionDate && assetStepOne(req)) {
    // ret = true;
    if (!isAssetMain) {
      if (assetMainId) {
        ret = true;
      }
    } else {
      ret = true;
    }
  }

  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function assetStepThree(req) {
  var { assetGroupId, assetType, majorTypeId } = req;
  let ret = false;
  if (assetGroupId && assetType && majorTypeId && assetStepTwo(req)) {
    ret = true;
  }
  if (devMode) {
    ret = true; // For development mode, always return true
  }
  return ret;
}

function assetStepFour(req) {
  var { insuranceOnsiteExpiryDate, insuranceExpiryDate, isInsuranceOnsite, make, model, modelYear } = req;
  let ret = false;
  if (insuranceExpiryDate && isInsuranceOnsite !== null && isInsuranceOnsite !== undefined && make && model && modelYear && assetStepThree(req)) {
    if (isInsuranceOnsite) {
      if (insuranceOnsiteExpiryDate) {
        ret = true;
      }
    } else {
      ret = true;
    }
  }
  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function assetStepFive(req) {
  var { isAtVendor, assetVendorId, departmentId, sectionId, unitId } = req;
  let ret = false;
  if (isAtVendor !== null && isAtVendor !== undefined && assetStepFour(req)) {
    if (isAtVendor === true) {
      if (assetVendorId) {
        ret = true;
      }
    } else if (isAtVendor === false) {
      if (departmentId && sectionId && unitId) {
        ret = true;
      }
    }
  }
  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function assetStepFiveMC(req) {
  var { quantity, unitMeasureId, subItemId } = req;
  let ret = false;

  if (quantity && unitMeasureId && subItemId === 28 && assetStepFive(req)) {
    ret = true;
  }
  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function assetStepFivePart(req) {
  var { quantity, unitMeasureId, subItemId } = req;
  let ret = false;

  if (quantity && unitMeasureId && assetStepFive(req)) {
    if (subItemId === 25 || subItemId === 26 || subItemId === 27) {
      ret = true;
    }
  }

  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function assetStepSix(req) {
  var { subItemId, isMachine, isDuplicatePlate, duplicatePlateConsiste, useSoftware, horsePower, productId, typeDieAndJigId, operationNo, operationName } = req;
  let ret = false;

  if (subItemId === 28) {
    if (isMachine !== null && isMachine !== undefined) {
      if (isDuplicatePlate === true) {
        if (duplicatePlateConsiste && useSoftware !== null && useSoftware !== undefined && horsePower && assetStepFiveMC(req)) {
          ret = true;
        }
      } else {
        if (useSoftware !== null && useSoftware !== undefined && horsePower && assetStepFiveMC(req)) {
          ret = true;
        }
      }
    }
  } else if (subItemId === 25 || subItemId === 26 || subItemId === 27) {
    if (productId && typeDieAndJigId && operationNo && operationName && assetStepFivePart(req)) {
      ret = true;
    }
  } else {
    if (assetStepFive(req)) {
      ret = true;
    }
  }

  if (devMode) {
    ret = true; // For development mode, always return true
  }

  return ret;
}

function assetStepSeven(req) {
  var { buyVendorId } = req;
  let ret = false;

  if (buyVendorId && assetStepSix(req)) {
    ret = true;
  }

  if (devMode) {
    ret = true; // For development mode, always return true
  }
  return ret;
}

function onCheckInvalidAsset(req) {
  var { subItemId } = req;
  if (devMode) {
    return false; // For development mode, always return true
  }
  if (!assetStepOne(req)) return true;
  if (!assetStepTwo(req)) return true;
  if (!assetStepThree(req)) return true;
  if (!assetStepFour(req)) return true;
  if (!assetStepFive(req)) return true;

  let conditionalStepSixPasses = false;
  if (subItemId === 28) {
    conditionalStepSixPasses = assetStepFiveMC(req) && assetStepSix(req);
  } else if (subItemId === 25 || subItemId === 26 || subItemId === 27) {
    conditionalStepSixPasses = assetStepFivePart(req) && assetStepSix(req);
  } else {
    conditionalStepSixPasses = assetStepSix(req);
  }

  if (!conditionalStepSixPasses) return true;

  if (!assetStepSeven(req)) {
    return true;
  }
}

function onCheckAssetReadOnly(req) {
  var { step, field, changeTypeId} = req;
  let ret = false;
  if (changeTypeId === 1) {
    if (step === 2 || step === 3 || step === 5 || step === 6 || step === 7 || step === 8) {
      ret = true;
    }
  } else if (changeTypeId === 2 || changeTypeId === 3 || changeTypeId === 4 || changeTypeId === 5 || changeTypeId === 6) {
    if (step === 2 || step === 3 || step === 4 || step === 6 || step === 7 || step === 8) {
      ret = true;
    } else if (step === 5) {
      if (field === 'isAtVendor') {
        ret = true;
      }
    }
  }

  if (devMode) {
    ret = false;
  }

  return ret;
}

export {
  assetStepOne,
  assetStepTwo,
  assetStepThree,
  assetStepFour,
  assetStepFive,
  assetStepFiveMC,
  assetStepFivePart,
  assetStepSix,
  assetStepSeven,
  onCheckInvalidAsset,
  onCheckAssetReadOnly
};
