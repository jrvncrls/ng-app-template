import { InjectionToken } from '@angular/core';

import { ModalRef } from './modal-ref';

/** Injected into a component opened via `ModalService.open()`. */
export const MODAL_REF = new InjectionToken<ModalRef<unknown>>('app.modalRef');

/** The `data` passed to `ModalService.open(component, { data })`, or `null`. */
export const MODAL_DATA = new InjectionToken<unknown>('app.modalData');
