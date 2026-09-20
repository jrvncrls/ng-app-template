// Runtime brand colors. The config supplies one hex color per role (the 400
// shade for primary/secondary, the 900 shade for greyscale); the other shades
// are derived by shifting lightness with the same offsets the default brand's
// ramps use, then written over the primitive `--color-{role}-{shade}` custom
// properties. Semantic tokens reference those vars, so every component
// repaints.

export type BrandColors = Partial<{
  primary: string;
  secondary: string;
  /** Becomes the grey 900 shade; the lighter shades are derived from it. */
  greyscaleBase: string;
}>;

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;

// Shade 500 drives the hover/active states. Darkening a color that is already
// near-black is invisible (L 11% -> 4%), so for dark bases it goes lighter.
const DARK_BASE_LIGHTNESS = 35;
const DARK_BASE_INTERACTION_OFFSET = 18;

// Lightness offset from the 400 shade, per shade.
const SHADE_LIGHTNESS_OFFSETS: Record<number, number> = {
  100: 45,
  200: 32,
  300: 12,
  400: 0,
  500: -10,
};

// Grey ramp, relative to the 900 shade: lightness offset and saturation ratio,
// taken from the default brand's grey scale so a derived ramp keeps its shape.
const GREY_SHADES: Record<number, { lightness: number; saturation: number }> = {
  50: { lightness: 86, saturation: 0.78 },
  100: { lightness: 84, saturation: 0.78 },
  200: { lightness: 79, saturation: 0.72 },
  300: { lightness: 72, saturation: 0.67 },
  400: { lightness: 58, saturation: 0.56 },
  500: { lightness: 43, saturation: 0.5 },
  600: { lightness: 30, saturation: 0.5 },
  700: { lightness: 20, saturation: 0.61 },
  800: { lightness: 10, saturation: 0.78 },
  900: { lightness: 0, saturation: 1 },
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
    const isDarkBase = hsl.l < DARK_BASE_LIGHTNESS;
    const shift = shade === '500' && isDarkBase ? DARK_BASE_INTERACTION_OFFSET : offset;
    ramp[Number(shade)] = formatHsla(hsl.h, hsl.s, hsl.l + shift);
  }
  return ramp;
}

function formatHsla(h: number, s: number, l: number): string {
  const lightness = Math.min(98, Math.max(4, l));
  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(lightness)}%, 1)`;
}

/** Derives grey 50–900 from the 900 shade: same hue throughout, lighter and less saturated. */
export function buildGreyRamp(hex: string): Record<number, string> | null {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;

  const ramp: Record<number, string> = {};
  for (const [shade, step] of Object.entries(GREY_SHADES)) {
    ramp[Number(shade)] = formatHsla(hsl.h, hsl.s * step.saturation, hsl.l + step.lightness);
  }
  return ramp;
}

// Invalid colors are skipped, so the brand's compiled SCSS values stay in effect.
export function applyBrandColors(target: HTMLElement, colors: BrandColors): void {
  const ramps: [string, Record<number, string> | null][] = [
    ['primary', colors.primary ? buildColorRamp(colors.primary) : null],
    ['secondary', colors.secondary ? buildColorRamp(colors.secondary) : null],
    ['grey', colors.greyscaleBase ? buildGreyRamp(colors.greyscaleBase) : null],
  ];

  for (const [role, ramp] of ramps) {
    if (!ramp) continue;
    for (const [shade, value] of Object.entries(ramp)) {
      target.style.setProperty(`--color-${role}-${shade}`, value);
    }
  }
}
