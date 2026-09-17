import { Pipe, PipeTransform } from '@angular/core';

const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
];

@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  private readonly formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  transform(value: Date | string | number | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    const elapsedSeconds = (date.getTime() - Date.now()) / 1000;

    for (const { unit, seconds } of UNITS) {
      if (Math.abs(elapsedSeconds) >= seconds) {
        return this.formatter.format(Math.round(elapsedSeconds / seconds), unit);
      }
    }

    return this.formatter.format(Math.round(elapsedSeconds), 'second');
  }
}
