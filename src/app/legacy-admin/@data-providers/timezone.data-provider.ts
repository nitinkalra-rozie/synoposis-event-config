import { InjectionToken } from '@angular/core';

const FALLBACK_TIMEZONES = [
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export function getUTCOffsetString(
  timeZone: string,
  date: Date = new Date()
): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      timeZoneName: 'shortOffset',
    });

    const parts = formatter.formatToParts(date);
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value;

    if (tzName) {
      // Example formats: "GMT+3", "GMT+0300", "GMT+03:00", "GMT-5", "GMT-0500", "GMT-05:00"
      const offset = tzName.replace('GMT', '');
      const match = offset.match(/^([+-])(\d{1,2})(:?(\d{2}))?$/);
      if (match) {
        const sign = match[1];
        let hours = match[2];
        let minutes = match[4] || '00'; // Default to '00' if minutes are missing
        hours = hours.padStart(1, '0');
        minutes = minutes.padStart(2, '0');

        return `${sign}${hours}:${minutes}`;
      }
    }

    return '+0:00';
  } catch {
    return '+0:00';
  }
}

export function findTimeZoneByOffset(
  offsetString: string,
  referenceDate: Date = new Date(),
  timeZones: { value: string; label: string }[] = []
): string | undefined {
  // Normalize the offset to match the format +HH:MM
  const normalizeOffset = (offset: string): string => {
    const normalizedOffset = offset.replace(/UTC|GMT/gi, '').trim();
    const match = normalizedOffset.match(
      /^([+-])(\d{1,2})(:?(\d{2}))?$|^([+-])(\d{3,4})$/
    );

    if (match) {
      let sign, hours, minutes;

      if (match[5]) {
        sign = match[5];
        const parts = match[6].padStart(4, '0');
        hours = parts.substring(0, 2);
        minutes = parts.substring(2, 4);
      } else {
        // Handle formats with colon or without
        sign = match[1];
        hours = match[2];
        minutes = match[4] || '00';
      }

      hours = hours.padStart(1, '0');
      minutes = minutes.padEnd(2, '0').padStart(2, '0');

      return `${sign}${hours}:${minutes}`;
    }

    return normalizedOffset;
  };

  const targetOffset = normalizeOffset(offsetString);
  for (const tz of timeZones) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz.value,
        timeZoneName: 'shortOffset',
      });
      const parts = formatter.formatToParts(referenceDate);
      const tzOffset = parts.find((p) => p.type === 'timeZoneName')?.value;

      if (tzOffset && normalizeOffset(tzOffset) === targetOffset) {
        return tz.value;
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

export const TIMEZONE_OPTIONS = new InjectionToken<
  { value: string; label: string }[]
>('TIMEZONE_OPTIONS', {
  factory: () => [
    { value: 'Pacific/Honolulu', label: 'UTC-10:00 – Hawaii Standard Time' },
    { value: 'America/Anchorage', label: 'UTC-9:00 – Alaska Time (AKST/AKDT)' },
    {
      value: 'America/Los_Angeles',
      label: 'UTC-8:00 – Pacific Time (PST/PDT)',
    },
    { value: 'America/Denver', label: 'UTC-7:00 – Mountain Time (MST/MDT)' },
    { value: 'America/Chicago', label: 'UTC-6:00 – Central Time (CST/CDT)' },
    { value: 'America/New_York', label: 'UTC-5:00 – Eastern Time (EST/EDT)' },
    { value: 'America/Caracas', label: 'UTC-4:00 – Venezuela Time' },
    { value: 'America/Sao_Paulo', label: 'UTC-3:00 – Brasília Time' },
    { value: 'Atlantic/Azores', label: 'UTC-1:00 – Azores Time' },
    {
      value: 'Europe/London',
      label: 'UTC±0:00 – Greenwich Mean Time (GMT/BST)',
    },
    {
      value: 'Europe/Paris',
      label: 'UTC+1:00 – Central European Time (CET/CEST)',
    },
    {
      value: 'Europe/Athens',
      label: 'UTC+2:00 – Eastern European Time (EET/EEST)',
    },
    { value: 'Europe/Moscow', label: 'UTC+3:00 – Moscow Standard Time' },
    { value: 'Asia/Tehran', label: 'UTC+3:30 – Iran Standard Time' },
    { value: 'Asia/Dubai', label: 'UTC+4:00 – Gulf Standard Time' },
    { value: 'Asia/Karachi', label: 'UTC+5:00 – Pakistan Standard Time' },
    { value: 'Asia/Kolkata', label: 'UTC+5:30 – India Standard Time' },
    { value: 'Asia/Dhaka', label: 'UTC+6:00 – Bangladesh Standard Time' },
    { value: 'Asia/Bangkok', label: 'UTC+7:00 – Indochina Time' },
    { value: 'Asia/Shanghai', label: 'UTC+8:00 – China Standard Time' },
    { value: 'Asia/Tokyo', label: 'UTC+9:00 – Japan Standard Time' },
    {
      value: 'Australia/Sydney',
      label: 'UTC+10:00 – Australian Eastern Time (AEST/AEDT)',
    },
    {
      value: 'Pacific/Auckland',
      label: 'UTC+12:00 – New Zealand Time (NZST/NZDT)',
    },
  ],
});
