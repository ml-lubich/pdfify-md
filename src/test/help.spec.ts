import test from 'ava';
import { help } from '../lib/help.js';

test('help should output help text without throwing', (t) => {
	// Capture console.log output
	const originalLog = console.log;
	let output = '';

	console.log = (message: string) => {
		output = message;
	};

	try {
		help();
		t.truthy(output);
		t.true(output.includes('pdfify-md') || output.includes('PDFIFY'));
		t.true(output.includes('Options:'));
		t.true(output.includes('Examples:'));
	} finally {
		console.log = originalLog;
	}
});

test('help should include common options', (t) => {
	const originalLog = console.log;
	let output = '';

	console.log = (message: string) => {
		output = message;
	};

	try {
		help();
		t.true(output.includes('--help'));
		t.true(output.includes('--version'));
		t.true(output.includes('--watch'));
		t.true(output.includes('--basedir'));
	} finally {
		console.log = originalLog;
	}
});
