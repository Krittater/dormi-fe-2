import { AUTHORIZATION_MAP, MASTER_STATUS_MAP } from '@/constants';
function getWaitStatusByAuth(auth) {
  let ret = [MASTER_STATUS_MAP.waiting.db];
  // console.warn('getWaitStatusByAuth', auth);
  if (auth === AUTHORIZATION_MAP.approver.db) {
    ret = [MASTER_STATUS_MAP.waiting.db];
  } else if (auth === AUTHORIZATION_MAP.finalApproverItem.db || auth === AUTHORIZATION_MAP.finalApproverAsset.db) {
    ret = [MASTER_STATUS_MAP.waitingFinal.db];
  } else if (auth === AUTHORIZATION_MAP.acctMgrApprover.db) {
    ret = [MASTER_STATUS_MAP.waitingAcctMgr.db];
  } else if (auth === AUTHORIZATION_MAP.requestor.db || auth === AUTHORIZATION_MAP.root.db) {
    ret = [MASTER_STATUS_MAP.waiting.db, MASTER_STATUS_MAP.waitingFinal.db, MASTER_STATUS_MAP.waitingAcctMgr.db];
  }

  return ret;
}

export { getWaitStatusByAuth };
