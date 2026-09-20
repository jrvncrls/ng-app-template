import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modal } from './modal';

describe('Modal', () => {
  let component: Modal;
  let fixture: ComponentFixture<Modal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modal],
    }).compileComponents();

    fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('testId', 'stub-modal');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('actions slot', () => {
    @Component({
      standalone: true,
      imports: [Modal],
      template: `
        <app-modal testId="modal" title="Confirm" [open]="true">
          <p>Body</p>
          <div modal-actions><button type="button">Save</button></div>
        </app-modal>
      `,
    })
    class DefaultHost {}

    @Component({
      standalone: true,
      imports: [Modal],
      template: `
        <app-modal testId="modal" title="Confirm" [open]="true" actionsAlign="center">
          <div modal-actions><button type="button">Save</button></div>
        </app-modal>
      `,
    })
    class CenteredHost {}

    it('right-aligns projected actions by default', () => {
      const host = TestBed.createComponent(DefaultHost);
      host.detectChanges();

      const footer: HTMLElement = host.nativeElement.querySelector('.modal__footer');
      expect(footer.classList).toContain('modal__footer--end');
      expect(footer.textContent).toContain('Save');
    });

    it('honors an explicit actionsAlign', () => {
      const host = TestBed.createComponent(CenteredHost);
      host.detectChanges();

      const footer: HTMLElement = host.nativeElement.querySelector('.modal__footer');
      expect(footer.classList).toContain('modal__footer--center');
    });
  });
});
