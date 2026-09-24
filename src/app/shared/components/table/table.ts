import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';

import { Checkbox } from '../checkbox/checkbox';
import { TableCell } from './table-cell';

export type TableAlign = 'start' | 'center' | 'end';
export type TableDensity = 'comfortable' | 'compact';
export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  key: string;
  direction: SortDirection;
}

export interface TableColumn<T> {
  /** Identifies the column; also the property read from each row unless `value` is set. */
  key: string;
  header: string;
  sortable?: boolean;
  align?: TableAlign;
  /** Any CSS width, e.g. `'12rem'`. Columns without one share the remaining space. */
  width?: string;
  /** Derives the cell value (and the value sorted on) when it isn't a plain `row[key]`. */
  value?: (row: T) => unknown;
}

const SKELETON_ROWS = 5;

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

// Empty values always sort last, ascending or descending, so `sign` only
// flips real comparisons.
function compareValues(a: unknown, b: unknown, sign: 1 | -1): number {
  if (isEmpty(a) || isEmpty(b)) {
    return Number(isEmpty(a)) - Number(isEmpty(b));
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return sign * (a - b);
  }
  if (a instanceof Date && b instanceof Date) {
    return sign * (a.getTime() - b.getTime());
  }
  return (
    sign * String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
  );
}

@Component({
  selector: 'techyon-table',
  standalone: true,
  imports: [Checkbox, NgTemplateOutlet],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class Table<T> {
  readonly testId = input.required<string>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly data = input.required<T[]>();

  /** Adds a leading checkbox column; bind `[(selection)]` to read it. */
  readonly selectable = input(false, { transform: booleanAttribute });
  readonly selection = model<T[]>([]);
  /**
   * Identifies a row for `@for` tracking and for `selection`, so selected rows
   * stay selected when `data` is replaced with fresh objects (e.g. `(row) => row.id`).
   */
  readonly rowKey = input<(row: T) => unknown>((row) => row);

  /** Active sort; `null` is unsorted. Clicking a sortable header cycles asc → desc → none. */
  readonly sort = model<TableSort | null>(null);
  /**
   * The consumer sorts and paginates (typically on the server): `data` is rendered exactly as
   * given and `sort` only reports what was asked for. Otherwise the table sorts `data` itself.
   */
  readonly serverSide = input(false, { transform: booleanAttribute });
  /** Client-side paging, alongside `<techyon-pagination>`. Leave `pageSize` unset to show every row. */
  readonly page = input(1, { transform: numberAttribute });
  readonly pageSize = input<number | null>(null);

  readonly loading = input(false, { transform: booleanAttribute });
  readonly emptyMessage = input<string>('No data to display');
  readonly density = input<TableDensity>('comfortable');
  /** Caps the height (any CSS length); the body scrolls and the header stays pinned. */
  readonly maxHeight = input<string | null>(null);
  /** Highlights rows on hover and emits `rowClick` when one is clicked. */
  readonly clickableRows = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);
  readonly selectAllLabel = input<string>('Select all rows');
  readonly selectRowLabel = input<string>('Select row');

  readonly rowClick = output<T>();

  private readonly cellDefs = contentChildren<TableCell<T>>(TableCell);

  protected readonly cellTemplates = computed(
    () => new Map(this.cellDefs().map((def) => [def.columnKey(), def.template])),
  );

  private readonly sortedRows = computed(() => {
    const rows = this.data();
    const sort = this.sort();
    const column = sort && this.columns().find((c) => c.key === sort.key);
    if (this.serverSide() || !sort || !column) {
      return rows;
    }
    const sign = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) =>
      compareValues(this.cellValue(column, a), this.cellValue(column, b), sign),
    );
  });

  protected readonly rows = computed(() => {
    const rows = this.sortedRows();
    const size = this.pageSize();
    if (this.serverSide() || !size) {
      return rows;
    }
    const lastPage = Math.max(1, Math.ceil(rows.length / size));
    const start = (Math.min(Math.max(this.page(), 1), lastPage) - 1) * size;
    return rows.slice(start, start + size);
  });

  protected readonly skeletonRows = computed(() =>
    Array.from({ length: this.pageSize() ?? SKELETON_ROWS }, (_, i) => i),
  );

  protected readonly skeletonCells = computed(() =>
    Array.from({ length: this.columnCount() }, (_, i) => i),
  );

  protected readonly columnCount = computed(
    () => this.columns().length + (this.selectable() ? 1 : 0),
  );

  private readonly selectedKeys = computed(
    () => new Set(this.selection().map((row) => this.rowKey()(row))),
  );

  protected readonly allSelected = computed(() => {
    const rows = this.rows();
    const keys = this.selectedKeys();
    return rows.length > 0 && rows.every((row) => keys.has(this.rowKey()(row)));
  });

  protected readonly someSelected = computed(
    () =>
      !this.allSelected() && this.rows().some((row) => this.selectedKeys().has(this.rowKey()(row))),
  );

  protected cellValue(column: TableColumn<T>, row: T): unknown {
    return column.value ? column.value(row) : (row as Record<string, unknown>)[column.key];
  }

  protected isSelected(row: T): boolean {
    return this.selectedKeys().has(this.rowKey()(row));
  }

  /** Selects or clears the rows on the current page; selections on other pages are kept. */
  protected toggleAll(checked: boolean): void {
    const shown = new Set(this.rows().map((row) => this.rowKey()(row)));
    const others = this.selection().filter((row) => !shown.has(this.rowKey()(row)));
    this.selection.set(checked ? [...others, ...this.rows()] : others);
  }

  protected toggleRow(row: T, checked: boolean): void {
    const key = this.rowKey()(row);
    const others = this.selection().filter((r) => this.rowKey()(r) !== key);
    this.selection.set(checked ? [...others, row] : others);
  }

  protected toggleSort(column: TableColumn<T>): void {
    const current = this.sort();
    if (current?.key !== column.key) {
      this.sort.set({ key: column.key, direction: 'asc' });
    } else if (current.direction === 'asc') {
      this.sort.set({ key: column.key, direction: 'desc' });
    } else {
      this.sort.set(null);
    }
  }

  protected ariaSort(column: TableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) {
      return null;
    }
    const sort = this.sort();
    if (sort?.key !== column.key) {
      return 'none';
    }
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIcon(column: TableColumn<T>): string {
    const sort = this.sort();
    if (sort?.key !== column.key) {
      return 'uil-sort';
    }
    return sort.direction === 'asc' ? 'uil-arrow-up' : 'uil-arrow-down';
  }
}
