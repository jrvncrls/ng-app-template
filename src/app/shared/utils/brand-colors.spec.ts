import { applyBrandColors, buildColorRamp, buildGreyRamp, hexToHsl } from './brand-colors';

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

    it('lightens the hover shade (500) for dark bases so hover stays visible', () => {
      const dark = buildColorRamp('#111827')!;
      expect(dark[400]).toBe('hsla(221, 39%, 11%, 1)');
      expect(dark[500]).toBe('hsla(221, 39%, 29%, 1)');
    });

    it('clamps lightness for very light inputs', () => {
      expect(buildColorRamp('#ffffff')![100]).toBe('hsla(0, 0%, 98%, 1)');
    });
  });

  describe('buildGreyRamp', () => {
    it('uses the base as the 900 shade and lightens the rest with the same hue', () => {
      expect(buildGreyRamp('#111827')).toEqual({
        50: 'hsla(221, 31%, 97%, 1)',
        100: 'hsla(221, 31%, 95%, 1)',
        200: 'hsla(221, 28%, 90%, 1)',
        300: 'hsla(221, 26%, 83%, 1)',
        400: 'hsla(221, 22%, 69%, 1)',
        500: 'hsla(221, 20%, 54%, 1)',
        600: 'hsla(221, 20%, 41%, 1)',
        700: 'hsla(221, 24%, 31%, 1)',
        800: 'hsla(221, 31%, 21%, 1)',
        900: 'hsla(221, 39%, 11%, 1)',
      });
    });

    it('returns null for an invalid color', () => {
      expect(buildGreyRamp('grey')).toBeNull();
    });
  });

  describe('applyBrandColors', () => {
    it('sets every shade of each provided role on the target', () => {
      const el = document.createElement('div');
      applyBrandColors(el, { primary: '#0b60ea', secondary: '#6a1fea' });
      expect(el.style.getPropertyValue('--color-primary-400')).toBe('hsla(217, 91%, 48%, 1)');
      expect(el.style.getPropertyValue('--color-secondary-100')).not.toBe('');
    });

    it('sets the grey scale from greyscaleBase', () => {
      const el = document.createElement('div');
      applyBrandColors(el, { greyscaleBase: '#111827' });
      expect(el.style.getPropertyValue('--color-grey-900')).toBe('hsla(221, 39%, 11%, 1)');
      expect(el.style.getPropertyValue('--color-grey-50')).not.toBe('');
      expect(el.style.getPropertyValue('--color-primary-400')).toBe('');
    });

    it('skips invalid colors', () => {
      const el = document.createElement('div');
      applyBrandColors(el, { primary: 'not-a-color' });
      expect(el.style.getPropertyValue('--color-primary-400')).toBe('');
    });
  });
});
