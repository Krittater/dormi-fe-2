var { MASTER_STATUS_CONSTANTS } = require('@/constants');

function getRowColor(status) {
  let ret = '';
  if (status) {
    if(MASTER_STATUS_CONSTANTS[status]){
        ret = 'background-color: ' + MASTER_STATUS_CONSTANTS[status].rowColor + ' !important;';
    }
  }
// console.warn(`getRowColor: ${status} => ${ret}`);
  return ret;
}

function getStepColor(steper, step) {
  let ret = 'grey-lighten-2';
  if (Number(steper) > step) {
    ret = 'success';
  } else if (Number(steper) == step) {
    ret = 'yellow-darken-2';
  } else if (Number(steper) < step) {
    ret = 'grey-lighten-2';
  }
  return ret;
}

export { getRowColor, getStepColor };
