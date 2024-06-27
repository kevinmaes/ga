import { Direction } from './directions';

export interface BoundaryLine {
	startX: number;
	endX: number;
	startY: number;
	endY: number;
	thickness: number;
	color: string;
}

function createBoundaryLine({
	lineConfig,
	ctx,
}: {
	lineConfig: BoundaryLine;
	ctx: CanvasRenderingContext2D;
}) {
	ctx.strokeStyle = lineConfig.color;
	ctx.lineWidth = lineConfig.thickness;
	ctx.beginPath();
	ctx.moveTo(lineConfig.startX, lineConfig.startY);
	ctx.lineTo(lineConfig.endX, lineConfig.endY);
	ctx.stroke();

	return lineConfig;
}

export function createBoxBoundaries({
	thickness,
	color,
	ctx,
	canvas,
}: {
	thickness: number;
	color: string;
	ctx: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
}) {
	// Create a top boundary line
	const topBoundary = createBoundaryLine({
		lineConfig: {
			startX: 0,
			endX: canvas.width,
			startY: 0,
			endY: 0,
			thickness: 200,
			color,
		},
		ctx,
	});

	// Create a right boundary line
	const rightBoundary = createBoundaryLine({
		lineConfig: {
			startX: canvas.width,
			endX: canvas.width,
			startY: 0,
			endY: canvas.height,
			thickness,
			color,
		},
		ctx,
	});

	// Create a bottom boundary line
	const bottomBoundary = createBoundaryLine({
		lineConfig: {
			startX: 0,
			endX: canvas.width,
			startY: canvas.height,
			endY: canvas.height,
			thickness: 200,
			color,
		},
		ctx,
	});

	// Create a left boundary line
	const leftBoundary = createBoundaryLine({
		lineConfig: {
			startX: 0,
			endX: 0,
			startY: 0,
			endY: canvas.height,
			thickness,
			color,
		},
		ctx,
	});

	return {
		top: topBoundary,
		right: rightBoundary,
		bottom: bottomBoundary,
		left: leftBoundary,
		color,
	};
}

export type ProximityDirectionConfig = {
	type: 'visitedCell' | 'boundary';
	name: Direction['name'];
	radians: number;
};
