import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
}

// Renders the tab strip only. Consumers read `activeId()` (or bind
// `[(activeId)]`) to decide which panel to show in the projected content —
// keeps this component from having to know anything about panel content.
@Component({
  selector: 'app-tabs',
  standalone: true,
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class Tabs {
  readonly testId = input.required<string>();
  readonly tabs = input.required<TabItem[]>();
  readonly activeId = model<string>('');

  protected selectTab(id: string): void {
    this.activeId.set(id);
  }
}
