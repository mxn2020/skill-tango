// ═══════════════════════════════════════════════════
// Skill-Tango — Logger Adapter
// Structured console logging, swap-ready for Sentry/LogRocket
// ═══════════════════════════════════════════════════

interface LoggerAdapter {
  debug(context: string, message: string, data?: unknown): void;
  info(context: string, message: string, data?: unknown): void;
  warn(context: string, message: string, data?: unknown): void;
  error(context: string, message: string, data?: unknown): void;
}

const LEVEL_STYLES = {
  debug: 'color: #94a3b8; font-weight: normal;',
  info: 'color: #38bdf8; font-weight: bold;',
  warn: 'color: #f59e0b; font-weight: bold;',
  error: 'color: #f43f5e; font-weight: bold;',
};

const LEVEL_BADGES = {
  debug: '🔍 DEBUG',
  info: 'ℹ️  INFO',
  warn: '⚠️  WARN',
  error: '🚨 ERROR',
};

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: keyof typeof LEVEL_STYLES, context: string, message: string, data?: unknown) {
  const timestamp = formatTimestamp();
  const badge = LEVEL_BADGES[level];
  const style = LEVEL_STYLES[level];

  const prefix = `%c[${timestamp}] [${badge}] [${context}]`;
  
  if (data !== undefined) {
    console[level === 'debug' ? 'log' : level](prefix, style, message, data);
  } else {
    console[level === 'debug' ? 'log' : level](prefix, style, message);
  }
}

export const logger: LoggerAdapter = {
  debug: (context, message, data) => log('debug', context, message, data),
  info: (context, message, data) => log('info', context, message, data),
  warn: (context, message, data) => log('warn', context, message, data),
  error: (context, message, data) => log('error', context, message, data),
};
