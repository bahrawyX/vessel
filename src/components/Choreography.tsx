import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sceneState } from '../store/sceneState'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll choreography. Every trigger tweens the plain sceneState object only —
 * the R3F frame loop lerps the real scene toward it (scrub + frame lerp 0.08 =
 * double smoothing). Poses are explicit and transitions use fromTo, so
 * scrubbing backwards is fully deterministic.
 */

type Pose = {
  shard: { x: number; y: number; z: number; scale: number; rotY: number }
  cam: { x: number; y: number; z: number }
  uniforms: { uAmp: number; uFreq: number; uRim: number }
}

const POSES: Record<string, Pose> = {
  hero: {
    shard: { x: 0, y: -0.2, z: 0, scale: 1, rotY: 0 },
    cam: { x: 0, y: 0, z: 6 },
    uniforms: { uAmp: 0.18, uFreq: 1.6, uRim: 0.5 },
  },
  studio: {
    shard: { x: 1.6, y: 0, z: 0, scale: 0.85, rotY: 0 },
    cam: { x: -0.6, y: 0.3, z: 5 },
    uniforms: { uAmp: 0.1, uFreq: 2.4, uRim: 0.3 },
  },
  // work: the shard swaps sides between rows, flipping half a turn per crossing
  work0: {
    shard: { x: 1.7, y: 0.05, z: -0.4, scale: 0.8, rotY: Math.PI },
    cam: { x: 0, y: 0, z: 6.2 },
    uniforms: { uAmp: 0.07, uFreq: 2.4, uRim: 0.25 },
  },
  work1: {
    shard: { x: -1.7, y: 0.05, z: -0.4, scale: 0.8, rotY: Math.PI * 2 },
    cam: { x: 0, y: 0, z: 6.2 },
    uniforms: { uAmp: 0.07, uFreq: 2.4, uRim: 0.25 },
  },
  work2: {
    shard: { x: 1.7, y: 0.05, z: -0.4, scale: 0.8, rotY: Math.PI * 3 },
    cam: { x: 0, y: 0, z: 6.2 },
    uniforms: { uAmp: 0.07, uFreq: 2.4, uRim: 0.25 },
  },
  process: {
    shard: { x: 0, y: 0, z: 0, scale: 1.15, rotY: Math.PI * 4 },
    cam: { x: 0, y: 1.8, z: 4.2 },
    uniforms: { uAmp: 0.55, uFreq: 3.4, uRim: 0.8 },
  },
  contact: {
    shard: { x: 0, y: -0.1, z: 0.5, scale: 1, rotY: Math.PI * 4 },
    cam: { x: 0, y: 0, z: 5 },
    uniforms: { uAmp: 0.14, uFreq: 1.2, uRim: 1.0 },
  },
}

function poseTransition(
  trigger: string | Element,
  from: Pose,
  to: Pose,
  opts: { start: string; end: string; arc?: boolean },
) {
  const scrollTrigger = {
    trigger,
    start: opts.start,
    end: opts.end,
    scrub: 1.2,
  }
  const common = { ease: 'none' as const, immediateRender: false }

  if (opts.arc) {
    // crossing move: rise + swell at the midpoint, land on the far side —
    // reads as the object being picked up and carried across.
    // NOTE: gsap keyframes only work in to() vars, so this is two segments.
    const mid = {
      x: (from.shard.x + to.shard.x) / 2,
      y: from.shard.y + 0.55,
      z: from.shard.z - 0.3,
      scale: from.shard.scale * 1.12,
      rotY: (from.shard.rotY + to.shard.rotY) / 2,
    }
    gsap
      .timeline({ scrollTrigger, defaults: common })
      .fromTo(sceneState.shard, { ...from.shard }, { ...mid, duration: 0.5 }, 0)
      .to(sceneState.shard, { ...to.shard, duration: 0.5, ease: 'none' }, 0.5)
      .fromTo(sceneState.cam, { ...from.cam }, { ...to.cam, duration: 1 }, 0)
      .fromTo(sceneState, { ...from.uniforms }, { ...to.uniforms, duration: 1 }, 0)
  } else {
    gsap
      .timeline({ scrollTrigger, defaults: common })
      .fromTo(sceneState.shard, { ...from.shard }, { ...to.shard }, 0)
      .fromTo(sceneState.cam, { ...from.cam }, { ...to.cam }, 0)
      .fromTo(sceneState, { ...from.uniforms }, { ...to.uniforms }, 0)
  }
}

export default function Choreography() {
  useEffect(() => {
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // global: progress readout + the slow full-page tumble (rotX / rotZ)
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
      }).fromTo(
        sceneState.shard,
        { rotX: 0, rotZ: 0 },
        { rotX: Math.PI * 1.5, rotZ: -Math.PI * 0.5 },
        0,
      )

      // section transitions
      poseTransition('#studio', POSES.hero, POSES.studio, {
        start: 'top 95%',
        end: 'top 15%',
      })

      const rows = gsap.utils.toArray<HTMLElement>('[data-wrow]')
      const workPoses = [POSES.work0, POSES.work1, POSES.work2]
      rows.forEach((row, i) => {
        poseTransition(row, i === 0 ? POSES.studio : workPoses[i - 1], workPoses[i], {
          start: 'top 90%',
          end: 'top 25%',
          arc: i > 0, // crossings get the carry-arc; entering the section doesn't
        })
      })

      poseTransition('#process', POSES.work2, POSES.process, {
        start: 'top 95%',
        end: 'top 15%',
      })
      poseTransition('#contact', POSES.process, POSES.contact, {
        start: 'top 95%',
        end: 'top 20%',
      })

      // process words arrive on the scrub as the shard churns
      const words = gsap.utils.toArray<HTMLElement>('[data-pword]')
      const wordsTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#process',
          start: 'top 70%',
          end: 'center 40%',
          scrub: 1.2,
        },
        defaults: { ease: 'none' },
      })
      words.forEach((word, i) => {
        wordsTl.fromTo(word, { opacity: 0.08, y: 14 }, { opacity: 1, y: 0, duration: 0.2 }, i * 0.22)
      })

      return () => {
        ScrollTrigger.getAll().forEach((st) => st.kill())
      }
    })

    mm.add('(prefers-reduced-motion: reduce)', () => {
      // shard sits in the hero pose with idle drift only
      sceneState.uAmp = 0.1
      gsap.set('[data-pword]', { opacity: 1, y: 0 })
    })

    return () => mm.revert()
  }, [])

  return null
}
