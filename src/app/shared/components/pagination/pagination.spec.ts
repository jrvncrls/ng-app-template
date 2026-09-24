import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pagination } from './pagination';

@Component({
  standalone: true,
  imports: [Pagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<techyon-pagination
    testId="pager"
    [total]="total()"
    [(page)]="page"
    [(pageSize)]="pageSize"
    [siblings]="siblings()"
    [showPageSize]="showPageSize()"
  />`,
})
class TestHost {
  readonly total = signal(50);
  readonly page = signal(1);
  readonly pageSize = signal(8);
  readonly siblings = signal(2);
  readonly showPageSize = signal(false);
}

describe('Pagination', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  const labels = () =>
    Array.from(el.querySelectorAll('.pagination__pages > *')).map((node) =>
      node.classList.contains('pagination__gap') ? '…' : node.textContent?.trim(),
    );
  const button = (label: string) =>
    el.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

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

  it('shows the item range and total', () => {
    expect(el.querySelector('.pagination__summary')?.textContent?.trim()).toBe(
      'Showing 1 to 8 of 50 entries',
    );
  });

  it('clips the last range to the total', async () => {
    host.page.set(7);
    await stable();
    expect(el.querySelector('.pagination__summary')?.textContent?.trim()).toBe(
      'Showing 49 to 50 of 50 entries',
    );
  });

  it('reads "0 to 0" when empty', async () => {
    host.total.set(0);
    await stable();
    expect(el.querySelector('.pagination__summary')?.textContent?.trim()).toBe(
      'Showing 0 to 0 of 0 entries',
    );
  });

  describe('page numbers', () => {
    it('lists every page when they all fit', async () => {
      host.total.set(24);
      await stable();
      expect(labels()).toEqual(['', '1', '2', '3', '']);
    });

    it('shows a sliding window with a gap for the hidden pages', async () => {
      host.pageSize.set(5); // 10 pages
      await stable();
      const numbers = () => labels().slice(1, -1);
      expect(numbers()).toEqual(['1', '2', '3', '4', '5', '6', '…', '10']);

      host.page.set(4);
      await stable();
      expect(numbers()).toEqual(['1', '2', '3', '4', '5', '6', '…', '10']);

      host.page.set(5);
      await stable();
      expect(numbers()).toEqual(['1', '…', '3', '4', '5', '6', '7', '…', '10']);

      host.page.set(10);
      await stable();
      expect(numbers()).toEqual(['1', '…', '5', '6', '7', '8', '9', '10']);
    });

    it('honours a custom number of siblings', async () => {
      host.pageSize.set(5);
      host.siblings.set(1);
      host.page.set(5);
      await stable();
      expect(labels().slice(1, -1)).toEqual(['1', '…', '4', '5', '6', '…', '10']);
    });

    it('marks the current page', () => {
      const active = el.querySelector('[aria-current="page"]');
      expect(active?.textContent?.trim()).toBe('1');
    });
  });

  describe('navigation', () => {
    it('goes to the clicked page', async () => {
      button('Page 3').click();
      await stable();
      expect(host.page()).toBe(3);
    });

    it('steps with previous and next, disabled at either end', async () => {
      expect(button('Previous page').disabled).toBe(true);

      button('Next page').click();
      await stable();
      expect(host.page()).toBe(2);
      expect(button('Previous page').disabled).toBe(false);

      host.page.set(7);
      await stable();
      expect(button('Next page').disabled).toBe(true);
    });
  });

  describe('page size', () => {
    beforeEach(async () => {
      host.showPageSize.set(true);
      await stable();
    });

    it('labels the dropdown with the current size', () => {
      // The Select renders its options in an overlay, so check the source of truth instead.
      const trigger = el.querySelector('[data-testid="pager-page-size"] .select__value');
      expect(trigger?.textContent?.trim()).toBe('Show 8');
    });

    it('can be hidden along with the summary', async () => {
      host.showPageSize.set(false);
      await stable();
      expect(el.querySelector('[data-testid="pager-page-size"]')).toBeNull();
    });
  });
});
