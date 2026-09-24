import { Directive, inject, input, TemplateRef } from '@angular/core';

export interface TableCellContext<T> {
  /** The row: `let-row`. */
  $implicit: T;
  /** What the column would have rendered by default: `let-value="value"`. */
  value: unknown;
  /** Index within the rows currently displayed: `let-index="index"`. */
  index: number;
}

/**
 * Overrides how one column renders its cells:
 *
 * ```html
 * <ng-template appTableCell="status" let-row let-value="value">
 *   <app-badge [status]="value">{{ value }}</app-badge>
 * </ng-template>
 * ```
 */
@Directive({
  selector: 'ng-template[appTableCell]',
  standalone: true,
})
export class TableCell<T = unknown> {
  /** The `key` of the column this template renders. */
  readonly columnKey = input.required<string>({ alias: 'appTableCell' });
  readonly template = inject<TemplateRef<TableCellContext<T>>>(TemplateRef);
}
