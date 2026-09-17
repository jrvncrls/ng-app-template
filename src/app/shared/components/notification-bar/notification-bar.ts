import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bar',
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

  protected dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}
