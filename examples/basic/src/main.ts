import { fssStyles } from './demo.fss';

const host = document.querySelector('#app');
if (!(host instanceof HTMLElement)) {
	throw new Error('Expected #app element');
}

const shadow = host.attachShadow({ mode: 'open' });
fssStyles.adopt(shadow);
shadow.innerHTML = `
	<p class="title">FSS example</p>
	<p class="hint">Edit src/demo.fss and save — Vite hot-reloads the stylesheet.</p>
`;
