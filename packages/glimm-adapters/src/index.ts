// Framework-agnostic core entry.
//
// Re-exports the vanilla WebGL engine (shader factories, playSweep,
// palettes, easings — zero React/Next imports) alongside the vanilla
// delegated-click interceptor that previously lived in `glimm/next`.

export {
  createShader,
  createMeshShader,
  createNamedropShader,
  playSweep,
  PALETTES,
  resolvePalette,
  accentPair,
  accentChain,
  shuffleAccentPalette,
  ACCENTS,
  ACCENT_ORDER,
  EASINGS,
  resolveEasing,
  cubicBezier,
  hexToRgb,
  oklchToRgb,
  rgbToOklch,
} from "glimm";

export type {
  Palette,
  PaletteName,
  AccentName,
  Direction,
  Easing,
  EasingName,
  ShaderController,
  MeshShaderController,
  NamedropController,
  SweepOptions,
  SweepHandle,
  Vec3,
  Oklch,
} from "glimm";

export { interceptLinks, defaultShouldIntercept } from "./intercept.js";

export type { InterceptLinksOptions, NavigateFn, SweepFn } from "./intercept.js";

export { createCurtain, playCoveredSweep, viewTransitionSettled } from "./covered.js";

export type { CommitFn, CoveredSweepHandle, Curtain } from "./covered.js";

export { setupGlimmVanilla } from "./vanilla.js";

export type {
  ReducedMotionMode,
  SweepMode,
  VanillaBaseSetup,
  VanillaNavigate,
  VanillaSweepApi,
  VanillaSweepSetup,
} from "./vanilla.js";
