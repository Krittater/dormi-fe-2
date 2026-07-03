import { MASTER_STATUS_CONSTANTS, AUTHORIZATION_MAP } from '@/constants';

let authorizationMap = AUTHORIZATION_MAP;
let masterStatusMap = MASTER_STATUS_CONSTANTS;

function onCheckComplete(steper, step) {
  let ret = false;
  if (Number(steper) > step) {
    ret = true;
  }
  return ret;
}

function onCheckPrevFields(data, fields) {
  let ret = false;
  // console.warn('DATA', data);
  // console.warn('FIELDS', fields);
  if (data && fields) {
    for (let i = 0; i < fields.length; i++) {
      let field = fields[i];
      // if( field.key === 'isAtVendor'){
      // console.warn('DATA ', data);
      // console.warn('key', field.key, data[field.key]);
      // console.warn('prevKey', field.prevKey, data[field.prevKey]);
      // }
      if (data[field.prevKey] !== null && data[field.prevKey] !== undefined) {
        ret = true;
        break;
      }
    }
  }
  return ret;
}

function onCheckReturned(initData, dataApproverList, step) {
  let ret = false;

  if (initData.status === masterStatusMap.returned.db) {
    if (step === 1) {
      ret = false;
    } else if (step === 2) {
      let approvalList = dataApproverList.filter((ele) => ele.status === masterStatusMap.returned.db && ele.isApproval === true);
      if (approvalList.length > 0) {
        ret = true;
      }
    } else if (step === 3) {
      let finalApprovalList = dataApproverList.filter((ele) => ele.status == masterStatusMap.returned.db && ele.isFinalApproval == true);
      if (finalApprovalList.length > 0) {
        ret = true;
      }
    } else if (step === 4) {
      let accountingManagerList = dataApproverList.filter((ele) => ele.status == masterStatusMap.returned.db && ele.isAccountingManager == true);
      if (accountingManagerList.length > 0) {
        ret = true;
      }
    }
  }

  return ret;
}

function onCheckRejected(initData, dataApproverList, step) {
  let ret = false;

  if (initData.status === masterStatusMap.rejected.db) {
    if (step === 1) {
      ret = false;
    } else if (step === 2) {
      let approvalList = dataApproverList.filter((ele) => ele.status == masterStatusMap.rejected.db && ele.isApproval == true);
      if (approvalList.length > 0) {
        ret = true;
      }
    } else if (step === 3) {
      let finalApprovalList = dataApproverList.filter((ele) => ele.status == masterStatusMap.rejected.db && ele.isFinalApproval == true);
      if (finalApprovalList.length > 0) {
        ret = true;
      }
    } else if (step === 4) {
      let accountingManagerList = dataApproverList.filter((ele) => ele.status == masterStatusMap.rejected.db && ele.isAccountingManager == true);
      if (accountingManagerList.length > 0) {
        ret = true;
      }
    }
  }

  return ret;
}

function onCheckApprover(initData, dataApproverList, finalApprover, authorizationLevel, userId) {
  let ret = false;
  let authFinal;
  if (finalApprover === 'finalApprovalItem') {
    authFinal = authorizationMap.finalApproverItem;
  } else if (finalApprover === 'finalApprovalAsset') {
    authFinal = authorizationMap.finalApproverAsset;
  }
  if (initData.status === masterStatusMap.completed.db || initData.status === masterStatusMap.returned.db) {
    ret = false;
  } else {
    if (authorizationLevel === authorizationMap.approver.db) {
      let approvalList = dataApproverList.filter((ele) => ele.userId == userId && ele.status == masterStatusMap['approved'].db);
      if (approvalList.length == 0) {
        ret = true;
      }
    } else if (authorizationLevel === authFinal.db) {
      let approvalList = dataApproverList.filter((ele) => ele.status == masterStatusMap['waiting'].db && ele.isApproval == true);
      let finalApprovalList = dataApproverList.filter((ele) => ele.status == masterStatusMap['waiting'].db && ele.isFinalApproval == true);
      if (approvalList.length == 0 && finalApprovalList.length > 0) {
        ret = true;
      }
    } else if (authorizationLevel == authorizationMap.acctMgrApprover.db) {
      let approvalList = dataApproverList.filter((ele) => ele.status == masterStatusMap.waiting.db && ele.isApproval == true);
      let finalApprovalList = dataApproverList.filter((ele) => ele.status == masterStatusMap.waiting.db && ele.isFinalApproval == true);
      if (approvalList.length == 0 && finalApprovalList.length == 0) {
        ret = true;
      }
    }
  }
  return ret;
}

function onCheckCondition(initData, conditionValue, conditionKey, onCheck) {
  let ret = true;
  if (onCheck) {
    if (conditionValue.includes(initData[conditionKey])) {
      ret = true;
    } else {
      ret = false;
    }
  }
  return ret;
}

function onCheckSubCondition(initData, conditionValue, conditionKey, onCheck) {
  let ret = true;
  if (onCheck) {
    if (conditionValue === initData[conditionKey]) {
      ret = true;
    } else {
      ret = false;
    }
  }
  return ret;
}

export { onCheckComplete, onCheckPrevFields, onCheckReturned, onCheckRejected, onCheckApprover, onCheckCondition, onCheckSubCondition };
