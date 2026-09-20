import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationService } from '../../../core/services/notification.service';
import { NotificationBar } from './notification-bar';

describe('NotificationBar', () => {
  let component: NotificationBar;
  let fixture: ComponentFixture<NotificationBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationBar],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBar);
    fixture.componentRef.setInput('testId', 'stub-notification-bar');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('prefixes each notification with the unicon for its type', () => {
    const notify = TestBed.inject(NotificationService);
    notify.success('Saved.');
    notify.error('Failed.');
    notify.warning('Careful.');
    notify.info('FYI.');
    fixture.detectChanges();

    const icons = [...fixture.nativeElement.querySelectorAll('.notification-bar__icon')].map(
      (el: HTMLElement) => el.className,
    );
    expect(icons).toHaveLength(4);
    expect(icons.join(' ')).toContain('uil-check-circle');
    expect(icons.join(' ')).toContain('uil-times-circle');
    expect(icons.join(' ')).toContain('uil-exclamation-triangle');
    expect(icons.join(' ')).toContain('uil-info-circle');
  });
});
