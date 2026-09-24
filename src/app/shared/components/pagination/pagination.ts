import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  numberAttribute,
} from '@angular/core';

import { Select, SelectOption } from '../select/select';

/** A numbered page button, or a gap (`page: null`) standing in for hidden pages. */
export interface PaginationItem {
  key: string;
  page: number | null;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Always shows the first and last page, plus a window of `siblings * 2 + 1`
// pages around the current one. The window slides to stay full at either end,
// and a `…` stands in for whatever lies between it and the first/last page.
function buildItems(current: number, pageCount: number, siblings: number): PaginationItem[] {
  const asItems = (from: number, to: number): PaginationItem[] =>
    Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => {
      const page = from + i;
      return { key: `page-${page}`, page };
    });

  if (pageCount <= 1) {
    return asItems(1, pageCount);
  }

  // Pages strictly between the first and last one.
  const width = Math.min(siblings * 2 + 1, pageCount - 2);
  const start = Math.min(Math.max(current - siblings, 2), pageCount - width);
  const end = start + width - 1;

  return [
    ...asItems(1, 1),
    ...(start > 2 ? [{ key: 'start-gap', page: null }] : []),
    ...asItems(start, end),
    ...(end < pageCount - 1 ? [{ key: 'end-gap', page: null }] : []),
    ...asItems(pageCount, pageCount),
  ];
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [Select],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class Pagination {
  readonly testId = input.required<string>();
  /** Total number of items across every page. */
  readonly total = input.required<number, unknown>({ transform: numberAttribute });
  /** Current page, 1-based. Clamped to the valid range when displayed. */
  readonly page = model(1);
  readonly pageSize = model(DEFAULT_PAGE_SIZE_OPTIONS[0]);
  readonly pageSizeOptions = input<number[]>(DEFAULT_PAGE_SIZE_OPTIONS);
  /** Numbered pages shown either side of the current page. */
  readonly siblings = input(2, { transform: numberAttribute });
  readonly showPageSize = input(true, { transform: booleanAttribute });
  readonly showSummary = input(true, { transform: booleanAttribute });
  /** What is being counted in the summary: "Showing 1 to 8 of 50 entries". */
  readonly itemLabel = input<string>('entries');
  /** Prefix for the page-size dropdown: "Show 10". */
  readonly pageSizeLabel = input<string>('Show');

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly currentPage = computed(() =>
    Math.min(Math.max(this.page(), 1), this.pageCount()),
  );

  protected readonly items = computed(() =>
    buildItems(this.currentPage(), this.pageCount(), this.siblings()),
  );

  protected readonly firstItem = computed(() =>
    this.total() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );

  protected readonly lastItem = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.total()),
  );

  protected readonly sizeOptions = computed<SelectOption[]>(() => {
    // Keep the current size selectable even when it isn't one of the presets.
    const sizes = [...new Set([...this.pageSizeOptions(), this.pageSize()])].sort((a, b) => a - b);
    return sizes.map((size) => ({ label: `${this.pageSizeLabel()} ${size}`, value: `${size}` }));
  });

  protected goTo(page: number): void {
    const next = Math.min(Math.max(page, 1), this.pageCount());
    if (next !== this.currentPage()) {
      this.page.set(next);
    }
  }

  protected changePageSize(value: string | null): void {
    const size = Number(value);
    if (!size || size === this.pageSize()) {
      return;
    }
    this.pageSize.set(size);
    this.page.set(1);
  }
}
