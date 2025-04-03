import dayjs from 'dayjs/esm';
import localizedFormat from 'dayjs/esm/plugin/localizedFormat';

/**
 *
 * @param date
 * @param format check: https://day.js.org/docs/en/display/format
 * @returns
 */
export const getAbsoluteDate = (
  date: Date | number | string | undefined | null,
  format: string = 'MMM d, y'
): string => {
  if (!date) return '';
  dayjs.extend(localizedFormat);
  return dayjs(date).format(format);
};
