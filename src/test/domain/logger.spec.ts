/**
 * Comprehensive tests for Logger interface and implementations.
 *
 * Tests logging functionality, log levels, and edge cases.
 */

import test from 'ava';
import { ConsoleLogger, SilentLogger, LogLevel, type ILogger } from '../../lib/domain/Logger.js';

// ============================================================================
// ConsoleLogger Tests
// ============================================================================

test('ConsoleLogger should log debug messages when level is DEBUG', (t) => {
	const logger = new ConsoleLogger(LogLevel.DEBUG);
	const messages: string[] = [];

	// Capture console.debug
	const originalDebug = console.debug;
	console.debug = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	try {
		logger.debug('Test debug message');
		t.true(messages.length > 0);
		t.true(messages[0].includes('Test debug message'));
	} finally {
		console.debug = originalDebug;
	}
});

test('ConsoleLogger should log info messages when level is INFO', (t) => {
	const logger = new ConsoleLogger(LogLevel.INFO);
	const messages: string[] = [];

	const originalInfo = console.info;
	console.info = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	try {
		logger.info('Test info message');
		t.true(messages.length > 0);
		t.true(messages[0].includes('Test info message'));
	} finally {
		console.info = originalInfo;
	}
});

test('ConsoleLogger should log warn messages when level is WARN', (t) => {
	const logger = new ConsoleLogger(LogLevel.WARN);
	const messages: string[] = [];

	const originalWarn = console.warn;
	console.warn = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	try {
		logger.warn('Test warn message');
		t.true(messages.length > 0);
		t.true(messages[0].includes('Test warn message'));
	} finally {
		console.warn = originalWarn;
	}
});

test('ConsoleLogger should log error messages when level is ERROR', (t) => {
	const logger = new ConsoleLogger(LogLevel.ERROR);
	const messages: string[] = [];

	const originalError = console.error;
	console.error = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	try {
		logger.error('Test error message');
		t.true(messages.length > 0);
		t.true(messages[0].includes('Test error message'));
	} finally {
		console.error = originalError;
	}
});

test('ConsoleLogger should log error with Error object', (t) => {
	const logger = new ConsoleLogger(LogLevel.ERROR);
	const messages: string[] = [];
	const errors: Error[] = [];

	const originalError = console.error;
	console.error = (...arguments_: unknown[]) => {
		messages.push(String(arguments_[0]));
		if (arguments_[1] instanceof Error) {
			errors.push(arguments_[1]);
		}
	};

	try {
		const error = new Error('Test error');
		logger.error('Error occurred', error);
		t.true(messages.length > 0);
		t.is(errors.length, 1);
		t.is(errors[0].message, 'Test error');
	} finally {
		console.error = originalError;
	}
});

// ============================================================================
// Log Level Filtering Tests
// ============================================================================

test('ConsoleLogger should not log debug when level is INFO', (t) => {
	const logger = new ConsoleLogger(LogLevel.INFO);
	const messages: string[] = [];

	const originalDebug = console.debug;
	console.debug = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	try {
		logger.debug('Test debug message');
		t.is(messages.length, 0); // Should not log
	} finally {
		console.debug = originalDebug;
	}
});

test('ConsoleLogger should not log info when level is WARN', (t) => {
	const logger = new ConsoleLogger(LogLevel.WARN);
	const messages: string[] = [];

	const originalInfo = console.info;
	console.info = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	try {
		logger.info('Test info message');
		t.is(messages.length, 0); // Should not log
	} finally {
		console.info = originalInfo;
	}
});

test('ConsoleLogger should not log warn when level is ERROR', (t) => {
	const logger = new ConsoleLogger(LogLevel.ERROR);
	const messages: string[] = [];

	const originalWarn = console.warn;
	console.warn = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	try {
		logger.warn('Test warn message');
		t.is(messages.length, 0); // Should not log
	} finally {
		console.warn = originalWarn;
	}
});

test('ConsoleLogger should log all levels when level is DEBUG', (t) => {
	const logger = new ConsoleLogger(LogLevel.DEBUG);
	const messages: string[] = [];

	const originalDebug = console.debug;
	const originalInfo = console.info;
	const originalWarn = console.warn;
	const originalError = console.error;

	const capture = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	console.debug = capture;
	console.info = capture;
	console.warn = capture;
	console.error = capture;

	try {
		logger.debug('Debug message');
		logger.info('Info message');
		logger.warn('Warn message');
		logger.error('Error message');

		t.is(messages.length, 4);
	} finally {
		console.debug = originalDebug;
		console.info = originalInfo;
		console.warn = originalWarn;
		console.error = originalError;
	}
});

