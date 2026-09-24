import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LoadingService } from './core/services/loading/loading.service';
import { NotificationBar } from './shared/components/notification-bar/notification-bar';

@Component({
  selector: 'techyon-root',
  standalone: true,
  imports: [RouterOutlet, NotificationBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly loading = inject(LoadingService);
}
