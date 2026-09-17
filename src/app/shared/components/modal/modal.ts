import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-modal',
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

  protected close(): void {
    this.open.set(false);
  }
}
