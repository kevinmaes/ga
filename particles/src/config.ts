export const config = {
	// Total population size limit
	populationMax: 500,

	// startingPosition is a tuple of
	// [1-100 (%) of canvas left offset, 1-100 (%) of canvas top offset]
	startingPosition: [10, 50],

	// Scale of the members.
	radius: 16,

	// Overall speed of the members.
	getStartSpeed: () => Math.random() * 6 - 3,

	// Force that keeps the ball within the canvas.
	getGlobalCoef: () => Math.round(Math.random() * 100),

	// Stability coefficient to keep random motion within a range.
	getStabilityCoef: () => 0.5,

	// Random coefficient to keep random motion within a range.
	getRandomCoef: () => Math.round(Math.random() * 20) - 10,

	// Force that keeps the ball moving forward.
	getForwardCoef: () => Math.round(Math.random()) * 0.5 - 0.25,

	// Limit the speed at which the ball can move.
	getXSpeedLimit: () => Math.random() * 10 + 6,
	getYSpeedLimit: () => Math.random() * 10 + 6,
};
