import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { startOfHour } from 'date-fns';

const TZ = 'Europe/Warsaw';

export function startOfHourWarsaw(now = new Date()): Date {
  const zoned = toZonedTime(now, TZ);
  const truncated = startOfHour(zoned);
  return fromZonedTime(truncated, TZ);
}
