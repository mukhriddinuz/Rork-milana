/**
 * Lightweight logger.
 *
 * `log`/`warn` are silenced in production builds so we never ship the
 * development chatter (auth state, order ids, …) to end-user consoles.
 * `error` always fires so real failures remain observable.
 */
const isDev: boolean =
  typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
