/**
 * Every demo on the stage is a tiny app that changes state once. `sweep` plays
 * the real engine across the stage and hands back the moment the band covers
 * it, which is when the app swaps what is underneath.
 */
export type DemoProps = {
  /** Runs one sweep over the stage; the callback lands at the midpoint. */
  sweep: (atMidpoint?: () => void) => void;
};
