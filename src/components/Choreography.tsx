import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sceneState } from '../store/sceneState'

gsap.registerPlugin(ScrollTrigger)

// HMR safety: kill the stale trigger set before the updated module registers
// a new one — otherwise every hot update stacks duplicates over dead tweens.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    ScrollTrigger.getAll().forEach((t) => t.kill())
  })
}

const FOV = 35
const WORK_CAM_Z = 6.2

/**
 * Parked column x, computed from the camera frustum so the shard's whole body
 * sits inside one half of the screen at any viewport. halfW is the frustum
 * half-width at the shard plane; 0.52 parks the CENTER 52% toward the edge.
 */
function side() {
  const aspect = window.innerWidth / window.innerHeight
  const halfW = Math.tan(((FOV / 2) * Math.PI) / 180) * WORK_CAM_Z * aspect
  return halfW * 0.52
}

/**
 * Scroll choreography. Every trigger tweens the plain sceneState object only —
 * the R3F frame loop lerps the real scene toward it. All segments are pure
 * .to() so they start from live current values and survive jump-ins, resize
 * and back-scrubbing. The shard's WORK journey has exactly ONE owner timeline.
 */
export default function Choreography() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          noPref: '(prefers-reduced-motion: no-preference)',
          small: '(max-width: 1439px)',
        },
        (ctx) => {
        if (!ctx.conditions?.noPref) return
        // Laptop-and-smaller screens: no side crossings at all — the shard
        // holds center stage through the work section. Only large desktops
        // get the side-swap choreography.
        const small = !!ctx.conditions?.small
        // ---- master: progress readout + slow rotZ tumble (rotZ ONLY) ----
        gsap.timeline({
          scrollTrigger: {
            trigger: '#main',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2,
            onUpdate: (self) => {
              sceneState.progress = self.progress
              const readout = document.getElementById('scroll-progress')
              if (readout) {
                readout.textContent = String(Math.round(self.progress * 100)).padStart(3, '0')
              }
            },
          },
          defaults: { ease: 'none' },
        }).to(sceneState.shard, { rotZ: -Math.PI * 0.5 }, 0)

        // ---- studio entry ----
        gsap
          .timeline({
            scrollTrigger: { trigger: '#studio', start: 'top 95%', end: 'top 15%', scrub: 1.2 },
            defaults: { ease: 'none' },
          })
          .to(sceneState.shard, { x: 1.6, y: 0, z: 0, scale: 0.85, duration: 1 }, 0)
          .to(sceneState.cam, { x: -0.6, y: 0.3, z: 5, duration: 1 }, 0)
          .to(sceneState.camTarget, { x: 1.6, y: 0, z: 0, duration: 1 }, 0)
          .to(sceneState, { uAmp: 0.1, uFreq: 2.4, uRim: 0.3, duration: 1 }, 0)

        // ---- WORK ----
        const work = gsap.timeline({
          scrollTrigger: {
            trigger: '#work',
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: small ? 0.6 : 1,
            invalidateOnRefresh: true,
          },
          defaults: { ease: 'none' },
        })

        if (!small) {
          // DESKTOP: one scrubbed timeline owns the whole journey.
          // Explicit positions: enter [0-0.6], hold1 [0.6-1.6], cross1 [1.6-3.2],
          // hold2 [3.2-4.2], cross2 [4.2-5.8], hold3 [5.8-6.8].
          // camTarget is PINNED at center for the whole section — the camera must
          // not look at the shard here or it re-centers it and kills the columns.
          // cam.x counter-pans slightly opposite the shard to push it deeper
          // into its column.
          work
            // enter: park RIGHT beside IONFIELD
            .to(sceneState.shard, { x: () => side(), y: 0.05, z: 0, scale: 0.8, duration: 0.6 }, 0)
            .to(sceneState.cam, { x: () => -side() * 0.18, y: 0, z: WORK_CAM_Z, duration: 0.6 }, 0)
            .to(sceneState.camTarget, { x: 0, y: 0.15, z: 0, duration: 0.6 }, 0)
            .to(sceneState, { uAmp: 0.07, uFreq: 2.4, uRim: 0.25, duration: 0.6 }, 0)
            // hold 1 — explicit hold keeps playhead ownership
            .to(sceneState.shard, { x: () => side(), duration: 1 }, 0.6)
            // crossing 1: rise-flip-carry to the LEFT (full 360° across the carry)
            .to(sceneState.shard, { x: 0, y: 0.95, z: 0.6, scale: 0.94, rotY: '+=' + Math.PI, duration: 0.8 }, 1.6)
            .to(sceneState, { uRim: 0.7, duration: 0.8 }, 1.6)
            .to(sceneState.cam, { x: () => side() * 0.18, duration: 1.6 }, 1.6)
            .to(sceneState.shard, { x: () => -side(), y: 0.05, z: 0, scale: 0.8, rotY: '+=' + Math.PI, duration: 0.8 }, 2.4)
            .to(sceneState, { uRim: 0.25, duration: 0.8 }, 2.4)
            // hold 2 — LEFT beside HALFTONE
            .to(sceneState.shard, { x: () => -side(), duration: 1 }, 3.2)
            // crossing 2: carry back RIGHT
            .to(sceneState.shard, { x: 0, y: 0.95, z: 0.6, scale: 0.94, rotY: '+=' + Math.PI, duration: 0.8 }, 4.2)
            .to(sceneState, { uRim: 0.7, duration: 0.8 }, 4.2)
            .to(sceneState.cam, { x: () => -side() * 0.18, duration: 1.6 }, 4.2)
            .to(sceneState.shard, { x: () => side(), y: 0.05, z: 0, scale: 0.8, rotY: '+=' + Math.PI, duration: 0.8 }, 5)
            .to(sceneState, { uRim: 0.25, duration: 0.8 }, 5)
            // hold 3 — RIGHT beside DEEP CURRENT, clean handoff to process
            .to(sceneState.shard, { x: () => side(), duration: 1 }, 5.8)
        } else {
          // LAPTOP AND SMALLER: no crossings — the shard drifts to center
          // stage and simply holds there for the whole work section, with a
          // slow full turn across the span. Calm, whip-proof by construction.
          work
            .to(sceneState.shard, { x: 0, y: 0.05, z: -0.4, scale: 0.75, duration: 0.6 }, 0)
            .to(sceneState.cam, { x: 0, y: 0, z: WORK_CAM_Z, duration: 0.6 }, 0)
            .to(sceneState.camTarget, { x: 0, y: 0.15, z: 0, duration: 0.6 }, 0)
            .to(sceneState, { uAmp: 0.07, uFreq: 2.4, uRim: 0.25, duration: 0.6 }, 0)
            .to(sceneState.shard, { rotY: '+=' + Math.PI * 2, duration: 6.2, ease: 'none' }, 0.6)
        }

        // ---- process: THE PEAK. Pure .to() from live values; range starts
        // exactly where the work timeline ends — zero unowned pixels. ----
        const workST = work.scrollTrigger!
        const processTl = gsap
          .timeline({
            scrollTrigger: {
              trigger: '#process',
              start: () => workST.end,
              end: () => workST.end + window.innerHeight * 0.8,
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
            defaults: { ease: 'none' },
          })
          .to(sceneState.shard, { x: 0, y: 0, z: 0, scale: 1.15, duration: 1 }, 0)
          .to(sceneState.cam, { x: 0, y: 1.8, z: 4.2, duration: 1 }, 0)
          .to(sceneState.camTarget, { x: 0, y: 0, z: 0, duration: 1 }, 0)
          .to(sceneState, { uAmp: 0.55, uFreq: 3.4, uRim: 0.8, duration: 1 }, 0)

        // process words arrive on the scrub as the shard churns (DOM only)
        const words = gsap.utils.toArray<HTMLElement>('[data-pword]')
        const wordsTl = gsap.timeline({
          scrollTrigger: { trigger: '#process', start: 'top 70%', end: 'center 40%', scrub: 1.2 },
          defaults: { ease: 'none' },
        })
        words.forEach((word, i) => {
          wordsTl.fromTo(
            word,
            { opacity: 0.08, y: 14 },
            { opacity: 1, y: 0, duration: 0.2 },
            i * 0.22,
          )
        })

        // ---- contact: settle, rim to full ember. Range is contiguous with
        // process — starts at exactly processST.end, no gap, no overlap. ----
        const processST = processTl.scrollTrigger!
        gsap
          .timeline({
            scrollTrigger: {
              trigger: '#contact',
              start: () => processST.end,
              end: () => processST.end + window.innerHeight * 0.75,
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
            defaults: { ease: 'none' },
          })
          .to(sceneState.shard, { x: 0, y: -0.1, z: 0.5, scale: 1, duration: 1 }, 0)
          .to(sceneState.cam, { x: 0, y: 0, z: 5, duration: 1 }, 0)
          .to(sceneState.camTarget, { x: 0, y: -0.1, z: 0.5, duration: 1 }, 0)
          .to(sceneState, { uAmp: 0.14, uFreq: 1.2, uRim: 1.0, duration: 1 }, 0)
        },
      )

      mm.add('(prefers-reduced-motion: reduce)', () => {
        // shard sits in the hero pose with idle drift only
        sceneState.uAmp = 0.1
        gsap.set('[data-pword]', { opacity: 1, y: 0 })
      })
    })

    if (import.meta.env.DEV) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__ST = ScrollTrigger
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__scene = sceneState
    }

    return () => ctx.revert()
  }, [])

  return null
}
