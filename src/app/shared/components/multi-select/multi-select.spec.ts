import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiSelect } from './multi-select';

describe('MultiSelect', () => {
  let component: MultiSelect;
  let fixture: ComponentFixture<MultiSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSelect],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiSelect);
    fixture.componentRef.setInput('testId', 'stub-multi-select');
    fixture.componentRef.setInput('options', []);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
