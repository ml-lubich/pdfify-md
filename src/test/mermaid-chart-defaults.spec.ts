import test from 'ava';
import { MERMAID_CONSTANTS } from '../lib/config/constants.js';
import { help } from '../lib/help.js';

/**
 * Vertical flowcharts used to be clamped to a thumbnail (250×200).
 * A printed page needs a readable column, and the renderer must pin a
 * current Mermaid release instead of the floating v10 CDN.
 */
test('mermaid defaults are page-readable and pin Mermaid 11', (t) => {
	t.is(
		MERMAID_CONSTANTS.CDN_URL,
		'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js',
	);
	t.true(MERMAID_CONSTANTS.MAX_VERTICAL_CHART_WIDTH_PX >= 640);
	t.true(MERMAID_CONSTANTS.MAX_CHART_HEIGHT_PX >= 640);
	t.true(MERMAID_CONSTANTS.MAX_HORIZONTAL_CHART_WIDTH_PX >= 1200);
});

test('help text quotes the same mermaid size defaults as the constants', (t) => {
	const originalLog = console.log;
	let output = '';
	console.log = (message: string) => {
		output = message;
	};

	try {
		help();
	} finally {
		console.log = originalLog;
	}

	t.true(output.includes(`default: ${MERMAID_CONSTANTS.MAX_VERTICAL_CHART_WIDTH_PX}`));
	t.true(output.includes(`default: ${MERMAID_CONSTANTS.MAX_CHART_HEIGHT_PX}`));
	t.true(output.includes(`default: ${MERMAID_CONSTANTS.MAX_HORIZONTAL_CHART_WIDTH_PX}`));
});
