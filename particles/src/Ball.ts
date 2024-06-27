import { createBoxBoundaries } from './boundaries';
import {
	generateDistributedPoints,
	getRadarPointsForStrength,
} from './directions';
import { hexToRgba, interpolateColor, isSameColor } from './utils/color';
import {
	ForwardProximityHit,
	MAX_RADAR_DISTANCE,
	RadarPostiion,
	radarArcSizes,
	testBoundaryHit,
} from './utils/environmentalDetection';
import { getCurrentGridCellId } from './utils/grid';
import {
	Radians,
	getDirectionCone,
	getPointAt,
	isWithinCone,
	normalizeAngle,
} from './utils/trigonometry';

export class Ball {
	ctx;
	xPos;
	yPos;
	radius;
	xSpeed;
	ySpeed;
	coef;
	stabilityCoef;
	randomCoef;
	forwardCoef;
	xLimit;
	yLimit;
	rForceL?: number;
	rForceR?: number;
	rForceT?: number;
	rForceB?: number;
	xDir?: number;
	yDir?: number;
	parentLifespan: number | undefined;
	birthStamp: number | undefined;
	lifespan: number = 0;
	wallsAvoided: number = 0;
	dead: boolean = false;
	hit?: { boundary: string; position: { x: number; y: number } } | null;
	fitness: number = 0;
	forwardProximityHits: ForwardProximityHit[] = [];
	lastCellVisitedId: number = -1;
	// Radar strength is a percentage from 0 to 100.
	radarStrength: number;
	goalReached: boolean = false;

	constructor(params: {
		ctx: CanvasRenderingContext2D;
		xPos: number;
		yPos: number;
		radius: number;
		xSpeed: number;
		ySpeed: number;
		coef: number;
		stabilityCoef: number;
		randomCoef: number;
		forwardCoef: number;
		xLimit: number;
		yLimit: number;
		radarStrength: number;
		parentLifespan?: number;
	}) {
		this.ctx = params.ctx;
		this.xPos = params.xPos;
		this.yPos = params.yPos;
		this.radius = params.radius;

		this.forwardCoef = params.forwardCoef;
		this.xSpeed = params.xSpeed;
		this.ySpeed = params.ySpeed;
		this.coef = params.coef;
		this.stabilityCoef = params.stabilityCoef;
		this.randomCoef = params.randomCoef;
		this.xLimit = params.xLimit;
		this.yLimit = params.yLimit;
		this.radarStrength = params.radarStrength;
		this.lifespan = 0;

		if (params.parentLifespan) {
			this.parentLifespan = params.parentLifespan;
		}
	}

	/**
	 * Set the birth stamp for the ball.
	 * @param birthStamp
	 * @returns
	 */
	startLife(birthStamp: number) {
		this.birthStamp = birthStamp;
		return this;
	}

	// TODO: Use CSS color variables
	getFillStyle(alphaOverride: number | undefined = undefined) {
		if (this.parentLifespan) {
			console.log('lifespans', this.lifespan, this.parentLifespan);
			if (this.lifespan <= this.parentLifespan) {
				return interpolateColor(
					'#ffffff',
					'#ffffff',
					1,
					alphaOverride ?? 0.2 + (this.lifespan / this.parentLifespan) * 0.8
				);
			} else {
				if (this.lifespan > this.parentLifespan * 2) {
					const lifespanExcess = this.lifespan - this.parentLifespan * 2;
					return interpolateColor(
						'#ffff00',
						'#00ff00',
						lifespanExcess / (this.parentLifespan * 2),
						alphaOverride ?? 1
					);
				}

				const lifespanExcess = this.lifespan - this.parentLifespan;
				return interpolateColor(
					'#ffffff',
					'#ffff00',
					lifespanExcess / this.parentLifespan,
					alphaOverride ?? 1
				);
			}
		}
		return `rgba(255, 255, 255, ${alphaOverride ?? '0.2'})`;
	}

	updateLifespan() {
		if (!this.dead && typeof this.birthStamp !== 'undefined') {
			this.lifespan = Date.now() - this.birthStamp;
		}
		return this;
	}

	getCurrentDirection() {
		// Get the current direction of the ball.
		// This is a number from 0 to 2π.
		return Math.atan2(this.ySpeed, this.xSpeed);
	}