// ============================================================================
// isLevelEnabled Tests
// ============================================================================

test('isLevelEnabled should return true for enabled levels', (t) => {
	const logger = new ConsoleLogger(LogLevel.DEBUG);

	t.true(logger.isLevelEnabled(LogLevel.DEBUG));
	t.true(logger.isLevelEnabled(LogLevel.INFO));
	t.true(logger.isLevelEnabled(LogLevel.WARN));
	t.true(logger.isLevelEnabled(LogLevel.ERROR));
});

test('isLevelEnabled should return false for disabled levels', (t) => {
	const logger = new ConsoleLogger(LogLevel.ERROR);

	t.false(logger.isLevelEnabled(LogLevel.DEBUG));
	t.false(logger.isLevelEnabled(LogLevel.INFO));
	t.false(logger.isLevelEnabled(LogLevel.WARN));
	t.true(logger.isLevelEnabled(LogLevel.ERROR));
});

test('isLevelEnabled should work with INFO level', (t) => {
	const logger = new ConsoleLogger(LogLevel.INFO);

	t.false(logger.isLevelEnabled(LogLevel.DEBUG));
	t.true(logger.isLevelEnabled(LogLevel.INFO));
	t.true(logger.isLevelEnabled(LogLevel.WARN));
	t.true(logger.isLevelEnabled(LogLevel.ERROR));
});

test('isLevelEnabled should work with WARN level', (t) => {
	const logger = new ConsoleLogger(LogLevel.WARN);

	t.false(logger.isLevelEnabled(LogLevel.DEBUG));
	t.false(logger.isLevelEnabled(LogLevel.INFO));
	t.true(logger.isLevelEnabled(LogLevel.WARN));
	t.true(logger.isLevelEnabled(LogLevel.ERROR));
});

// ============================================================================
// SilentLogger Tests
// ============================================================================

test('SilentLogger should not log any messages', (t) => {
	const logger = new SilentLogger();
	const messages: string[] = [];

	const originalDebug = console.debug;
	const originalInfo = console.info;
	const originalWarn = console.warn;
	const originalError = console.error;

	const capture = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	console.debug = capture;
	console.info = capture;
	console.warn = capture;
	console.error = capture;

	try {
		logger.debug('Debug message');
		logger.info('Info message');
		logger.warn('Warn message');
		logger.error('Error message');

		t.is(messages.length, 0); // Should not log anything
	} finally {
		console.debug = originalDebug;
		console.info = originalInfo;
		console.warn = originalWarn;
		console.error = originalError;
	}
});

test('SilentLogger.isLevelEnabled should always return false', (t) => {
	const logger = new SilentLogger();

	t.false(logger.isLevelEnabled(LogLevel.DEBUG));
	t.false(logger.isLevelEnabled(LogLevel.INFO));
	t.false(logger.isLevelEnabled(LogLevel.WARN));
	t.false(logger.isLevelEnabled(LogLevel.ERROR));
});

// ============================================================================
// Edge Cases - Empty Messages
// ============================================================================

test('ConsoleLogger should handle empty messages', (t) => {
	const logger = new ConsoleLogger(LogLevel.DEBUG);
	const messages: string[] = [];

	const originalDebug = console.debug;
	console.debug = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	try {
		logger.debug('');
		t.is(messages.length, 1);
	} finally {
		console.debug = originalDebug;
	}
});

test('ConsoleLogger should handle messages with special characters', (t) => {
	const logger = new ConsoleLogger(LogLevel.DEBUG);
	const messages: string[] = [];

	const originalDebug = console.debug;
	console.debug = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	try {
		logger.debug('Message with "quotes" and \'single quotes\' and\nnewlines');
		t.true(messages.length > 0);
	} finally {
		console.debug = originalDebug;
	}
});

// ============================================================================
// Edge Cases - Multiple Arguments
// ============================================================================

test('ConsoleLogger should handle multiple arguments', (t) => {
	const logger = new ConsoleLogger(LogLevel.DEBUG);
	const messages: unknown[][] = [];

	const originalDebug = console.debug;
	console.debug = (...arguments_: unknown[]) => {
		messages.push([...arguments_]);
	};

	try {
		logger.debug('Message', 42, { a: 1 }, [1, 2, 3]);
		t.is(messages.length, 1);
		t.is(messages[0].length, 4);
	} finally {
		console.debug = originalDebug;
	}
});

