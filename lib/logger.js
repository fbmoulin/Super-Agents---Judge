/**
 * Structured Logging Utility
 * Provides consistent logging across all scripts
 *
 * Environment Variables:
 *   LOG_LEVEL  - debug, info, warn, error (default: info)
 *   LOG_FORMAT - json, text (default: text)
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.info;
const IS_JSON = process.env.LOG_FORMAT === 'json';
const IS_TTY = process.stdout.isTTY;

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Symbols for different log levels
const SYMBOLS = {
  debug: '○',
  info: '●',
  warn: '⚠',
  error: '✖',
  success: '✔'
};

/**
 * Format a log entry
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted log string
 */
function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();

  if (IS_JSON) {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  }

  // Text format with optional colors
  const useColors = IS_TTY && !process.env.NO_COLOR;

  const levelColors = {
    debug: COLORS.dim,
    info: COLORS.green,
    warn: COLORS.yellow,
    error: COLORS.red
  };

  const symbol = SYMBOLS[level] || '•';
  const levelColor = useColors ? levelColors[level] || COLORS.reset : '';
  const reset = useColors ? COLORS.reset : '';
  const dim = useColors ? COLORS.dim : '';

  // Format metadata if present
  let metaStr = '';
  if (Object.keys(meta).length > 0) {
    const metaEntries = Object.entries(meta)
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' ');
    metaStr = ` ${dim}[${metaEntries}]${reset}`;
  }

  // Compact timestamp (HH:MM:SS only for TTY)
  const timeStr = IS_TTY
    ? timestamp.slice(11, 19)
    : timestamp;

  return `${dim}${timeStr}${reset} ${levelColor}${symbol} ${level.toUpperCase().padEnd(5)}${reset} ${message}${metaStr}`;
}

/**
 * Log a message at the specified level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [meta] - Additional metadata
 */
function log(level, message, meta) {
  if (LOG_LEVELS[level] >= CURRENT_LEVEL) {
    const output = formatLog(level, message, meta);

    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }
}

/**
 * Create a child logger with preset metadata
 * @param {Object} baseMeta - Base metadata for all log calls
 * @returns {Object} Logger with bound metadata
 */
function createLogger(baseMeta = {}) {
  return {
    debug: (msg, meta) => log('debug', msg, { ...baseMeta, ...meta }),
    info: (msg, meta) => log('info', msg, { ...baseMeta, ...meta }),
    warn: (msg, meta) => log('warn', msg, { ...baseMeta, ...meta }),
    error: (msg, meta) => log('error', msg, { ...baseMeta, ...meta }),
    success: (msg, meta) => {
      const output = formatLog('info', msg, { ...baseMeta, ...meta })
        .replace(SYMBOLS.info, SYMBOLS.success);
      console.log(output);
    },
    timing: (label, ms, meta) => log('info', `${label} completed`, {
      ...baseMeta,
      ...meta,
      durationMs: Math.round(ms)
    })
  };
}

/**
 * Create a section header for visual separation
 * @param {string} title - Section title
 */
function section(title) {
  if (CURRENT_LEVEL <= LOG_LEVELS.info) {
    const useColors = IS_TTY && !process.env.NO_COLOR;
    const cyan = useColors ? COLORS.cyan : '';
    const reset = useColors ? COLORS.reset : '';
    const bold = useColors ? COLORS.bold : '';
    const line = '─'.repeat(60);
    console.log(`\n${cyan}${line}${reset}`);
    console.log(`${bold}${title}${reset}`);
    console.log(`${cyan}${line}${reset}\n`);
  }
}

/**
 * Log a test result (pass/fail)
 * @param {string} name - Test name
 * @param {boolean} passed - Whether test passed
 * @param {string} [details] - Additional details
 */
function testResult(name, passed, details) {
  const useColors = IS_TTY && !process.env.NO_COLOR;
  const symbol = passed ? SYMBOLS.success : SYMBOLS.error;
  const color = passed
    ? (useColors ? COLORS.green : '')
    : (useColors ? COLORS.red : '');
  const reset = useColors ? COLORS.reset : '';

  let output = `${color}${symbol}${reset} ${name}`;
  if (details) {
    output += ` ${useColors ? COLORS.dim : ''}(${details})${reset}`;
  }
  console.log(output);
}

// Default logger instance
const logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  success: (msg, meta) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.info) {
      const output = formatLog('info', msg, meta).replace(SYMBOLS.info, SYMBOLS.success);
      console.log(output);
    }
  },
  timing: (label, ms, meta) => log('info', `${label} completed`, {
    ...meta,
    durationMs: Math.round(ms)
  }),
  section,
  testResult,
  createLogger
};

module.exports = logger;
