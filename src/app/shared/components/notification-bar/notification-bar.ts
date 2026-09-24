import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import {
  NotificationService,
  NotificationType,
} from '../../../core/services/notification/notification.service';

@Component({
  selector: 'techyon-notification-bar',
  standalone: true,
  templateUrl: './notification-bar.html',
  styleUrl: './notification-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class NotificationBar {
  readonly testId = input.required<string>();

  private readonly notificationService = inject(NotificationService);
  private readonly notifications = this.notificationService.notifications;

  protected readonly topNotifications = computed(() =>
    this.notifications().filter((notification) => notification.position === 'top'),
  );
  protected readonly bottomNotifications = computed(() =>
    this.notifications().filter((notification) => notification.position === 'bottom'),
  );

  // Unicons (`uil`) class per notification type.
  protected readonly icons: Record<NotificationType, string> = {
    success: 'uil-check-circle',
    error: 'uil-times-circle',
    warning: 'uil-exclamation-triangle',
    info: 'uil-info-circle',
  };

  protected dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}
