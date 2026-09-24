import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableColumn, TableSort } from './table';
import { Table } from './table';
import { TableCell } from './table-cell';

interface Person {
  id: number;
  name: string;
  age: number | null;
}

const PEOPLE: Person[] = [
  { id: 1, name: 'Carol', age: 41 },
  { id: 2, name: 'Alice', age: 29 },
  { id: 3, name: 'Bob', age: null },
];

@Component({
  standalone: true,
  imports: [Table, TableCell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-table
      testId="people"
      [columns]="columns"
      [data]="data()"
      [selectable]="selectable()"
      [(selection)]="selection"
      [rowKey]="rowKey"
      [(sort)]="sort"
      [serverSide]="serverSide()"
      [page]="page()"
      [pageSize]="pageSize()"
      [loading]="loading()"
      [clickableRows]="true"
      (rowClick)="clicked.set($event)"
    >
      <ng-template appTableCell="name" let-row let-value="value">
        <strong class="custom">{{ value }} #{{ row.id }}</strong>
      </ng-template>
    </app-table>
  `,
})
class TestHost {
  readonly columns: TableColumn<Person>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'age', header: 'Age', sortable: true, align: 'end' },
  ];
  readonly rowKey = (row: Person) => row.id;
  readonly data = signal<Person[]>(PEOPLE);
  readonly selectable = signal(false);
  readonly selection = signal<Person[]>([]);
  readonly sort = signal<TableSort | null>(null);
  readonly serverSide = signal(false);
  readonly page = signal(1);
  readonly pageSize = signal<number | null>(null);
  readonly loading = signal(false);
  readonly clicked = signal<Person | null>(null);
}

describe('Table', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  const rows = () => Array.from(el.querySelectorAll<HTMLElement>('tbody tr.table__row'));
  const cells = (row: HTMLElement) =>
    Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim());
  const firstColumn = () => rows().map((row) => cells(row)[0]);
  const sortButton = (key: string) =>
    el.querySelector<HTMLButtonElement>(`[data-testid="people-sort-${key}"]`)!;
  const rowCheckbox = (index: number) =>
    el.querySelector<HTMLInputElement>(`[data-testid="people-select-${index}"] input`)!;
  const selectAll = () =>
    el.querySelector<HTMLInputElement>('[data-testid="people-select-all"] input')!;

  async function stable(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    await stable();
  });

  it('renders a header per column and a row per item', () => {
    const headers = Array.from(el.querySelectorAll('thead th')).map((th) => th.textContent?.trim());
    expect(headers).toEqual(['Name', 'Age']);
    expect(rows()).toHaveLength(3);
  });

  it('shows a dash for empty values and lets a cell template override a column', () => {
    expect(cells(rows()[0])).toEqual(['Carol #1', '41']);
    expect(cells(rows()[2])).toEqual(['Bob #3', '—']);
    expect(el.querySelectorAll('.custom')).toHaveLength(3);
  });

  it('shows the empty message when there is no data', async () => {
    host.data.set([]);
    await stable();
    expect(el.querySelector('.table__empty')?.textContent).toContain('No data to display');
  });

  it('shows skeleton rows instead of data while loading', async () => {
    host.loading.set(true);
    await stable();
    expect(rows()).toHaveLength(0);
    expect(el.querySelectorAll('.table__skeleton').length).toBeGreaterThan(0);
    expect(el.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
  });

  describe('sorting', () => {
    it('cycles ascending → descending → unsorted', async () => {
      sortButton('name').click();
      await stable();
      expect(firstColumn()).toEqual(['Alice #2', 'Bob #3', 'Carol #1']);
      expect(el.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending');

      sortButton('name').click();
      await stable();
      expect(firstColumn()).toEqual(['Carol #1', 'Bob #3', 'Alice #2']);
      expect(el.querySelector('th')?.getAttribute('aria-sort')).toBe('descending');

      sortButton('name').click();
      await stable();
      expect(firstColumn()).toEqual(['Carol #1', 'Alice #2', 'Bob #3']);
      expect(host.sort()).toBeNull();
    });

    it('keeps empty values last in both directions', async () => {
      sortButton('age').click();
      await stable();
      expect(cells(rows()[2])[1]).toBe('—');

      sortButton('age').click();
      await stable();
      expect(cells(rows()[0])[1]).toBe('41');
      expect(cells(rows()[2])[1]).toBe('—');
    });

    it('reports the sort but leaves row order to the consumer when serverSide', async () => {
      host.serverSide.set(true);
      await stable();
      sortButton('name').click();
      await stable();
      expect(host.sort()).toEqual({ key: 'name', direction: 'asc' });
      expect(firstColumn()).toEqual(['Carol #1', 'Alice #2', 'Bob #3']);
    });
  });

  describe('paging', () => {
    it('shows only the current page when pageSize is set, sorted before slicing', async () => {
      host.pageSize.set(2);
      host.sort.set({ key: 'name', direction: 'asc' });
      await stable();
      expect(firstColumn()).toEqual(['Alice #2', 'Bob #3']);

      host.page.set(2);
      await stable();
      expect(firstColumn()).toEqual(['Carol #1']);
    });

    it('clamps an out-of-range page to the last one', async () => {
      host.pageSize.set(2);
      host.page.set(99);
      await stable();
      expect(firstColumn()).toEqual(['Bob #3']);
    });
  });

  describe('selection', () => {
    beforeEach(async () => {
      host.selectable.set(true);
      await stable();
    });

    it('selects and deselects a row', async () => {
      rowCheckbox(1).click();
      await stable();
      expect(host.selection()).toEqual([PEOPLE[1]]);
      expect(rows()[1].classList).toContain('table__row--selected');

      rowCheckbox(1).click();
      await stable();
      expect(host.selection()).toEqual([]);
    });

    it('select-all toggles every displayed row and shows a mixed state for part of them', async () => {
      rowCheckbox(0).click();
      await stable();
      expect(selectAll().indeterminate).toBe(true);
      expect(selectAll().checked).toBe(false);

      selectAll().click();
      await stable();
      expect(host.selection()).toHaveLength(3);
      expect(selectAll().checked).toBe(true);

      selectAll().click();
      await stable();
      expect(host.selection()).toEqual([]);
    });

    it('select-all only touches the current page and keeps selections from other pages', async () => {
      host.pageSize.set(2);
      host.selection.set([PEOPLE[2]]);
      await stable();

      selectAll().click();
      await stable();
      expect(
        host
          .selection()
          .map((p) => p.id)
          .sort(),
      ).toEqual([1, 2, 3]);

      selectAll().click();
      await stable();
      expect(host.selection()).toEqual([PEOPLE[2]]);
    });

    it('matches selected rows by rowKey when data is replaced with new objects', async () => {
      host.selection.set([PEOPLE[0]]);
      host.data.set(PEOPLE.map((p) => ({ ...p })));
      await stable();
      expect(rows()[0].classList).toContain('table__row--selected');
    });
  });

  it('emits rowClick with the row, but not when a row checkbox is clicked', async () => {
    host.selectable.set(true);
    await stable();

    rowCheckbox(0).click();
    await stable();
    expect(host.clicked()).toBeNull();

    rows()[1].click();
    expect(host.clicked()).toEqual(PEOPLE[1]);
  });
});
