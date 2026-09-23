import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPosition = 'top' | 'bottom';

export interface NotificationConfig {
  /** milliseconds; 0 disables auto-dismiss. Default 4000. */
  duration?: number;
  /** Default 'top'. */
  position?: NotificationPosition;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  duration: number;
  position: NotificationPosition;
}

const DEFAULT_DURATION_MS = 4000;
const DEFAULT_POSITION: NotificationPosition = 'top';

// Signal-based replacement for a third-party toast library. Inject this as
// `notify` at call sites: `private readonly notify = inject(NotificationService)`.
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  success(message: string, config?: NotificationConfig): void {
    this.push('success', message, config);
  }

  error(message: string, config?: NotificationConfig): void {
    this.push('error', message, config);
  }

  warning(message: string, config?: NotificationConfig): void {
    this.push('warning', message, config);
  }

  info(message: string, config?: NotificationConfig): void {
    this.push('info', message, config);
  }

  dismiss(id: string): void {
    this._notifications.update((list) => list.filter((notification) => notification.id !== id));
  }

  private push(type: NotificationType, message: string, config?: NotificationConfig): void {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      type,
      message,
      duration: config?.duration ?? DEFAULT_DURATION_MS,
      position: config?.position ?? DEFAULT_POSITION,
    };

    this._notifications.update((list) => [...list, notification]);

    if (notification.duration > 0) {
      setTimeout(() => this.dismiss(notification.id), notification.duration);
    }
  }
}
