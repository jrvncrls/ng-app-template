import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'titlecase',
  standalone: true,
})
export class TitlecasePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value
      .toLowerCase()
      .split(' ')
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
      .join(' ');
  }
}
