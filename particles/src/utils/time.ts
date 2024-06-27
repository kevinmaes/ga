export function msToSeconds(milliseconds: number): string {
	const seconds = milliseconds / 1000;
	return seconds.toFixed(2) + ' seconds';
}
