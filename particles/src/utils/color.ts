type HexColor = string;
type RGBAColor = string;
type ColorInput = HexColor | Uint8ClampedArray;

/**
 * Interpolate between two colors, i.e. calculate a color that is
 * a percentage distance between two colors.
 * @param startColor
 * @param endColor
 * @param colorPercentage
 * @param alphaPercentage
 * @returns Interpolated color string in RGBA format
 */
export function interpolateColor(
	startColor: HexColor,
	endColor: HexColor,
	colorPercentage: number,
	alphaPercentage: number
): RGBAColor {
	// Ensure percentages are clamped between 0 and 1
	colorPercentage = Math.max(0, Math.min(1, colorPercentage));
	alphaPercentage = Math.max(0, Math.min(1, alphaPercentage));

	// Convert start and end colors to Uint8ClampedArray (RGBA)
	const startRGBA: Uint8ClampedArray = hexToUint8ClampedArray(startColor);
	const endRGBA: Uint8ClampedArray = hexToUint8ClampedArray(endColor);

	// Interpolate the RGB components
	const r: number = Math.round(
		startRGBA[0] + (endRGBA[0] - startRGBA[0]) * colorPercentage
	);
	const g: number = Math.round(
		startRGBA[1] + (endRGBA[1] - startRGBA[1]) * colorPercentage
	);
	const b: number = Math.round(
		startRGBA[2] + (endRGBA[2] - startRGBA[2]) * colorPercentage
	);

	const a: number = alphaPercentage;

	return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

/**
 * Convert a hex color string to an RGBA color string
 * @param hexColor
 * @param alpha
 * @returns RGBA color string
 */
export function hexToRgba(hexColor: string, alpha?: number): string {
	const rgba = hexToUint8ClampedArray(hexColor);
	const r = rgba[0];
	const g = rgba[1];
	const b = rgba[2];
	const a = alpha !== undefined ? alpha : rgba[3] / 255;
	return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

/**
 * Convert a hex color string to a Uint8ClampedArray (an RGBA array)
 * @param hex
 * @returns
 */
function hexToUint8ClampedArray(hex: string): Uint8ClampedArray {
	let r = 0,
		g = 0,
		b = 0,
		a = 255;
	if (hex.startsWith('#')) hex = hex.slice(1);
	if (hex.length === 3) {
		r = parseInt(hex[0] + hex[0], 16);
		g = parseInt(hex[1] + hex[1], 16);
		b = parseInt(hex[2] + hex[2], 16);
	} else if (hex.length === 6) {
		r = parseInt(hex.substring(0, 2), 16);
		g = parseInt(hex.substring(2, 4), 16);
		b = parseInt(hex.substring(4, 6), 16);
	} else if (hex.length === 8) {
		r = parseInt(hex.substring(0, 2), 16);
		g = parseInt(hex.substring(2, 4), 16);
		b = parseInt(hex.substring(4, 6), 16);
		a = parseInt(hex.substring(6, 8), 16);
	}
	return new Uint8ClampedArray([r, g, b, a]);
}

/**
 * Convert an RGBA color string to a Uint8ClampedArray (an RGBA array)
 * @param rgba
 * @returns
 */
function rgbaToUint8ClampedArray(rgba: string): Uint8ClampedArray {
	const parts = rgba.match(
		/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.?\d*))?\)/
	);
	if (!parts) throw new Error('Invalid RGBA format');
	let [_, r, g, b, a = '255'] = parts; // Default alpha to 255 if not specified
	return new Uint8ClampedArray([+r, +g, +b, Math.round(+a * 255)]);
}

/**
 * Convert a color to a Uint8ClampedArray (an RGBA array)
 * @param color
 * @returns Uint8ClampedArray
 */
function convertToUint8ClampedArray(color: ColorInput): Uint8ClampedArray {
	if (typeof color === 'string') {
		if (color.startsWith('#')) {
			return hexToUint8ClampedArray(color);
		} else if (color.startsWith('rgb')) {
			return rgbaToUint8ClampedArray(color);
		} else {
			throw new Error('Unsupported color string format');
		}
	} else if (color instanceof Uint8ClampedArray) {
		return color; // Assume it's already the correct format
	} else {
		throw new Error('Unsupported color type');
	}
}

/**
 * Compare two colors to see if they are the same.
 * @param color1 Can be a hex color string or a Uint8ClampedArray
 * @param color2 Can be a hex color string or a Uint8ClampedArray
 * @returns True if the colors are the same, false otherwise
 */
export function isSameColor(color1: ColorInput, color2: ColorInput): boolean {
	const array1 = convertToUint8ClampedArray(color1);
	const array2 = convertToUint8ClampedArray(color2);
	return array1.every((value, index) => value === array2[index]);
}
