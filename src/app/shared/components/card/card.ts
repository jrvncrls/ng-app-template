import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'techyon-card',
  standalone: true,
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class Card {
  readonly testId = input.required<string>();
  readonly title = input<string>('');
}