	calculateNextPosition(
		canvas: HTMLCanvasElement,
		boundaries: ReturnType<typeof createBoxBoundaries>,
		directionInRadians: Radians
	) {
		// Initialize draft positions based on actual positions.
		let draftXPos = this.xPos;
		let draftYPos = this.yPos;
		let draftRadius = this.radius;

		// Calculate and draw radar lines
		// at points which are specified as distances away from the center.
		const allRadarDistances = generateDistributedPoints(
			this.radius + 15,
			MAX_RADAR_DISTANCE,
			2
		);
		const radarStrengthDistances = getRadarPointsForStrength(
			allRadarDistances,
			this.radarStrength
		);

		this.forwardProximityHits = [];

		radarStrengthDistances.forEach((distance, index, array) => {
			const positions: RadarPostiion[] = [];
			const rayCone = getDirectionCone(directionInRadians, 90);

			for (let i = 0; i < rayCone.length; i++) {
				const rayDirection = rayCone[i];
				const { x, y } = getPointAt(rayDirection, distance, {
					x: this.xPos,
					y: this.yPos,
				});

				const rightDirectionCone = getDirectionCone(0, 90);
				if (isWithinCone(rayDirection, rightDirectionCone)) {
					continue;
				}

				// Test the pixel color at the x, y position.
				const { data: pixelColor } = this.ctx.getImageData(x, y, 1, 1);
				const isColorMatch = isSameColor(pixelColor, boundaries.color);

				const hitPositions = {
					x,
					y,
					isHit: isColorMatch,
					direction: rayDirection,
					distance,
					distanceIndex: index,
					strength: index / array.length,
				};
				positions.push(hitPositions);
			}
			if (positions.length > 0) {
				this.forwardProximityHits.push({
					type: 'boundary',
					direction: directionInRadians,
					distance,
					positions,
				});
			}
		});

		// Calculate random forces based on position and a coefficient.
		// These forces represent an inverse relation to the distance from the edges.
		this.rForceL = 0;
		this.rForceR = 0;
		this.rForceT = 0;
		this.rForceB = 0;

		// If there are any forward proximity hits, calculate forces to apply
		// so that members avoid the boundaries.
		// The force applied is inversely proportional to the distance from the boundary.
		// i.e. the closer the member is to the boundary, the stronger the force.
		if (!this.dead && this.forwardProximityHits.length > 0) {
			const nearestProximityHit = this.forwardProximityHits[0];
			const relativeDistanceToBoundary =
				nearestProximityHit.distance / MAX_RADAR_DISTANCE;
			const inverseDistanceFactor = 1 - relativeDistanceToBoundary;

			this.rForceL =
				this.forwardCoef * (this.coef / this.xPos) * inverseDistanceFactor;
			this.rForceR =
				this.forwardCoef *
				(this.coef / (canvas.width - this.xPos)) *
				inverseDistanceFactor;
			this.rForceT =
				this.forwardCoef * (this.coef / this.yPos) * inverseDistanceFactor;
			this.rForceB =
				this.forwardCoef *
				(this.coef / (this.yPos - canvas.height)) *
				inverseDistanceFactor;

			this.wallsAvoided += 1;
		}

		// Consider where members are currently located as compared to where they've already been
		// and apply a force to move away from those areas.
		const currentGridCellId = getCurrentGridCellId(this.xPos, this.yPos);
		if (this.lastCellVisitedId >= 0) {
			if (currentGridCellId !== this.lastCellVisitedId) {
				// Apply a force to move away from the last cell visited by pushing the ball to the right
				this.rForceR += this.forwardCoef;
				this.rForceL -= this.forwardCoef;
			}
		}

		// Calculate random directional changes (xDir, yDir) influenced by stability coefficient and random variation.
		this.xDir =
			(this.stabilityCoef - Math.random()) * this.randomCoef * Math.random(); // Random X direction modifier
		this.yDir =
			(this.stabilityCoef - Math.random()) * this.randomCoef * Math.random(); // Random Y direction modifier

		// Update speed in X direction, adding random forces and subtracting directional change.
		this.xSpeed = this.xSpeed + this.rForceL + this.rForceR - this.xDir;

		// If X speed exceeds a limit, ease it to stay within the limit.
		if (Math.abs(this.xSpeed) > this.xLimit) {
			this.xSpeed = this.xLimit * (Math.abs(this.xSpeed) / this.xSpeed); // Cap the X speed to its limit
		}

		// Similar updates for Y direction.
		this.ySpeed = this.ySpeed + this.rForceT + this.rForceB - this.yDir; // Update Y speed with random forces and directional change

		// If Y speed exceeds a limit, ease it to stay within the limit.
		if (Math.abs(this.ySpeed) > this.yLimit) {
			this.ySpeed = this.yLimit * (Math.abs(this.ySpeed) / this.ySpeed); // Cap the Y speed to its limit
		}

		// Updating actual x and y positions by current x and y speed.
		draftXPos += this.xSpeed;
		draftYPos += this.ySpeed;

		// After updating position, perform hit test and possibly constrain.
		const { hit, x, y } = this.testAndConstrainToHit(
			draftXPos,
			draftYPos,
			draftRadius,
			boundaries
		);
		draftXPos = x;
		draftYPos = y;

		if (hit) {
			this.kill(hit);
		}

		this.xPos = draftXPos;
		this.yPos = draftYPos;
		this.radius = draftRadius;

		// Update the last visited cell
		this.lastCellVisitedId = currentGridCellId;
	}

