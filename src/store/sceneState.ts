/**
 * Single source of truth for the 3D choreography.
 * A plain mutable object — the GSAP master timeline tweens these values,
 * and the R3F frame loop lerps the real camera/mesh/uniforms toward them.
 * NEVER put this in React state; it is written every scrolled frame.
 */
export const sceneState = {
  shard: {
    x: 0,
    y: -0.2,
    z: 0,
    scale: 0.6, // preloader exit tweens this to 1.0 with back.out
    rotX: 0,
    /** accumulates half-turns as the shard crosses sides in the work section */
    rotY: 0,
    rotZ: 0,
  },
  cam: { x: 0, y: 0, z: 6 },
  uAmp: 0.18,
  uFreq: 1.6,
  uRim: 0.5,
  /** additive rim boost while hovering a work card */
  rimBoost: 0,
  /** lenis velocity normalized to [-1, 1], decays 0.92/frame when idle */
  velocity: 0,
  /** master timeline progress 0..1 (drives the nav readout) */
  progress: 0,
}
