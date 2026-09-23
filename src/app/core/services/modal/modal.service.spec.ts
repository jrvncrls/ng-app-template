import { ApplicationRef, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';

import { ModalService } from './modal.service';
import { ModalRef } from './modal-ref';
import { MODAL_DATA, MODAL_REF } from './modal.tokens';

@Component({
  standalone: true,
  template: `<p>{{ data }}</p>`,
})
class StubContent {
  readonly data = inject(MODAL_DATA);
}

@Component({
  standalone: true,
  template: '',
})
class SelfClosingStub {
  private readonly modalRef = inject(MODAL_REF) as ModalRef<string>;

  constructor() {
    this.modalRef.close('saved');
  }
}

describe('ModalService', () => {
  let service: ModalService;
  let overlayContainer: OverlayContainer;
  let overlayContainerElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalService);
    overlayContainer = TestBed.inject(OverlayContainer);
    overlayContainerElement = overlayContainer.getContainerElement();
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('attaches the component, title, and testId into the overlay', () => {
    service.open(StubContent, { title: 'Edit user', testId: 'edit-user-modal', data: 'hello' });
    // The host component is attached via `ApplicationRef.attachView()`, so it
    // only renders on the next tick — force one instead of relying on zone
    // stabilization timing.
    TestBed.inject(ApplicationRef).tick();

    expect(overlayContainerElement.querySelector('.modal__title')?.textContent).toContain(
      'Edit user',
    );
    expect(overlayContainerElement.querySelector('[data-testid="edit-user-modal"]')).toBeTruthy();
    expect(overlayContainerElement.textContent).toContain('hello');
  });

  it('resolves afterClosed() with the result the opened component passes to MODAL_REF.close()', async () => {
    const modalRef = service.open<SelfClosingStub, string>(SelfClosingStub);

    await expect(modalRef.afterClosed()).resolves.toBe('saved');
  });

  it('dismisses and removes the overlay on backdrop click', async () => {
    const modalRef = service.open(StubContent);
    const backdrop: HTMLElement = overlayContainerElement.querySelector('.cdk-overlay-backdrop')!;

    backdrop.click();

    await expect(modalRef.afterClosed()).resolves.toBeUndefined();
    expect(overlayContainerElement.querySelector('.modal__body')).toBeNull();
  });

  it('dismisses on Escape', async () => {
    const modalRef = service.open(StubContent);

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    await expect(modalRef.afterClosed()).resolves.toBeUndefined();
  });

  it('ignores backdrop click and Escape when disableClose is set', async () => {
    service.open(StubContent, { disableClose: true });
    const backdrop: HTMLElement = overlayContainerElement.querySelector('.cdk-overlay-backdrop')!;

    backdrop.click();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await Promise.resolve();

    expect(overlayContainerElement.querySelector('.modal__body')).toBeTruthy();
  });

  it('stacks multiple modals and routes Escape only to the topmost', async () => {
    const first = service.open(StubContent, { testId: 'first' });
    const second = service.open(StubContent, { testId: 'second' });

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await expect(second.afterClosed()).resolves.toBeUndefined();

    expect(overlayContainerElement.querySelector('[data-testid="second"]')).toBeNull();
    expect(overlayContainerElement.querySelector('[data-testid="first"]')).toBeTruthy();

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await expect(first.afterClosed()).resolves.toBeUndefined();
  });
});