// ============================================================================
// Edge Cases - Error Objects
// ============================================================================

test('ConsoleLogger should handle Error objects in warn', (t) => {
	const logger = new ConsoleLogger(LogLevel.WARN);
	const errors: Error[] = [];

	const originalWarn = console.warn;
	console.warn = (...arguments_: unknown[]) => {
		if (arguments_[1] instanceof Error) {
			errors.push(arguments_[1]);
		}
	};

	try {
		const error = new Error('Test error');
		logger.warn('Warning', error);
		t.is(errors.length, 1);
		t.is(errors[0].message, 'Test error');
	} finally {
		console.warn = originalWarn;
	}
});

test('ConsoleLogger should handle Error objects in error', (t) => {
	const logger = new ConsoleLogger(LogLevel.ERROR);
	const errors: Error[] = [];

	const originalError = console.error;
	console.error = (...arguments_: unknown[]) => {
		if (arguments_[1] instanceof Error) {
			errors.push(arguments_[1]);
		}
	};

	try {
		const error = new Error('Test error');
		logger.error('Error occurred', error, 'Additional context');
		t.is(errors.length, 1);
		t.is(errors[0].message, 'Test error');
	} finally {
		console.error = originalError;
	}
});

test('ConsoleLogger should handle undefined error', (t) => {
	const logger = new ConsoleLogger(LogLevel.ERROR);
	const messages: unknown[][] = [];

	const originalError = console.error;
	console.error = (...arguments_: unknown[]) => {
		messages.push([...arguments_]);
	};

	try {
		logger.error('Error occurred', undefined);
		t.is(messages.length, 1);
	} finally {
		console.error = originalError;
	}
});

// ============================================================================
// Edge Cases - Very Long Messages
// ============================================================================

test('ConsoleLogger should handle very long messages', (t) => {
	const logger = new ConsoleLogger(LogLevel.DEBUG);
	const messages: string[] = [];

	const originalDebug = console.debug;
	console.debug = (...arguments_: unknown[]) => {
		messages.push(arguments_.join(' '));
	};

	try {
		const longMessage = 'a'.repeat(100_000);
		logger.debug(longMessage);
		t.is(messages[0].length, 100_008); // 'a' x 100000 + prefix
	} finally {
		console.debug = originalDebug;
	}
});

// ============================================================================
// Interface Compliance Tests
// ============================================================================

test('ConsoleLogger should implement ILogger interface', (t) => {
	const logger: ILogger = new ConsoleLogger();

	t.is(typeof logger.debug, 'function');
	t.is(typeof logger.info, 'function');
	t.is(typeof logger.warn, 'function');
	t.is(typeof logger.error, 'function');
	t.is(typeof logger.isLevelEnabled, 'function');
});

test('SilentLogger should implement ILogger interface', (t) => {
	const logger: ILogger = new SilentLogger();

	t.is(typeof logger.debug, 'function');
	t.is(typeof logger.info, 'function');
	t.is(typeof logger.warn, 'function');
	t.is(typeof logger.error, 'function');
	t.is(typeof logger.isLevelEnabled, 'function');
});

// ============================================================================
// Performance Tests
// ============================================================================

test('SilentLogger should be fast (performance test)', (t) => {
	const logger = new SilentLogger();
	const start = Date.now();

	for (let i = 0; i < 10_000; i++) {
		logger.debug('Message');
		logger.info('Message');
		logger.warn('Message');
		logger.error('Message');
	}

	const end = Date.now();
	const duration = end - start;

	// Should be very fast (less than 100ms for 40000 calls)
	t.true(duration < 100);
});

// ============================================================================
// Negative Tests
// ============================================================================

test('ConsoleLogger should handle null messages (negative test)', (t) => {
	const logger = new ConsoleLogger(LogLevel.DEBUG);

	// Should not throw
	t.notThrows(() => {
		// @ts-expect-error - intentionally testing edge case
		logger.debug(null);
	});
});

test('ConsoleLogger should handle undefined messages (negative test)', (t) => {
	const logger = new ConsoleLogger(LogLevel.DEBUG);

	// Should not throw
	t.notThrows(() => {
		// @ts-expect-error - intentionally testing edge case
		logger.debug(undefined);
	});
});