	testAndConstrainToHit(
		draftXPos: number,
		draftYPos: number,
		draftRadius: number,
		boundaries: ReturnType<typeof createBoxBoundaries>
	) {
		const hit = testBoundaryHit({
			draftXPos,
			draftYPos,
			draftRadius,
			boundaries,
		});

		if (hit === null) {
			return {
				hit,
				x: draftXPos,
				y: draftYPos,
			};
		}

		if (hit.boundary === 'right') {
			this.goalReached = true;
		}

		return {
			hit,
			x: hit.position.x,
			y: hit.position.y,
		};
	}

	/**
	 * Calculate next position and draw the ball.
	 * @param canvas
	 * @param boundaries
	 * @returns
	 */
	draw(
		canvas: HTMLCanvasElement,
		boundaries: ReturnType<typeof createBoxBoundaries>
	) {
		this.updateLifespan();

		// Draw the member (ball)
		const path = new Path2D();

		// If the ball is dead, draw it differently and exit.
		if (this.dead) {
			const path = new Path2D();
			this.ctx.fillStyle = this.getFillStyle(
				this.hit?.boundary === 'right' ? 1 : 0.1
			);
			path.arc(this.xPos, this.yPos, this.radius * 0.5, 0, 2 * Math.PI);
			this.ctx.fill(path);
			return;
		}

		this.ctx.fillStyle = this.getFillStyle();
		path.arc(this.xPos, this.yPos, this.radius, 0, 2 * Math.PI);
		this.ctx.fill(path);

		const directionInRadians = this.getCurrentDirection();
		this.calculateNextPosition(canvas, boundaries, directionInRadians);

		// Draw the proximity arcs.
		if (this.forwardProximityHits.length > 0) {
			this.forwardProximityHits.forEach((proximityHit) => {
				this.drawArcSegment(proximityHit);
			});
		}

		return this;
	}

	drawArcSegment(proximityHit: ForwardProximityHit): void {
		const { ctx, xPos, yPos } = this;
		if (xPos > 0.9 * ctx.canvas.width) {
			return;
		}

		// Assign start, mid, and end positions based on the number of positions in the proximity hit.
		let start;
		let mid;
		let end;
		if (proximityHit.positions.length === 1) {
			[start] = proximityHit.positions;
			mid = start;
			end = start;
		} else if (proximityHit.positions.length === 2) {
			[start, end] = proximityHit.positions;
			mid = start;
		} else {
			[start, mid, end] = proximityHit.positions;
		}

		const positionsStartAngle = start.direction;
		const positionsEndAngle = end.direction;

		let startAngle = 0;
		let endAngle = 0;
		if (positionsStartAngle === 0 && positionsEndAngle === 0) {
			startAngle = normalizeAngle(-0.7854);
			endAngle = normalizeAngle(0.7854);
		} else {
			// Ensure angles are within 0 to 2π range
			startAngle = normalizeAngle(positionsStartAngle);
			endAngle = normalizeAngle(positionsEndAngle);
		}

		// Calculate the shortest direction for the arc
		let angleDifference = endAngle - startAngle;
		if (angleDifference < 0) {
			angleDifference += 2 * Math.PI; // Adjust difference if it crosses the 0 radians point
		}
		// Determine if we should draw the arc clockwise or counterclockwise for the shortest arc
		const drawCounterclockwise = angleDifference > Math.PI;

		ctx.beginPath();
		ctx.arc(
			xPos,
			yPos,
			mid.distance,
			startAngle,
			endAngle,
			drawCounterclockwise
		);

		// TODO: Use CSS color variable
		ctx.strokeStyle = hexToRgba('#d5d3e2', 0.2);
		const lineWidth = radarArcSizes[mid.distanceIndex] ?? 1;
		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}

	kill(hit: { boundary: string; position: { x: number; y: number } } | null) {
		this.hit = hit;
		this.dead = true;
		return this;
	}

	/**
	 * Assign fitness to the individual for the GA.
	 * @param fitness
	 * @returns
	 */
	assignFitness(fitness: number) {
		this.fitness = fitness;
		return this;
	}
}
