function booleanFormat(value) {
  let ret = '-';
  if (value) {
    if (value === true) {
      ret = 'Yes';
    } else if (value === false) {
      ret = 'No';
    }
  }
  return ret;
}

export { booleanFormat };
