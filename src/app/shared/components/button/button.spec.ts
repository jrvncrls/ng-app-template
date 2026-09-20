import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Button } from './button';

describe('Button', () => {
  let component: Button;
  let fixture: ComponentFixture<Button>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Button],
    }).compileComponents();

    fixture = TestBed.createComponent(Button);
    fixture.componentRef.setInput('testId', 'stub-button');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to the md size', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('button--md');
    expect(button.classList).toContain('button--primary');
  });

  it('applies the size and variant classes together', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('button--lg');
    expect(button.classList).toContain('button--secondary');
    expect(button.classList).not.toContain('button--md');
  });

  it('is not block by default', () => {
    expect(fixture.nativeElement.classList).not.toContain('button-block');
  });

  it('marks the host as block when `block` is set', () => {
    fixture.componentRef.setInput('block', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.classList).toContain('button-block');
  });
});
