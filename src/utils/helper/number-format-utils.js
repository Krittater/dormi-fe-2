import numeral from 'numeral';

function numFormat(num, format = '0,0.00') {
  let ret = '0.00';
  if (num !== null && num !== undefined) {
    ret = numeral(num).format(format);
  }
  return ret;
}

export { numFormat };
