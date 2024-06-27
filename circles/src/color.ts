export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number; // Optional alpha component
}

export function getRgbaString(color: RGBColor) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

export function hexToRgb(hex: string, alpha?: number): RGBColor {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b, a: alpha && 1 };
}
