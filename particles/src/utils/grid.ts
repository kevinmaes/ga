// const GRID_WIDTH = 1600;
// const GRID_HEIGHT = 400;

export interface GridCell {
	id: number;
	startX: number;
	startY: number;
	endX: number;
	endY: number;
}

export function getGrid() {
	// Divide the grid into 16 cells, each 100 wide and 400 tall.
	// Create an array of cell objects from left to right on the canvas, with startX, startY, endX, and endY properties for each cell and an id which is the index of each element from 0 to 15.
	// In the coordinate space of the canvas, the top left of the grid starts at x: 0, y: 600 and the bottom right of the grid is at x:1600, y:1000.
	// We need to offset all y positions in the grid cells to add an additional offset of 600.
	const grid: GridCell[] = [];
	for (let i = 0; i < 16; i++) {
		const startX = i * 100;
		const startY = 200;
		const endX = startX + 100;
		const endY = 600;
		grid.push({ startX, startY, endX, endY, id: i });
	}
	return grid;
}

// Create a function that takes in xPos and yPos and returns the grid cell object those coordinates are in.
export function getCurrentGridCell(xPos: number, yPos: number) {
	const grid = getGrid();
	return grid.find((cell) => {
		return (
			xPos >= cell.startX &&
			xPos <= cell.endX &&
			yPos >= cell.startY &&
			yPos <= cell.endY
		);
	});
}

export function getCurrentGridCellId(x: number, y: number) {
	return getCurrentGridCell(x, y)?.id ?? 0;
}

// Create a function that takes in xPos, yPos, and a grid cell object and returns the direction to the center of that cell.
export function getDirectionToCell(xPos: number, yPos: number, cell: GridCell) {
	const x = xPos - (cell.startX + cell.endX) / 2;
	const y = yPos - (cell.startY + cell.endY) / 2;
	return Math.atan2(y, x);
}

export function getSinglePointForCell(cellId: number) {
	if (cellId < 0) {
		return null;
	}
	const cell = getGrid()[cellId];
	return { x: (cell.startX + cell.endX) / 2, y: (cell.startY + cell.endY) / 2 };
}
