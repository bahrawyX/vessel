import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Marquee from './Marquee'

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // GSAP owns the transform — a Tailwind translate class here would
        // desync gsap's yPercent bookkeeping and strand the lines offscreen
        gsap.set('[data-hero-line]', { yPercent: 110 })
        const onIntro = () => {
          gsap.fromTo(
            '[data-hero-line]',
            { yPercent: 110 },
            { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09 },
          )
          gsap.fromTo(
            '[data-hero-meta]',
            { opacity: 0 },
            { opacity: 1, duration: 1.1, ease: 'expo.out', delay: 0.6 },
          )
        }
        window.addEventListener('vessel:intro', onIntro)
        return () => window.removeEventListener('vessel:intro', onIntro)
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        const onIntro = () => {
          gsap.to(['[data-hero-line]', '[data-hero-meta]'], { opacity: 1, yPercent: 0, duration: 0.3 })
        }
        gsap.set('[data-hero-line]', { yPercent: 0 })
        window.addEventListener('vessel:intro', onIntro)
        return () => window.removeEventListener('vessel:intro', onIntro)
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={rootRef} className="relative flex h-[100svh] flex-col">
      {/* meta row */}
      <div
        data-hero-meta
        className="flex justify-between px-6 pt-24 opacity-0 sm:px-10"
      >
        <span className="type-mono text-[11px] text-dim">
          CREATIVE TECHNOLOGY STUDIO — EST. 2021
        </span>
        <span className="type-mono hidden text-[11px] text-dim sm:block">
          WEBGL / GLSL / REALTIME
        </span>
      </div>

      {/* headline bottom-anchored */}
      <div className="flex flex-1 items-end px-6 pb-24 sm:px-10">
        <h1 className="type-display text-[clamp(3rem,10vw,9rem)] leading-[0.92] text-bone">
          <span className="block overflow-hidden">
            <span data-hero-line className="block">
              OBJECTS IN
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block">
              MOTION TELL
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block">
              BETTER STORIES.
            </span>
          </span>
        </h1>
      </div>

      {/* scroll cue */}
      <div
        className="absolute bottom-20 right-6 flex flex-col items-center gap-2 sm:right-10"
        aria-hidden="true"
      >
        <span className="type-mono text-[10px] text-dim">SCROLL TO ROTATE</span>
        <span className="cue-line block h-6 w-px bg-dim" />
      </div>

      <Marquee />
    </section>
  )
}
