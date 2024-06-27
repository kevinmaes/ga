import { assign, createActor, not, setup } from 'xstate';
import { config } from './config.ts';
import { Ball } from './Ball.ts';
import { calculateFitness, mutate, rouletteWheelSelection } from './ga.ts';
import { createBoxBoundaries } from './boundaries.ts';
import { msToSeconds } from './utils/time.ts';

// Get the color styles off of the root element
const rootStyle = getComputedStyle(document.documentElement);
const backgroundColor = rootStyle.getPropertyValue('--color-background').trim();

// Retrieve the value of the CSS variable
const boundaryColor = rootStyle
	.getPropertyValue('--color-detectable-boundary')
	.trim();

export const machine = setup({
	types: {
		context: {} as {
			canvasCtx: CanvasRenderingContext2D;
			canvas: HTMLCanvasElement;
			config: typeof config;
			populationMax: number;
			population: Ball[];
			selectedParents: Ball[];
			nextGeneration: Ball[];
			generation: number;
			generationStart: number | undefined;
			generationDuration: number | undefined;
			goalReachedCount: number;
			mutationRate: number;
			maxGenerations: number;
		},
		events: {} as
			| { type: 'next' }
			| { type: 'start' }
			| { type: 'advance' }
			| { type: 'generation.dispatch' },
	},
	actions: {
		draw: ({ context }) => {
			const { canvasCtx: ctx, canvas, population } = context;

			// Clear the previous canvas contents.
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw the path boundaries
			const boundaries = createBoxBoundaries({
				thickness: 120,
				color: boundaryColor,
				ctx,
				canvas,
			});

			population.forEach((member) => member.draw(canvas, boundaries));
		},
		updateGenerationInformation: ({ context }) => {
			const { generationStart } = context;

			if (typeof generationStart === 'undefined') return;

			// Update the current-generation info
			const currentGenerationItem = document.querySelector(
				'.current-generation'
			) as HTMLDivElement;
			currentGenerationItem.innerHTML = `
				<p>Gen: ${context.generation}</p>
				<p>${msToSeconds(Date.now() - generationStart)}
				</p>
				<p>${((context.goalReachedCount / context.config.populationMax) * 100).toFixed(
					1
				)}% success
				</p>
			`;

			// Add another <li> to the <ul> for each generation
			const generationItem = document.createElement('li');
			generationItem.classList.add('generation-item');
			generationItem.innerHTML = `
				<p>Gen: ${context.generation}</p>
				<p>${msToSeconds(Date.now() - generationStart)}
				</p>
				<p>${((context.goalReachedCount / context.config.populationMax) * 100).toFixed(
					1
				)}% success</p>
			`;

			const generationList = document.querySelector('.generation-list');
			if (generationList?.childNodes.length) {
				generationList.prepend(generationItem);
			} else {
				generationList?.appendChild(generationItem);
			}
		},
		reEnableRunButton: () => {
			// Enable the start button
			const startBtn = document.querySelector<HTMLButtonElement>('#start-btn')!;
			startBtn.disabled = false;
		},
	},
	guards: {
		'all members have stopped and termination condition is met': function ({
			context,
		}) {
			// Add your guard condition here
			return context.population.every((ball) => ball.dead);
		},
	},
	schemas: {
		events: {
			next: {
				type: 'object',
				properties: {},
			},
			start: {
				type: 'object',
				properties: {},
			},
			advance: {
				type: 'object',
				properties: {},
			},
			'generation.dispatch': {
				type: 'object',
				properties: {},
			},
		},
		context: {
			population: {
				type: 'array',
				items: {
					type: 'string',
				},
				description:
					'Generated automatically based on the key: "population" in initial context values',
			},
			selectedParents: {
				type: 'array',
				items: {
					type: 'string',
				},
				description:
					'Generated automatically based on the key: "selectedParents" in initial context values',
			},
			nextGeneration: {
				type: 'array',
				items: {
					type: 'string',
				},
				description:
					'Generated automatically based on the key: "nextGeneration" in initial context values',
			},
			generation: {
				type: 'number',
				description:
					'Generated automatically based on the key: "generation" in initial context values',
			},
			goalReached: {
				type: 'number',
				description:
					'Generated automatically based on the key: "goalReached" in initial context values',
			},
			mutationRate: {
				type: 'number',
				description:
					'Generated automatically based on the key: "mutationRate" in initial context values',
			},
			maxGenerations: {
				type: 'number',
				description:
					'Generated automatically based on the key: "maxGenerations" in initial context values',
			},
		},
	},
}).createMachine({
	context: {
		canvasCtx: {} as CanvasRenderingContext2D,
		canvas: {} as HTMLCanvasElement,
		config,
		population: [],
		populationMax: config.populationMax,
		selectedParents: [],
		nextGeneration: [],
		generation: 1,
		generationStart: undefined,
		generationDuration: undefined,
		goalReachedCount: 0,
		mutationRate: 0.05,
		maxGenerations: 100,
	},
	id: 'Genetic Algorithm',
	initial: 'Uninitialized',
	description:
		'A genetic algorithm or GA to train a swarm of particles to migrate towards a positional goal.',
	states: {
		Uninitialized: {
			on: {
				start: 'Initialization',
			},
		},
		Initialization: {
			entry: [
				assign(() => {
					const canvas = document.getElementById('canvas') as HTMLCanvasElement;
					const ctx = canvas.getContext('2d');

					if (ctx === null) {
						throw new Error('ctx is null');
					}

					return {
						canvasCtx: ctx,
						canvas,
					};
				}),
				assign(({ context }) => {
					const { canvasCtx, populationMax, canvas, config } = context;
					const generationStart = Date.now();

					const population = [];
					for (let i = 0; i < populationMax; i++) {
						const individual = new Ball({
							ctx: canvasCtx,
							xPos: canvas.width * config.startingPosition[0] * 0.01,
							yPos: canvas.height * config.startingPosition[1] * 0.01,
							radius: config.radius,
							xSpeed: config.getStartSpeed(),
							ySpeed: config.getStartSpeed(),
							coef: config.getGlobalCoef(),
							stabilityCoef: config.getStabilityCoef(),
							randomCoef: config.getRandomCoef(),
							forwardCoef: config.getForwardCoef(),
							xLimit: config.getXSpeedLimit(),
							yLimit: config.getYSpeedLimit(),
							radarStrength: Math.ceil(Math.random() * 100),
						});
						individual.startLife(generationStart);
						population.push(individual);
					}

					return {
						generationStart,
						population,
					};
				}),
			],
			always: 'Run',
			description: 'Generate an initial population of particles.',
		},
		Run: {
			entry: 'draw',
			after: {
				'5': [
					{
						target: 'Run',
						reenter: true,
						guard: not(
							'all members have stopped and termination condition is met'
						),
					},
					{
						target: 'Evaluation',
					},
				],
			},
			description: 'Evaluate the fitness of each individual in the population.',
		},
		Evaluation: {
			entry: [
				assign(({ context }) => {
					const { canvas } = context;

					if (!context.generationStart) {
						throw new Error('generationStart is undefined');
					}
					const generationDuration = Date.now() - context.generationStart;

					if (!generationDuration) {
						throw new Error('generationDuration is undefined');
					}

					// Assign fitness weights to prioritize certain fitness criteria.
					const fitnessWeights = {
						completion: 3,
						completionPosition: 4,
						xPosition: 3,
						avoidance: 1.5,
					};

					const goalReachedCount = context.population.filter(
						(ball) => ball.goalReached
					).length;

					return {
						generationDuration,
						goalReachedCount,
						population: context.population.map((ball) => {
							const fitness = calculateFitness(
								ball,
								generationDuration,
								canvas,
								fitnessWeights
							);
							return ball.assignFitness(fitness);
						}),
					};
				}),
			],
			always: 'Selection',
		},
		Selection: {
			entry: [
				assign({
					selectedParents: ({ context }) => {
						const { population } = context;

						const selectedParents = [];
						// Only select a total of 33% of the population to be parents
						// based on roulette wheel selection.
						for (let i = 0; i < population.length / 3; i++) {
							selectedParents.push(rouletteWheelSelection(population));
						}

						return selectedParents;
					},
				}),
			],
			always: 'Crossover',
			description: 'Select individuals based on their fitness to reproduce.',
		},
		Crossover: {
			entry: [
				assign({
					nextGeneration: ({ context }) => {
						const {
							selectedParents,
							populationMax,
							canvasCtx,
							canvas,
							config,
						} = context;

						const nextGeneration: Ball[] = [];

						// Iterate through the entire population to create the next generation
						for (let i = 0; i < populationMax; i++) {
							// Randomly select two parents from the selected parents
							const parent1 =
								selectedParents[
									Math.floor(Math.random() * selectedParents.length)
								];
							const parent2 =
								selectedParents[
									Math.floor(Math.random() * selectedParents.length)
								];

							const child = new Ball({
								ctx: canvasCtx,
								xPos: canvas.width * config.startingPosition[0] * 0.01,
								yPos: canvas.height * config.startingPosition[1] * 0.01,
								radius: config.radius,
								xSpeed: (parent1.xSpeed + parent2.xSpeed) / 2,
								ySpeed: (parent1.ySpeed + parent2.ySpeed) / 2,
								coef: (parent1.coef + parent2.coef) / 2,
								stabilityCoef:
									(parent1.stabilityCoef + parent2.stabilityCoef) / 2,
								randomCoef: (parent1.randomCoef + parent2.randomCoef) / 2,
								forwardCoef: (parent1.forwardCoef + parent2.forwardCoef) / 2,
								xLimit: (parent1.xLimit + parent2.xLimit) / 2,
								yLimit: (parent1.yLimit + parent2.yLimit) / 2,
								parentLifespan: (parent1.lifespan + parent2.lifespan) / 2,
								radarStrength: Math.floor(
									(parent1.radarStrength + parent2.radarStrength) / 2
								),
							});
							nextGeneration.push(child);
						}
						return nextGeneration;
					},
				}),
			],
			always: 'Mutation',
			description:
				'Create new offspring by combining aspects of the selected individuals.',
		},
		Mutation: {
			entry: [
				assign({
					nextGeneration: ({ context }) => {
						const { nextGeneration, mutationRate } = context;

						return nextGeneration.map((member) => {
							return mutate(
								member,
								[
									'xSpeed',
									'ySpeed',
									'xLimit',
									'yLimit',
									'coef',
									'stabilityCoef',
									'randomCoef',
									'forwardCoef',
								],
								mutationRate,
								8
							);
						});
					},
				}),
			],
			always: 'Done',
			description:
				'Introduce random changes to the offspring to maintain genetic diversity.',
		},
		Done: {
			entry: ['draw', 'updateGenerationInformation', 'reEnableRunButton'],
			on: {
				start: {
					target: 'Run',
					actions: [
						assign(({ context }) => {
							const { generation, nextGeneration } = context;
							const generationStart = Date.now();

							return {
								population: nextGeneration.map((ball) => {
									return ball.startLife(generationStart);
								}),
								nextGeneration: [],
								generationStart,
								generation: generation + 1,
							};
						}),
					],
				},
			},
		},
	},
});

const actor = createActor(machine);
actor.start();

export default actor;
