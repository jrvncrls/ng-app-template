import { applyBrandColors, buildColorRamp, hexToHsl } from './brand-colors';

describe('brand-colors', () => {
  describe('hexToHsl', () => {
    it('converts a hex color to HSL', () => {
      const hsl = hexToHsl('#0b60ea');
      expect(Math.round(hsl!.h)).toBe(217);
      expect(Math.round(hsl!.s)).toBe(91);
      expect(Math.round(hsl!.l)).toBe(48);
    });

    it('returns null for anything but a 6-digit hex', () => {
      expect(hexToHsl('blue')).toBeNull();
      expect(hexToHsl('#fff')).toBeNull();
    });
  });

  describe('buildColorRamp', () => {
    it('reproduces the default primary ramp from its 400 shade', () => {
      expect(buildColorRamp('#0b60ea')).toEqual({
        100: 'hsla(217, 91%, 93%, 1)',
        200: 'hsla(217, 91%, 80%, 1)',
        300: 'hsla(217, 91%, 60%, 1)',
        400: 'hsla(217, 91%, 48%, 1)',
        500: 'hsla(217, 91%, 38%, 1)',
      });
    });

    it('clamps lightness for very light or dark inputs', () => {
      expect(buildColorRamp('#ffffff')![100]).toBe('hsla(0, 0%, 98%, 1)');
      expect(buildColorRamp('#000000')![500]).toBe('hsla(0, 0%, 4%, 1)');
    });
  });

  describe('applyBrandColors', () => {
    it('sets every shade of each provided role on the target', () => {
      const el = document.createElement('div');
      applyBrandColors(el, { primary: '#0b60ea', secondary: '#6a1fea' });
      expect(el.style.getPropertyValue('--color-primary-400')).toBe('hsla(217, 91%, 48%, 1)');
      expect(el.style.getPropertyValue('--color-secondary-100')).not.toBe('');
    });

    it('skips invalid colors', () => {
      const el = document.createElement('div');
      applyBrandColors(el, { primary: 'not-a-color' });
      expect(el.style.getPropertyValue('--color-primary-400')).toBe('');
    });
  });
});
