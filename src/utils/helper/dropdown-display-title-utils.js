function codeAndName(item) {
  let ret = '';
  if (item) {
    if (item.code && item.name) {
      ret = `${item.code} - ${item.name}`;
    }
  }
  return ret;
}

function nameAndDescription(item) {
  let ret = '';
  if (item) {
    if (item.name && item.description) {
      ret = `${item.name} - ${item.description}`;
    }
  }
  return ret;
}

function codeAndDescription(item) {
  let ret = '';
  if (item) {
    if (item.code && item.description) {
      ret = `${item.code} - ${item.description}`;
    }
  }
  return ret;
}

function codeOnly(item) {
  let ret = '';
  if (item && item.code) {
    ret = item.code;
  }
  return ret;
}

function nameOnly(item) {
  let ret = '';
  if (item && item.name) {
    ret = item.name;
  }
  return ret;
}

function descriptionOnly(item) {
  let ret = '';
  if (item && item.description) {
    ret = item.description;
  }
  return ret;
}

function pswCodeAndName(item) {
  let ret = '';
  if (item) {
    if (item.pswCode && item.name) {
      ret = `${item.pswCode} - ${item.name}`;
    }
  }
  return ret;
}

function assetNumberAndName(item) {
  let ret = '';
  if (item) {
    if (item.assetNumber && item.assetName) {
      ret = `${item.assetNumber} - ${item.assetName}`;
    }
  }
  return ret;
}

export { codeAndName, codeAndDescription, nameAndDescription, codeOnly, nameOnly, descriptionOnly, pswCodeAndName, assetNumberAndName };
