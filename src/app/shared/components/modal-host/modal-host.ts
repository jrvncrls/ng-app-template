import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Portal, PortalModule } from '@angular/cdk/portal';

/**
 * Panel chrome for a `ModalService`-opened modal. Attached directly into a
 * CDK Overlay by `ModalService.open()` — not meant to be used from a
 * template. For a modal declared in a template, use `Modal` instead.
 */
@Component({
  selector: 'techyon-modal-host',
  standalone: true,
  imports: [PortalModule],
  templateUrl: './modal-host.html',
  styleUrl: './modal-host.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class ModalHost {
  readonly testId = input.required<string>();
  readonly title = input<string>('');
  readonly contentPortal = input.required<Portal<unknown>>();
  readonly closed = output<void>();
}
