import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

// Configure structured logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});

export interface LogContext {
  correlation_id: string;
  user_id?: string;
  auth0_id?: string;
  ip_address?: string;
  user_agent?: string;
  [key: string]: unknown;
}

// Create a child logger with correlation ID
export function createContextLogger(context: Partial<LogContext>) {
  const correlationId = context.correlation_id || uuidv4();
  return logger.child({
    correlation_id: correlationId,
    ...context,
  });
}

// Generate a new correlation ID
export function generateCorrelationId(): string {
  return uuidv4();
}

// Helper to extract request context
export function getRequestContext(req: Request): Partial<LogContext> {
  const correlationId = req.headers.get('x-correlation-id') || uuidv4();

  return {
    correlation_id: correlationId,
    ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    user_agent: req.headers.get('user-agent') || undefined,
  };
}

// Export default logger
export default logger;
