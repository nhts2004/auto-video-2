const HEX_REGEX = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/;
const RGBA_REGEX = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*(?:\.\d+)?))?\)$/i;

export type ParsedColor = {
  hex: string;
  alphaHex: string;
  alphaFloat: number;
};

export function parseColorWithAlpha(color?: string, fallback = '#000000'): ParsedColor {
  const fallbackNormalized = normalizeHex(fallback);

  if (!color) {
    return {
      hex: fallbackNormalized,
      alphaHex: 'FF',
      alphaFloat: 1,
    };
  }

  const hexMatch = color.match(HEX_REGEX);
  if (hexMatch) {
    const hex = normalizeHex(`#${hexMatch[1]}`);
    const alphaHex = (hexMatch[2] ?? 'FF').toUpperCase();
    return {
      hex,
      alphaHex,
      alphaFloat: alphaHexToFloat(alphaHex),
    };
  }

  const rgbaMatch = color.match(RGBA_REGEX);
  if (rgbaMatch) {
    const r = clampChannel(Number(rgbaMatch[1]));
    const g = clampChannel(Number(rgbaMatch[2]));
    const b = clampChannel(Number(rgbaMatch[3]));
    const alphaFloat = rgbaMatch[4] !== undefined ? clampAlpha(Number(rgbaMatch[4])) : 1;

    return {
      hex: rgbToHex(r, g, b),
      alphaHex: floatToAlphaHex(alphaFloat),
      alphaFloat,
    };
  }

  return {
    hex: fallbackNormalized,
    alphaHex: 'FF',
    alphaFloat: 1,
  };
}

export function combineHexWithAlpha(hex: string, alpha?: string | number): string {
  const normalizedHex = normalizeHex(hex);
  const { r, g, b } = hexToRgb(normalizedHex);

  let alphaFloat = 1;
  if (typeof alpha === 'number') {
    alphaFloat = clampAlpha(alpha);
  } else if (typeof alpha === 'string') {
    alphaFloat = alphaHexToFloat(alpha);
  }

  if (alphaFloat >= 1) {
    return normalizedHex;
  }

  const roundedAlpha = Math.round(alphaFloat * 1000) / 1000;
  return `rgba(${r}, ${g}, ${b}, ${roundedAlpha})`;
}

export function colorInputValue(color?: string, fallback = '#000000'): string {
  const parsed = parseColorWithAlpha(color, fallback);
  return parsed.hex;
}

export function normalizeColorForCss(color?: string, fallback = '#000000'): string | undefined {
  if (!color) {
    return undefined;
  }

  const parsed = parseColorWithAlpha(color, fallback);
  if (parsed.alphaFloat >= 1) {
    return parsed.hex;
  }

  const { r, g, b } = hexToRgb(parsed.hex);
  const roundedAlpha = Math.round(parsed.alphaFloat * 1000) / 1000;
  return `rgba(${r}, ${g}, ${b}, ${roundedAlpha})`;
}

function normalizeHex(hex: string) {
  const value = hex.startsWith('#') ? hex.slice(1) : hex;
  return `#${value.padEnd(6, '0').slice(0, 6).toLowerCase()}`;
}

function hexToRgb(hex: string) {
  const value = hex.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(value: number) {
  return clampChannel(value).toString(16).padStart(2, '0');
}

function clampChannel(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(255, Math.max(0, Math.round(value)));
}

function clampAlpha(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(1, Math.max(0, value));
}

function alphaHexToFloat(alphaHex: string) {
  return clampAlpha(parseInt(alphaHex, 16) / 255);
}

function floatToAlphaHex(alphaFloat: number) {
  return toHex(Math.round(clampAlpha(alphaFloat) * 255)).toUpperCase();
}
