import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'techyon-button',
  standalone: true,
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
    '[class.button-block]': 'block()',
  },
})
export class Button {
  readonly testId = input.required<string>();
  readonly variant = input<ButtonVariant>('primary');
  /** `md` is at least 44px tall (the touch-target minimum); `sm` grows to 44px on touch devices. */
  readonly size = input<ButtonSize>('md');
  /** Stretches the button to the full width of its container. */
  readonly block = input(false, { transform: booleanAttribute });
  readonly type = input<ButtonType>('button');
  readonly disabled = input<boolean>(false);
}
