import { Degrees, Radians, getDirectionCone } from './utils/trigonometry';

export interface Coords {
	x: number;
	y: number;
}

export interface Direction {
	start: number;
	end: number;
	radians: Radians;
	name:
		| 'top'
		| 'topRight'
		| 'right'
		| 'bottomRight'
		| 'bottom'
		| 'bottomLeft'
		| 'left'
		| 'topLeft';
}

export interface ProximityDirection extends Direction {
	type: 'boundary' | 'visitedCell';
	distance: RadarPixelDistance;
}

type DirectionConfigs = Record<Direction['name'], Direction>;

export const directionConfigs = {
	right: {
		name: 'right',
		start: -0.0175,
		end: 0.0175,
		radians: 0.0,
	},
	bottomRight: {
		name: 'bottomRight',
		start: 0.7679,
		end: 0.8029,
		radians: 0.7854,
	},
	bottom: {
		name: 'bottom',
		start: 1.5533,
		end: 1.5882,
		radians: 1.5708,
	},
	bottomLeft: {
		name: 'bottomLeft',
		start: 2.3387,
		end: 2.3736,
		radians: 2.3562,
	},
	left: {
		name: 'left',
		start: 3.1241,
		end: 3.159,
		radians: 3.1416,
	},
	topLeft: {
		name: 'topLeft',
		start: 3.9095,
		end: 3.9444,
		radians: 3.927,
	},
	top: {
		name: 'top',
		start: 4.6949,
		end: 4.7298,
		radians: 4.7124,
	},
	topRight: {
		name: 'topRight',
		start: 5.4803,
		end: 5.5152,
		radians: 5.4978,
	},
} as const satisfies DirectionConfigs;

// Since directionConfigs is a const, if we want to create a TS type that can type an array of some of the values of directionConfigs, we can use the following:
export type DirectionName = keyof typeof directionConfigs;
export type DirectionConfig = (typeof directionConfigs)[DirectionName];

export const directionNames = Object.keys(
	directionConfigs
) as Direction['name'][];
export const directionConfigsArray = Object.values(directionConfigs);

// Create a function that takes a number (radians) and snaps it to one of the 8 directions (also radians)
export function snapToDirection(radians: number) {
	return directionConfigsArray.find(
		(d) => d.start < radians && radians < d.end
	);
}

export const radarDistances = [0, 25, 75, 150] as const;
export type RadarPixelDistance = (typeof radarDistances)[number];

/**
 * Get an array of points distributed evenly between startValue and endValue
 * using the Fibonacci sequence.
 * @example generateDistributedPoints(1, 21, 5) => [1, 5, 8, 13, 21]
 * Example using start value of 1 and an end value of 100:
 * @example generateDistributedPoints(1, 100, 5) => [1, 21, 38, 62, 100]
 * @param startValue
 * @param endValue
 * @param numPoints
 * @returns Array of points which represent the Fibonacci sequence scaled to the range
 */
export function generateDistributedPoints(
	startValue: number,
	endValue: number,
	numPoints: number
) {
	if (numPoints === 0) {
		return [startValue, endValue];
	}

	// Generate Fibonacci sequence to get ratios
	let fib = [1, 1];
	for (let i = 2; i <= numPoints; i++) {
		fib.push(fib[i - 1] + fib[i - 2]);
	}

	// Calculate the total sum of Fibonacci numbers to get the scale factors
	let fibSum = fib.reduce((a, b) => a + b, 0);

	// Calculate the interval based on Fibonacci ratios
	let interval = (endValue - startValue) / fibSum;

	let points = [startValue];

	// Generate points based on Fibonacci distribution
	let currentSum = 0;
	for (let i = 0; i < numPoints; i++) {
		currentSum += fib[i];
		let point = startValue + currentSum * interval;
		points.push(Math.round(point));
	}

	points.push(endValue);

	return points;
}

/**
 * Calculate the number of radar points to return based on the strength percentage.
 * @param radarPoints
 * @param strength
 * @returns
 */
export function getRadarPointsForStrength(
	radarPoints: ReturnType<typeof generateDistributedPoints>,
	strength: number
) {
	const radarPointCount = Math.round((strength / 100) * radarPoints.length);
	return radarPoints.slice(0, radarPointCount);
}

// Create a function that takes 3 arguments:
// 1) the objectDirection (radians) that an object is moving in
// 2) a rayDirection (radians) that a ray is eminating from the object
// 3) a degrees value that represents the size of the 'cone' of directions
// and returns true if the rayDirection is within the 'cone' of directions
export function isRayInMovementDirection(
	rayDirection: Radians,
	movementDirection: Radians,
	range: Degrees
) {
	// console.log('inCone', inCone, movementDirection, rayDirection, start, end);
	const [start, _, end] = getDirectionCone(movementDirection, range);

	// return true if the rayDirection is within the 'cone' of directions
	// but account for negative radians the start and end should always be less than 180 degrees
	let inCone = false;
	if (start < 0 && end < 0) {
		if (start < rayDirection || rayDirection < end) {
			inCone = true;
		}
	}
	if (start < rayDirection && rayDirection < end) {
		inCone = true;
	}
	console.log('isRayInMovementDirection', inCone, rayDirection, start, end);
	return inCone;
}
