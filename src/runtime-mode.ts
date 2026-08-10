/**
 * The MVP deliberately exposes a single execution mode. Live exchange trading
 * is outside its scope and cannot be selected through configuration.
 */
export type RuntimeMode = 'paper';

export function getRuntimeMode(): RuntimeMode {
  return 'paper';
}
