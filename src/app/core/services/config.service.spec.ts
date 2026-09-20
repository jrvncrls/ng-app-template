import { TestBed } from '@angular/core/testing';

import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('populates the branding config on load', async () => {
    expect(service.config()).toBeNull();
    await service.load();
    expect(service.config()).toMatchObject({ brand: 'default', theme: 'light' });
  });

  it('applies the brand colors to <html> on load', async () => {
    await service.load();
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--color-primary-400')).not.toBe('');
    expect(style.getPropertyValue('--color-secondary-400')).not.toBe('');
    expect(style.getPropertyValue('--color-grey-900')).toBe('hsla(221, 39%, 11%, 1)');
    style.cssText = '';
  });
});
