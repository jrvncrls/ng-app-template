import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export type ModalActionsAlign = 'start' | 'center' | 'end';

@Component({
  selector: 'techyon-modal',
  standalone: true,
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class Modal {
  readonly testId = input.required<string>();
  readonly title = input<string>('');
  readonly open = model<boolean>(false);
  /** Alignment of the buttons projected into the `modal-actions` slot. */
  readonly actionsAlign = input<ModalActionsAlign>('end');

  protected close(): void {
    this.open.set(false);
  }
}
