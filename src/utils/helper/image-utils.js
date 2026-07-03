/* eslint-disable no-undef */

let staticServer = 'http://localhost:8002';

// eslint-disable-next-line no-undef
if (process.env.VUE_APP_STATIC_FILE_HOST_NAME) {
  staticServer = process.env.VUE_APP_STATIC_FILE_HOST_NAME;
}

function getImageSource(url) {
  let ret = staticServer + '/' + url;
  if (url.charAt(0) === '/') {
    ret = staticServer + url;
  }
  // console.warn('getImageSource', ret);
  return ret;
}

export { getImageSource };
