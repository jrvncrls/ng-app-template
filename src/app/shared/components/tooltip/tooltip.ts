import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
  },
})
export class Tooltip {
  readonly testId = input.required<string>();
  readonly text = input.required<string>();
  readonly position = input<TooltipPosition>('top');

  protected readonly visible = signal(false);

  protected show(): void {
    this.visible.set(true);
  }

  protected hide(): void {
    this.visible.set(false);
  }
}
