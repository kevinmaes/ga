import './style.css';
import actor from './statechart.ts';
import { msToSeconds } from './utils/time.ts';

actor.subscribe((state) => {
	// Disable the start button when state matches 'Run'
	if (state.matches('Run')) {
		const startBtn = document.querySelector<HTMLButtonElement>('#start-btn')!;
		startBtn.disabled = state.matches('Run');

		// Display the current-generation info
		const currentGenerationItem = document.querySelector(
			'.current-generation'
		) as HTMLDivElement;
		currentGenerationItem.innerHTML = `
      <p>Gen: ${state.context.generation}</p>
      <p>${msToSeconds(Date.now() - state.context.generationStart!)}
      </p>
      <p>running...</p>
    `;
	}
});

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="canvas" width="1600" height="600"></canvas>
    <div class="card">
      <div class="generation-info">
        <div class="current-generation"></div>
        <ul id="generation-list" class="generation-list"></ul>
      </div>
      <button id="start-btn" type="button">Run</button>
    </div>
  </div>
`;

document
	.querySelector<HTMLButtonElement>('#start-btn')!
	.addEventListener('click', () => {
		actor.send({ type: 'start' });
	});
