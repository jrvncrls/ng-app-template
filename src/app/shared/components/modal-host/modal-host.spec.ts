import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentPortal } from '@angular/cdk/portal';

import { ModalHost } from './modal-host';

@Component({
  standalone: true,
  template: `<p>Stub body</p>`,
})
class StubContent {}

describe('ModalHost', () => {
  let fixture: ComponentFixture<ModalHost>;
  let component: ModalHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalHost],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalHost);
    fixture.componentRef.setInput('testId', 'stub-modal-host');
    fixture.componentRef.setInput('contentPortal', new ComponentPortal(StubContent));
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the testId as data-testid on the host', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.getAttribute('data-testid')).toBe('stub-modal-host');
  });

  it('renders the title only when provided', () => {
    let title = fixture.nativeElement.querySelector('.modal__title');
    expect(title).toBeNull();

    fixture.componentRef.setInput('title', 'Edit user');
    fixture.detectChanges();

    title = fixture.nativeElement.querySelector('.modal__title');
    expect(title.textContent).toContain('Edit user');
  });

  it('renders the attached content portal into the body', () => {
    const body: HTMLElement = fixture.nativeElement.querySelector('.modal__body');
    expect(body.textContent).toContain('Stub body');
  });

  it('emits closed when the close button is clicked', () => {
    const closed = vi.fn();
    component.closed.subscribe(closed);

    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector('.modal__close');
    closeButton.click();

    expect(closed).toHaveBeenCalledOnce();
  });
});
