import { Ball } from './Ball';

export function calculateFitness(
	ball: Ball,
	generationDuration: number,
	canvas: HTMLCanvasElement,
	fitnessWeights: Record<string, number>
) {
	let overallFitness = 0;

	// Normalize the lifespan of the ball to be between 0 and 1
	const lifespanPercentage = ball.lifespan / generationDuration;

	// Normalize the xPosition fitness to be between 0 and 1
	const xPositionFitness =
		(ball.xPos / canvas.width) * fitnessWeights.xPosition;

	// Assess the number of walls avoided
	const avoidanceFitness = ball.wallsAvoided * fitnessWeights.avoidance;

	overallFitness = xPositionFitness + avoidanceFitness;

	// Reward the ball for reaching the goal
	let completionFitness = 0;
	if (ball.goalReached) {
		// Reward the ball for reaching the goal faster.
		completionFitness = (1 / lifespanPercentage) * fitnessWeights.completion;
		// Reward the ball for reaching the center of the goal.
		completionFitness +=
			(1 - ball.yPos / canvas.height) * fitnessWeights.completionPosition;
	}
	overallFitness += completionFitness;

	return overallFitness;
}

/**
 * Selects an individual based on their relative fitness
 * using roulette wheel selection
 * @param population
 * @returns
 */
export function rouletteWheelSelection(population: Ball[]) {
	// Calculate the total fitness of the population
	const totalFitness = population.reduce(
		(acc, individual) => acc + individual.fitness,
		0
	);

	// Generate a random number between 0 and the total fitness
	let rand = Math.random() * totalFitness;

	// Iterate through the population and select an individual based on the random number
	for (let individual of population) {
		rand -= individual.fitness;
		if (rand <= 0) {
			return individual;
		}
	}

	// In case of rounding errors, return the last individual
	return population[population.length - 1];
}

/**
 * Mutates an individual based on a mutation rate and variance percentage
 * @param individual
 * @param properties
 * @param mutationRate
 * @param variancePercentage
 * @returns mutated individual
 */
export function mutate(
	individual: Ball,
	properties: Array<
		Extract<
			keyof Ball,
			| 'xSpeed'
			| 'ySpeed'
			| 'xLimit'
			| 'yLimit'
			| 'coef'
			| 'stabilityCoef'
			| 'randomCoef'
			| 'forwardCoef'
		>
	>,
	mutationRate: number,
	variancePercentage: number
): Ball {
	function mutateValue(value: number): number {
		if (Math.random() < mutationRate) {
			const variance = (variancePercentage / 100) * value;
			return value + Math.random() * 2 * variance - variance;
		}
		return value;
	}

	// Loop over properties and mutate those values
	properties.forEach((property) => {
		individual[property] = mutateValue(individual[property]);
	});

	return individual;
}
