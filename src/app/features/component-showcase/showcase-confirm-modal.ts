import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MODAL_REF } from '../../core/services/modal/modal.tokens';
import { ModalRef } from '../../core/services/modal/modal-ref';
import { Button } from '../../shared/components/button/button';

/**
 * Opened by `ShowcaseFormModal` via `ModalService` — demonstrates a modal
 * stacked on top of another already-open modal.
 */
@Component({
  selector: 'app-showcase-confirm-modal',
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-body-md-regular">Discard your changes to this profile?</p>
    <div class="d-flex justify-content-end gap-2 mt-4">
      <app-button testId="showcase-confirm-keep" variant="ghost" (click)="modalRef.close(false)">
        Keep editing
      </app-button>
      <app-button testId="showcase-confirm-discard" variant="danger" (click)="modalRef.close(true)">
        Discard
      </app-button>
    </div>
  `,
})
export class ShowcaseConfirmModal {
  protected readonly modalRef = inject(MODAL_REF) as ModalRef<boolean>;
}
