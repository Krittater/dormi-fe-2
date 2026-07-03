function checkOldItemNumber(req) {
  var { itemNumber, searchName, subItem } = req;
  let ret = null;
  if (!searchName) {
    if (subItem) {
      let itemNumberArr = itemNumber.split('-');
      ret = subItem.prefixOld + itemNumberArr[1];
    }
  } else {
    ret = searchName;
  }
  return ret;
}

export { checkOldItemNumber };