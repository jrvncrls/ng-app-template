import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeStatus = 'default' | 'active' | 'suspended' | 'declined' | 'completed';

@Component({
  selector: 'app-badge',
  standalone: true,
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class Badge {
  readonly testId = input.required<string>();
  readonly status = input<BadgeStatus>('default');
}
