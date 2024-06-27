import { BoundaryLine } from '../boundaries';
import { Coords } from '../directions';

export const MAX_RADAR_DISTANCE = 100;

export const radarArcSizes = [10, 5, 2, 1];

export type ProximityHitType = 'boundary';

export interface RadarPostiion extends Coords {
	isHit: boolean;
	distance: number;
	distanceIndex: number;
	direction: number;
	strength: number; // percentage from 0 - 100
}

export interface ForwardProximityHit {
	type: ProximityHitType;
	direction: number;
	distance: number;
	positions: RadarPostiion[];
}

// Function to check if the circle intersects with the horizontal line
export function testBoundaryHit({
	draftXPos,
	draftYPos,
	draftRadius,
	boundaries,
}: {
	draftXPos: number;
	draftYPos: number;
	draftRadius: number;
	boundaries: {
		top: BoundaryLine;
		right: BoundaryLine;
		bottom: BoundaryLine;
		left: BoundaryLine;
	};
}) {
	const padding = 5;
	const topBoundary = {
		outerEdge: boundaries.top.startY + padding,
		innerEdge: boundaries.top.startY + boundaries.top.thickness / 2 - padding,
	};

	const rightBoundary = {
		outerEdge: boundaries.right.startX - padding,
		innerEdge:
			boundaries.right.startX - boundaries.right.thickness / 2 + padding,
	};

	const bottomBoundary = {
		outerEdge: boundaries.bottom.startY - padding,
		innerEdge:
			boundaries.bottom.startY - boundaries.bottom.thickness / 2 + padding,
	};

	const leftBoundary = {
		outerEdge: boundaries.left.startX + padding,
		innerEdge: boundaries.left.startX + boundaries.left.thickness / 2 - padding,
	};

	// Check for top right corner hit
	const memberTopRightX = draftXPos + draftRadius;
	const memberTopRightY = draftYPos - draftRadius;
	if (
		memberTopRightX >= rightBoundary.innerEdge &&
		memberTopRightY <= topBoundary.innerEdge
	) {
		return {
			boundary: 'top-right-corner',
			position: {
				x: rightBoundary.innerEdge + draftRadius,
				y: topBoundary.innerEdge - draftRadius,
			},
		};
	}

	// Check for bottom right corner hit
	const memberBottomRightX = draftXPos + draftRadius;
	const memberBottomRightY = draftYPos + draftRadius;
	if (
		memberBottomRightX >= rightBoundary.innerEdge &&
		memberBottomRightY >= bottomBoundary.innerEdge
	) {
		return {
			boundary: 'bottom-right-corner',
			position: {
				x: rightBoundary.innerEdge + draftRadius,
				y: bottomBoundary.innerEdge + draftRadius,
			},
		};
	}

	// Check for bottom left corner hit
	const memberBottomLeftX = draftXPos - draftRadius;
	const memberBottomLeftY = draftYPos + draftRadius;
	if (
		memberBottomLeftX <= leftBoundary.innerEdge &&
		memberBottomLeftY >= bottomBoundary.innerEdge
	) {
		return {
			boundary: 'bottom-left-corner',
			position: {
				x: leftBoundary.innerEdge - draftRadius,
				y: bottomBoundary.innerEdge + draftRadius,
			},
		};
	}

	// Check for top left corner hit
	const memberTopLeftX = draftXPos - draftRadius;
	const memberTopLeftY = draftYPos - draftRadius;
	if (
		memberTopLeftX <= leftBoundary.innerEdge &&
		memberTopLeftY <= topBoundary.innerEdge
	) {
		return {
			boundary: 'top-left-corner',
			position: {
				x: leftBoundary.innerEdge - draftRadius,
				y: topBoundary.innerEdge - draftRadius,
			},
		};
	}

	// Check for top boundary hit
	const memberTopY = draftYPos - draftRadius;
	if (memberTopY <= topBoundary.innerEdge) {
		return {
			boundary: 'top',
			position: { x: draftXPos, y: topBoundary.innerEdge - draftRadius },
		};
	}

	// Check for right boundary hit
	const memberRightX = draftXPos + draftRadius;
	if (memberRightX >= rightBoundary.innerEdge) {
		return {
			boundary: 'right',
			position: { x: rightBoundary.innerEdge + draftRadius, y: draftYPos },
		};
	}

	// Check for bottom boundary hit
	const memberBottomY = draftYPos + draftRadius;
	if (memberBottomY >= bottomBoundary.innerEdge) {
		return {
			boundary: 'bottom',
			position: { x: draftXPos, y: bottomBoundary.innerEdge + draftRadius },
		};
	}

	// Check for left boundary hit
	const memberLeftX = draftXPos - draftRadius;
	if (memberLeftX <= leftBoundary.innerEdge) {
		return {
			boundary: 'left',
			position: { x: leftBoundary.innerEdge - draftRadius, y: draftYPos },
		};
	}

	return null;
}
