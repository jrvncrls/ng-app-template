import { Injectable, Injector, inject } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';

import { ModalHost } from '../../../shared/components/modal-host/modal-host';
import { ModalRef } from './modal-ref';
import { MODAL_DATA, MODAL_REF } from './modal.tokens';

export interface ModalOptions<D = unknown> {
  title?: string;
  data?: D;
  testId?: string;
  /**
   * Disables backdrop-click and Escape dismissal. The opened component must
   * call `close()`/`dismiss()` on its injected `MODAL_REF` itself — useful
   * for a modal that shouldn't be dismissible mid-submit.
   */
  disableClose?: boolean;
}

/**
 * Opens a component into a CDK Overlay as a modal. Unlike the declarative
 * `Modal` component (toggled via a template-bound `open` model), this
 * supports real stacking: each call gets its own overlay, and CDK assigns
 * increasing z-index and routes Escape/backdrop-click to only the topmost
 * overlay automatically — no manual stack bookkeeping needed here.
 *
 * The opened component receives `MODAL_REF` (call `.close(result)` /
 * `.dismiss()` on it, typically from its own footer buttons) and
 * `MODAL_DATA` (the `data` passed in `options`) via DI.
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

  open<T, R = unknown>(component: ComponentType<T>, options: ModalOptions = {}): ModalRef<R> {
    const overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'app-modal-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    });

    const modalRef = new ModalRef<R>();
    modalRef.afterClosed().then(() => overlayRef.dispose());

    if (!options.disableClose) {
      overlayRef.backdropClick().subscribe(() => modalRef.dismiss());
      overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          modalRef.dismiss();
        }
      });
    }

    const modalInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: MODAL_REF, useValue: modalRef },
        { provide: MODAL_DATA, useValue: options.data ?? null },
      ],
    });

    const contentPortal = new ComponentPortal(component, null, modalInjector);
    const hostRef = overlayRef.attach(new ComponentPortal(ModalHost, null, modalInjector));

    hostRef.setInput('testId', options.testId ?? 'app-modal-host');
    hostRef.setInput('title', options.title ?? '');
    hostRef.setInput('contentPortal', contentPortal);
    hostRef.instance.closed.subscribe(() => modalRef.dismiss());

    return modalRef;
  }
}
