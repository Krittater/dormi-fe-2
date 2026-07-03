import moment from 'moment';
import 'moment-timezone';

const defaultFormat = 'DD MMM YYYY, HH:mm:ss';
const defaultTimeFormat = 'HH:mm';
const defaultDbTimeFormat = 'HH:mm:ss';
const defaultDbDateOnlyFormat = 'DD MMM YYYY';
const defaultDbYearOnlyFormat = 'YYYY';

function renderDbDate(dbDate, format = defaultFormat) {
  return moment(dbDate, moment.ISO_8601).locale('th').format(format);
}

function renderDbTime(dbTime, format = defaultTimeFormat) {
  return moment(dbTime, defaultDbTimeFormat).locale('th').format(format);
}

function renderDbDateOnly(dbDate, format = defaultDbDateOnlyFormat) {
  return moment(dbDate, moment.ISO_8601).locale('th').format(format);
}

function renderDbYearOnly(dbDate, format = defaultDbYearOnlyFormat) {
  return moment(dbDate, moment.ISO_8601).locale('th').format(format);
}

// function renderDbDateTime(dbDateTime, format = defaultFormat) {
//   return moment(dbDateTime, moment.ISO_8601).locale('th').format(format);
// }

function daysSince(time) {
  // เวลาอดีต แปลงเป็นเวลาไทย
  const past = moment.tz(time, 'Asia/Bangkok');
  // เวลาปัจจุบัน เวลาไทย
  const now = moment.tz('Asia/Bangkok');
  // คำนวณความต่างเป็นมิลลิวินาที
  const diffMs = now.diff(past);

  // แปลงเป็นวัน ชั่วโมง นาที วินาที
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const diffMinutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  // const diffSeconds = Math.floor((diffMs % (60 * 1000)) / 1000);

  // return `${diffDays} วัน ${diffHours} ชั่วโมง ${diffMinutes} นาที ${diffSeconds} วินาที`;
  return `${diffDays} วัน ${diffHours} ชั่วโมง ${diffMinutes} นาที`;

}

function diffDaysSince(time1, time2) {
  // แปลงเป็น Moment (เวลาไทย)
  const t1 = moment.tz(time1, 'Asia/Bangkok');
  const t2 = moment.tz(time2, 'Asia/Bangkok');

  // คำนวณความต่าง (เลขบวกเสมอ)
  const diffMs = Math.abs(t2.diff(t1));

  // แปลงเป็น วัน / ชั่วโมง / นาที / วินาที
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const diffMinutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  // const diffSeconds = Math.floor((diffMs % (60 * 1000)) / 1000);

  // return `${diffDays} วัน ${diffHours} ชั่วโมง ${diffMinutes} นาที ${diffSeconds} วินาที`;
  return `${diffDays} วัน ${diffHours} ชั่วโมง ${diffMinutes} นาที`;

}


export { renderDbDate, renderDbTime, renderDbDateOnly, renderDbYearOnly, daysSince, diffDaysSince };
