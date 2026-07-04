import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sceneState } from '../store/sceneState'

gsap.registerPlugin(ScrollTrigger)

let lenisInstance: Lenis | null = null

export function getLenis(): Lenis | null {
  return lenisInstance
}

export function useLenisGsap() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
    lenisInstance = lenis

    lenis.on('scroll', (e: { velocity: number }) => {
      ScrollTrigger.update()
      sceneState.velocity = gsap.utils.clamp(-1, 1, e.velocity / 40)
    })

    const tick = (t: number) => {
      lenis.raf(t * 1000)
      // decay toward stillness when no scroll events arrive
      sceneState.velocity *= 0.92
      if (Math.abs(sceneState.velocity) < 0.001) sceneState.velocity = 0
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    document.fonts.ready.then(() => {
      ScrollTrigger.refresh()
      ScrollTrigger.update()
    })

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisInstance = null
    }
  }, [])
}
