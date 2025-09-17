import pino from 'pino';
import { logConfig } from '@/config';

// Create logger instance
const logger = pino({
  level: logConfig.level,
  ...(logConfig.prettyPrint && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }),
  formatters: logConfig.formatters,
  timestamp: logConfig.timestamp,
  // base: {
  //   service: 'virallens-chatbot-server',
  // },
});

// Create child logger with request ID
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

// Export default logger
export { logger };
export default logger;
