import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalService } from '../../core/services/modal/modal.service';
import { MODAL_REF } from '../../core/services/modal/modal.tokens';
import { ModalRef } from '../../core/services/modal/modal-ref';
import { Button } from '../../shared/components/button/button';
import { InputText } from '../../shared/components/input-text/input-text';
import { ShowcaseConfirmModal } from './showcase-confirm-modal';

export interface ShowcaseFormResult {
  name: string;
}

/**
 * Opened via `ModalService.open()` (see `ComponentShowcase.openServiceModal`) —
 * demonstrates a service-driven modal that hosts a form and can itself stack
 * a second modal on top (the discard-changes confirm).
 */
@Component({
  selector: 'app-showcase-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, Button, InputText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <app-input-text testId="showcase-service-modal-name" label="Name" formControlName="name" />
      <div class="d-flex justify-content-end gap-2 mt-4">
        <app-button testId="showcase-service-modal-discard" variant="secondary" (click)="discard()">
          Cancel
        </app-button>
        <app-button testId="showcase-service-modal-save" type="submit">Save</app-button>
      </div>
    </form>
  `,
})
export class ShowcaseFormModal {
  private readonly fb = inject(FormBuilder);
  private readonly modalService = inject(ModalService);
  private readonly modalRef = inject(MODAL_REF) as ModalRef<ShowcaseFormResult>;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      this.modalRef.close(this.form.getRawValue());
    }
  }

  protected discard(): void {
    if (this.form.pristine) {
      this.modalRef.dismiss();
      return;
    }

    this.modalService
      .open<ShowcaseConfirmModal, boolean>(ShowcaseConfirmModal, {
        title: 'Discard changes?',
        testId: 'showcase-confirm-modal',
      })
      .afterClosed()
      .then((confirmed) => {
        if (confirmed) {
          this.modalRef.dismiss();
        }
      });
  }
}
