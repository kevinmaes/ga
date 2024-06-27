export type Radians = number;
export type Degrees = number;

/**
 * Normalize angle to be within 0 to 2π range
 * @param angle
 * @returns
 */
export function normalizeAngle(angle: Radians): number {
	let normalizedAngle = angle % (2 * Math.PI);
	if (normalizedAngle < 0) {
		normalizedAngle += 2 * Math.PI;
	}
	return normalizedAngle;
}

// Create a function to conver radians to degrees
export function radiansToDegrees(radians: Radians): number {
	return (radians * 180) / Math.PI;
}

export function degreesToRadians(degrees: Degrees): number {
	return (degrees * Math.PI) / 180;
}

export function getPointAt(
	direction: Radians,
	distance: number,
	relativePoint?: { x: number; y: number }
) {
	const relativeX = relativePoint?.x ? relativePoint.x : 0;
	const relativeY = relativePoint?.y ? relativePoint.y : 0;
	return {
		x: relativeX + Math.cos(direction) * distance,
		y: relativeY + Math.sin(direction) * distance,
	};
}

export function getDirectionCone(direction: Radians, range: Degrees) {
	const halfDegrees = range / 2;
	const halfRadians = degreesToRadians(halfDegrees);
	return [
		normalizeAngle(direction - halfRadians),
		direction,
		normalizeAngle(direction + halfRadians),
	];
}

/**
 * Function to check if a direction (angle in radians) is within the cone
 * @param angle
 * @param directionCone
 * @returns
 */
export function isWithinCone(
	angle: Radians,
	directionCone: ReturnType<typeof getDirectionCone>
) {
	// Normalize angle to ensure comparison is accurate
	angle = normalizeAngle(angle);

	let [lowerBound, , upperBound] = directionCone;

	// Check if angle is within the bounds, accounting for wrap-around at 0/2π
	if (lowerBound <= upperBound) {
		return angle >= lowerBound && angle <= upperBound;
	} else {
		// The cone wraps around 0, so we check if angle is outside the bounds
		return angle >= lowerBound || angle <= upperBound;
	}
}
