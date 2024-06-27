import { assign, createActor, setup } from 'xstate';

interface Circle {
	x: number;
	y: number;
	radius: number;
	color: string;
	fitness: number;
}

const targetCircle: Circle = {
	x: 300,
	y: 200,
	radius: 50,
	color: '#fff',
	fitness: 0,
};

const fitnessWeights = {
	distance: 1,
	size: 1,
};

// Fitness function
function calculateFitness(individual: Circle, target: Circle): number {
	// Measure the individual's distance from the target
	const distance = Math.sqrt(
		Math.pow(individual.x - target.x, 2) + Math.pow(individual.y - target.y, 2)
	);

	// Calculate the individual's difference in size
	const radiusDifference = Math.abs(individual.radius - target.radius);

	// Apply weights to distance and radius difference
	const weightedDistance = fitnessWeights.distance * distance;
	const weightedRadiusDifference = fitnessWeights.size * radiusDifference;

	// Calculate the fitness score
	const weightedSum = weightedDistance + weightedRadiusDifference;

	// Ensure that if both distance and radius difference are 0, the fitness score is 1
	return 1 / (weightedSum + 1);
}

// Selection function using the roulette wheel method
function rouletteWheelSelection(population: Circle[]) {
	// Calculate the total fitness of the population
	const totalFitness = population.reduce(
		(acc, individual) => acc + individual.fitness,
		0
	);

	// Generate a random number between 0 and the total fitness
	let rand = Math.random() * totalFitness;

	// Iterate through the population and select an individual
	// based on the random number
	for (let individual of population) {
		rand -= individual.fitness;
		if (rand <= 0) {
			return individual;
		}
	}

	// In case of rounding errors, return the last individual
	return population[population.length - 1];
}

// Mutation function
function mutate(
	individual: Circle,
	mutationRate: number,
	mutationPercentage: number,
	canvasWidth: number,
	canvasHeight: number
): Circle {
	function mutateValue(value: number, maxValue: number) {
		// Generate a random number and check if it is less than the mutation rate
		if (Math.random() < mutationRate) {
			// Calculate the new mutated value, higher or smaller than original
			const mutation =
				value + Math.random() * mutationPercentage - mutationPercentage / 2;
			// Ensure the new value is within the range [0, maxValue]
			const clampedMutation = Math.min(maxValue, Math.max(0, mutation));
			return clampedMutation;
		}
		// If no mutation occurs, return the original value
		return value;
	}

	return {
		...individual,
		x: mutateValue(individual.x, canvasWidth),
		y: mutateValue(individual.y, canvasHeight),
		radius: mutateValue(
			individual.radius,
			Math.min(canvasWidth, canvasHeight) / 2
		),
	};
}

// Checks to see if an individual matches the size and position of the target.
function isTargetMatch(individual: Circle, target: Circle) {
	return (
		Math.round(individual.radius) === target.radius &&
		Math.round(individual.x) === target.x &&
		Math.round(individual.y) === target.y
	);
}

// Get a circle when inititalizing the population or subsequent generations
function getRandomCircle(canvasWidth: number, canvasHeight: number): Circle {
	return {
		x: Math.random() * canvasWidth,
		y: Math.random() * canvasHeight,
		radius: Math.random() * 100,
		color: 'rgba(255, 255, 255, .1)',
		fitness: 0,
	};
}

