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
const SHARD_R = 1.4 // icosahedron base radius
/** counter-pan ratio — the ONLY source of work-section cam.x, via camPanX() */
const K = 0.18

/**
 * Screen-space solver: the work columns are specified as SCREEN targets and
 * world values are derived, so placement holds pixel-consistent at every
 * width. Used by BOTH the desktop scrubbed timeline and the mobile carry.
 */
function halfH() {
  return Math.tan(((FOV / 2) * Math.PI) / 180) * WORK_CAM_Z // shard parks at z 0
}
function halfW() {
  return halfH() * (window.innerWidth / window.innerHeight)
}
/**
 * Parked scale: silhouette ≈ 52% of half the viewport height everywhere.
 * The min(halfH, halfW) term shrinks it further on very narrow aspects so
 * ndcTarget() can keep |NDC x| ≥ ~0.45 without clipping (700px-wide case).
 */
function shardScaleFor() {
  return gsap.utils.clamp(0.55, 0.95, (0.52 * Math.min(halfH(), halfW())) / SHARD_R)
}
function radiusNdc() {
  return (shardScaleFor() * SHARD_R) / halfW()
}
/** column center in NDC — auto-retreats on narrow aspects so nothing clips */
function ndcTarget() {
  return Math.min(0.6, 0.97 - radiusNdc())
}
function sideWorldX(dir: 1 | -1) {
  return (dir * ndcTarget() * halfW()) / (1 + K)
}
function camPanX(dir: 1 | -1) {
  return -K * sideWorldX(dir)
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
          small: '(max-width: 1023px)',
        },
        (ctx) => {
        if (!ctx.conditions?.noPref) return
        // Below 1024px a single wheel flick can cover more scroll than an
        // entire crossing span, so ANY scrub replays the crossing as a whip.
        // There, scroll SELECTS the side and time ANIMATES the carry.
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
        // scrub 0.8 < work's smoothing: studio's inertia must never outlast
        // the work section's writes, or its final values land last and stick
        gsap
          .timeline({
            scrollTrigger: { trigger: '#studio', start: 'top 95%', end: 'top 15%', scrub: 0.8 },
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
            .to(sceneState.shard, { x: () => sideWorldX(1), y: 0.05, z: 0, scale: () => shardScaleFor(), duration: 0.6 }, 0)
            .to(sceneState.cam, { x: () => camPanX(1), y: 0, z: WORK_CAM_Z, duration: 0.6 }, 0)
            .to(sceneState.camTarget, { x: 0, y: 0.15, z: 0, duration: 0.6 }, 0)
            .to(sceneState, { uAmp: 0.07, uFreq: 2.4, uRim: 0.25, duration: 0.6 }, 0)
            // full-span camera/uniform holds: keep re-asserting these every
            // rendered tick so a late smoothed write from a neighbouring
            // section can never stick (the studio→work camTarget race).
            // They stop at 6.3 — the return leg owns the last half-unit.
            .to(sceneState.camTarget, { x: 0, y: 0.15, z: 0, duration: 5.7 }, 0.6)
            .to(sceneState.cam, { y: 0, z: WORK_CAM_Z, duration: 5.7 }, 0.6)
            .to(sceneState, { uAmp: 0.07, uFreq: 2.4, duration: 5.7 }, 0.6)
            // cam.x holds cover the gaps between the two crossing pan tweens
            .to(sceneState.cam, { x: () => camPanX(1), duration: 1 }, 0.6)
            .to(sceneState.cam, { x: () => camPanX(-1), duration: 1 }, 3.2)
            .to(sceneState.cam, { x: () => camPanX(1), duration: 0.5 }, 5.8)
            // hold 1 — explicit hold keeps playhead ownership
            .to(sceneState.shard, { x: () => sideWorldX(1), duration: 1 }, 0.6)
            // crossing 1: rise-flip-carry to the LEFT (full 360° across the carry)
            .to(sceneState.shard, { x: 0, y: 0.95, z: 0.6, scale: () => shardScaleFor() * 1.15, rotY: '+=' + Math.PI, duration: 0.8 }, 1.6)
            .to(sceneState, { uRim: 0.7, duration: 0.8 }, 1.6)
            .to(sceneState.cam, { x: () => camPanX(-1), duration: 1.6 }, 1.6)
            .to(sceneState.shard, { x: () => sideWorldX(-1), y: 0.05, z: 0, scale: () => shardScaleFor(), rotY: '+=' + Math.PI, duration: 0.8 }, 2.4)
            .to(sceneState, { uRim: 0.25, duration: 0.8 }, 2.4)
            // hold 2 — LEFT beside HALFTONE
            .to(sceneState.shard, { x: () => sideWorldX(-1), duration: 1 }, 3.2)
            // crossing 2: carry back RIGHT
            .to(sceneState.shard, { x: 0, y: 0.95, z: 0.6, scale: () => shardScaleFor() * 1.15, rotY: '+=' + Math.PI, duration: 0.8 }, 4.2)
            .to(sceneState, { uRim: 0.7, duration: 0.8 }, 4.2)
            .to(sceneState.cam, { x: () => camPanX(1), duration: 1.6 }, 4.2)
            .to(sceneState.shard, { x: () => sideWorldX(1), y: 0.05, z: 0, scale: () => shardScaleFor(), rotY: '+=' + Math.PI, duration: 0.8 }, 5)
            .to(sceneState, { uRim: 0.25, duration: 0.8 }, 5)
            // hold 3 — RIGHT beside DEEP CURRENT
            .to(sceneState.shard, { x: () => sideWorldX(1), duration: 0.5 }, 5.8)
            // return leg [6.3-6.8]: carry most of the way back to center while
            // still inside the work range, so the process shot receives the
            // shard nearly home instead of starting the centering itself late
            .to(sceneState.shard, { x: 0, y: 0.15, z: 0.1, scale: () => shardScaleFor() * 1.05, rotY: '+=' + Math.PI * 0.5, duration: 0.5 }, 6.3)
            .to(sceneState.cam, { x: 0, y: 0.5, z: 5.6, duration: 0.5 }, 6.3)
            .to(sceneState.camTarget, { y: 0.1, duration: 0.5 }, 6.3)
            .to(sceneState, { uAmp: 0.25, uFreq: 2.8, uRim: 0.4, duration: 0.5 }, 6.3)
        } else {
          // SMALL SCREENS: scroll selects the state; time animates the carry.
          // The scrubbed timeline keeps ONLY the section entry (drift to the
          // first side) plus a filler so the entry occupies the same fraction
          // of the span — crossings are owned by goToSide() below.
          work
            .to(sceneState.shard, { x: () => sideWorldX(1), y: 0.05, z: 0, scale: () => shardScaleFor(), duration: 0.6 }, 0)
            .to(sceneState.cam, { x: () => camPanX(1), y: 0, z: WORK_CAM_Z, duration: 0.6 }, 0)
            .to(sceneState.camTarget, { x: 0, y: 0.15, z: 0, duration: 0.6 }, 0)
            .to(sceneState, { uAmp: 0.07, uFreq: 2.4, uRim: 0.25, duration: 0.6 }, 0)
            // full-span holds (see desktop branch): the section owns its
            // camera aim/height and uniforms while you're inside it.
            // cam.x is NOT held here — the time-based carry owns it.
            .to(sceneState.camTarget, { x: 0, y: 0.15, z: 0, duration: 5.7 }, 0.6)
            .to(sceneState.cam, { y: 0, z: WORK_CAM_Z, duration: 5.7 }, 0.6)
            .to(sceneState, { uAmp: 0.07, uFreq: 2.4, duration: 5.7 }, 0.6)
            .to({ v: 0 }, { v: 1, duration: 6.2 }, 0.6)
            // return leg [6.3-6.8]: bring the shard home before the process
            // handoff (starts from the live parked side via pure .to)
            .to(sceneState.shard, { x: 0, y: 0.15, z: 0.1, scale: () => shardScaleFor() * 1.05, duration: 0.5 }, 6.3)
            .to(sceneState.cam, { x: 0, y: 0.5, z: 5.6, duration: 0.5 }, 6.3)
            .to(sceneState.camTarget, { y: 0.1, duration: 0.5 }, 6.3)
            .to(sceneState, { uAmp: 0.25, uFreq: 2.8, uRim: 0.4, duration: 0.5 }, 6.3)

          // time-based carry: ~0.9s regardless of how violently the user flicks.
          // overwrite: 'auto' lets a rapid direction flip kill the in-flight
          // carry cleanly instead of stacking tweens.
          const goToSide = (dir: 1 | -1) => {
            const tl = gsap.timeline()
            tl.to(sceneState.shard, {
              x: 0,
              y: 0.7,
              z: 0.4,
              scale: () => shardScaleFor() * 1.12,
              rotY: '+=' + Math.PI,
              duration: 0.45,
              ease: 'power2.in',
              overwrite: 'auto',
            })
              .to(sceneState.shard, {
                x: () => sideWorldX(dir),
                y: 0.05,
                z: 0,
                scale: () => shardScaleFor(),
                rotY: '+=' + Math.PI,
                duration: 0.45,
                ease: 'power2.out',
                overwrite: 'auto',
              })
              .to(sceneState, { uRim: 0.7, duration: 0.45, overwrite: 'auto' }, 0)
              .to(sceneState, { uRim: 0.25, duration: 0.45, overwrite: 'auto' }, 0.45)
              .to(
                sceneState.cam,
                { x: () => camPanX(dir), duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' },
                0,
              )
            return tl
          }

          // scroll only SELECTS which side; callbacks fire once per boundary
          const rows = gsap.utils.toArray<HTMLElement>('[data-wrow]')
          const sides: Array<1 | -1> = [1, -1, 1]
          ;[1, 2].forEach((i) => {
            ScrollTrigger.create({
              trigger: rows[i],
              start: 'top 55%',
              onEnter: () => goToSide(sides[i]),
              onLeaveBack: () => goToSide(sides[i - 1]),
            })
          })
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
              // 1.0 tracks tighter than the old 1.2 (less arrival lag) while
              // staying >= work's smoothing so work's last write can't stick
              scrub: 1.0,
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
