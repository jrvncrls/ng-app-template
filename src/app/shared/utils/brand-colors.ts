// Runtime brand colors. The config supplies one hex color per role (the 400
// shade); the other shades are derived by shifting lightness with the same
// offsets the default brand's ramps use, then written over the primitive
// `--color-{role}-{shade}` custom properties. Semantic tokens reference those
// vars, so every component repaints.

export type BrandColorRole = 'primary' | 'secondary';

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;

// Lightness offset from the 400 shade, per shade.
const SHADE_LIGHTNESS_OFFSETS: Record<number, number> = {
  100: 45,
  200: 32,
  300: 12,
  400: 0,
  500: -10,
};

export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const match = HEX_PATTERN.exec(hex);
  if (!match) return null;

  const value = parseInt(match[1], 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l: l * 100 };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 };
}

export function buildColorRamp(hex: string): Record<number, string> | null {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;

  const ramp: Record<number, string> = {};
  for (const [shade, offset] of Object.entries(SHADE_LIGHTNESS_OFFSETS)) {
    const l = Math.min(98, Math.max(4, hsl.l + offset));
    ramp[Number(shade)] = `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(l)}%, 1)`;
  }
  return ramp;
}

// Invalid colors are skipped, so the brand's compiled SCSS values stay in effect.
export function applyBrandColors(
  target: HTMLElement,
  colors: Partial<Record<BrandColorRole, string>>,
): void {
  for (const [role, hex] of Object.entries(colors)) {
    const ramp = hex ? buildColorRamp(hex) : null;
    if (!ramp) continue;
    for (const [shade, value] of Object.entries(ramp)) {
      target.style.setProperty(`--color-${role}-${shade}`, value);
    }
  }
}