// XState machine setup.
const machine = setup({
	types: {} as {
		context: {
			canvas: HTMLCanvasElement;
			canvasCtx: CanvasRenderingContext2D;
			targetCircle: Circle;
			populationSize: number;
			population: Circle[];
			selectedParents: Circle[];
			nextGeneration: Circle[];
			generationCount: number;
			mutationRate: number;
			mutationPercentage: number;
			matchCount: number;
			firstMatchGeneration: number;
			averageFitness: number;
			totalFitness: number;
		};
		events: { type: 'Continue'; targetCircle: Circle };
	},
	actions: {
		draw: ({ context }) => {
			const { canvasCtx, canvas, population, targetCircle } = context;

			// Clear the canvas before drawing
			canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

			// Draw each individual in the population
			population.forEach((individual) => {
				// Draw the circle.
				canvasCtx.strokeStyle = '#666';
				canvasCtx.lineWidth = 1;
				canvasCtx.beginPath();
				canvasCtx.arc(
					individual.x,
					individual.y,
					individual.radius,
					0,
					2 * Math.PI
				);
				const alpha = 1 / population.length;

				// If the circle matches the target, add a bit of red fill
				canvasCtx.fillStyle = isTargetMatch(individual, targetCircle)
					? `rgba(255, 0, 0, ${alpha})`
					: individual.color;
				canvasCtx.fill();
				canvasCtx.stroke();
			});

			// Draw the target circle on top of the others
			canvasCtx.strokeStyle = 'red';
			canvasCtx.lineWidth = 3;
			canvasCtx.beginPath();
			canvasCtx.arc(
				targetCircle.x,
				targetCircle.y,
				targetCircle.radius,
				0,
				2 * Math.PI
			);
			canvasCtx.stroke();
		},
		updateMatchCount: assign(({ context }) => {
			const {
				population,
				targetCircle,
				firstMatchGeneration,
				generationCount,
			} = context;

			let matchCount = 0;
			for (let i = 0; i < population.length; i++) {
				const individual = population[i];
				const isMatch = isTargetMatch(individual, targetCircle);

				if (isMatch) {
					matchCount += 1;
				}
			}

			if (firstMatchGeneration <= 0) {
				if (matchCount >= 1) {
					return {
						matchCount,
						firstMatchGeneration: generationCount,
					};
				}
			}

			return { matchCount };
		}),
		displayFitnessInfo: ({ context }) => {
			const { averageFitness } = context;
			const fitnessSpan = document.getElementById('averageFitness');
			fitnessSpan!.textContent = `Avg fitness: ${averageFitness.toFixed(3)}`;
		},
		displayMatchInfo: ({ context }) => {
			const { matchCount, population, firstMatchGeneration } = context;
			const firstMatchSpan = document.getElementById('firstMatch');

			firstMatchSpan!.textContent = `First match found: ${
				firstMatchGeneration > 0 ? 'Gen: ' + firstMatchGeneration : 'none'
			}`;
			const matchSpan = document.getElementById('matchCount');
			const matchPercentage = Math.round(
				(matchCount / population.length) * 100
			);
			matchSpan!.textContent = `Current matches: ${matchPercentage}%`;
		},
	},
	delays: {
		frameRate: () => {
			// Not exactly frames per second (max about 250)
			const fps = 250;
			return 1000 / fps;
		},
	},
}).createMachine({
	id: 'geneticAlgorithm',
	initial: 'Initialization',
	context: {
		canvas: {} as HTMLCanvasElement,
		canvasCtx: {} as CanvasRenderingContext2D,
		targetCircle,
		populationSize: 256,
		population: [],
		selectedParents: [],
		nextGeneration: [],
		generationCount: 1,
		mutationRate: 0.01,
		mutationPercentage: 20,
		matchCount: 0,
		firstMatchGeneration: -1,
		averageFitness: 0,
		totalFitness: 0,
	},
	states: {
		Initialization: {
			entry: [
				assign(({ context }) => {
					const { populationSize } = context;

					// Access the canvas element
					const canvas = document.getElementById('canvas') as HTMLCanvasElement;
					if (canvas === null) {
						throw new Error('canvas is null');
					}

					// Get the 2d canvas context
					const canvasCtx = canvas.getContext('2d');
					if (canvasCtx === null) {
						throw new Error('canvasCtx is null');
					}

					// Initialize the population with random circles
					const population = [];
					for (let i = 0; i < populationSize; i++) {
						population.push(getRandomCircle(canvas.width, canvas.height));
					}

					return {
						canvas,
						canvasCtx,
						population,
					};
				}),
			],
			always: {
				target: 'Run',
			},
		},
		Run: {
			entry: ['draw'],
			exit: ['updateMatchCount', 'displayMatchInfo'],
			always: { target: 'Evaluation' },
		},
		Evaluation: {
			entry: [
				assign(({ context }) => {
					const { targetCircle, population } = context;

					// Assign each individual a fitness score
					const evaluatedPopulation = [];
					let totalFitness = 0;
					for (let i = 0; i < population.length; i++) {
						const individual = population[i];
						// Call a fitness function to get a score
						const fitness = calculateFitness(individual, targetCircle);
						evaluatedPopulation.push({
							...individual,
							fitness,
						});

						totalFitness += fitness;
					}

					return {
						population: evaluatedPopulation,
						averageFitness: totalFitness / population.length,
						totalFitness,
					};
				}),
				'displayFitnessInfo',
			],
			always: [
				{
					guard: ({ context }) => {
						const { matchCount, population } = context;
						return matchCount === population.length;
					},
					target: 'Done',
				},
				{
					target: 'Selection',
				},
			],
		},
		Selection: {
			entry: assign({
				selectedParents: ({ context }) => {
					const { population } = context;

					const selectedParents = [];

					// Only select a 1/3 of the population to be parents
					// based on roulette wheel selection.
					const maxParents = Math.round(population.length / 3);
					for (let i = 0; i < maxParents; i++) {
						selectedParents.push(rouletteWheelSelection(population));
					}

					return selectedParents;
				},
			}),
			always: {
				target: 'Crossover',
			},
		},
		Crossover: {
			entry: assign({
				nextGeneration: ({ context }) => {
					const { selectedParents, populationSize } = context;

					const nextGeneration = [];

					// Iterate up to the full population size
					for (let i = 0; i < populationSize; i++) {
						// Randomly choose 2 different parents from selectedParents.
						const parent1 =
							selectedParents[
								Math.floor(Math.random() * selectedParents.length)
							];
						const parent2 =
							selectedParents[
								Math.floor(Math.random() * selectedParents.length)
							];

						// Create a new child, merging parent DNA
						const child = {
							x: (parent1.x + parent2.x) / 2,
							y: (parent1.y + parent2.y) / 2,
							radius: (parent1.radius + parent2.radius) / 2,
							color: parent1.color, // Color doesn't change for now
							fitness: 0,
						};

						nextGeneration.push(child);
					}
					return nextGeneration;
				},
			}),
			always: {
				target: 'Mutation',
			},
		},
		Mutation: {
			entry: assign({
				nextGeneration: ({ context }) => {
					const { mutationRate, mutationPercentage, nextGeneration, canvas } =
						context;

					return nextGeneration.map((individual) =>
						mutate(
							individual,
							mutationRate,
							mutationPercentage,
							canvas.width,
							canvas.height
						)
					);
				},
			}),
			after: {
				frameRate: 'Init Next Generation',
			},
		},
		'Init Next Generation': {
			entry: [
				assign(({ context }) => {
					return {
						generationCount: context.generationCount + 1,
						population: context.nextGeneration,
						averageFitness: 0,
					};
				}),
				({ context }) => {
					const countSpan = document.getElementById('generationCount');
					countSpan!.textContent = `Generation: ${context.generationCount.toLocaleString()}`;
				},
			],
			always: 'Run',
		},
		Done: {},
	},
});

createActor(machine).start();
