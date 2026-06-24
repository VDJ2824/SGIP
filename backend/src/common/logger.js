export function createLogger(namespace = 'sgip') {
  return {
    info: (message, meta = {}) => console.log(JSON.stringify({ level: 'info', namespace, message, ...meta })),
    warn: (message, meta = {}) => console.warn(JSON.stringify({ level: 'warn', namespace, message, ...meta })),
    error: (message, meta = {}) => console.error(JSON.stringify({ level: 'error', namespace, message, ...meta })),
  };
}

export const logger = createLogger();
