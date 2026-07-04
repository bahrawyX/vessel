import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sceneState } from '../../store/sceneState'

gsap.registerPlugin(ScrollTrigger)

const TEXT =
  'Vessel builds interfaces you can feel. Three people, one obsession: the moment a screen stops being a screen. Every project ships with its own physics.'

const STATS = [
  { value: 19, label: 'EXPERIENCES SHIPPED', tag: '/ SINCE 2021' },
  { value: 11, label: 'AWWWARDS HONORS', tag: '/ AND COUNTING' },
  { value: 60, label: 'FPS ALWAYS', tag: '/ NON-NEGOTIABLE' },
]

const HUD = [
  { key: 'uAmp', label: 'AMP' },
  { key: 'uFreq', label: 'FREQ' },
  { key: 'uRim', label: 'RIM' },
  { key: 'velocity', label: 'VEL' },
] as const

export default function Studio() {
  const rootRef = useRef<HTMLElement>(null)
  const hudRefs = useRef<(HTMLSpanElement | null)[]>([])

  // live telemetry: the DOM reads the shard's actual shader state every tick
  useEffect(() => {
    const tick = () => {
      HUD.forEach((item, i) => {
        const el = hudRefs.current[i]
        if (!el) return
        const value = sceneState[item.key]
        el.textContent = value.toFixed(2)
        if (item.key === 'velocity') {
          // the one ember moment in this section: velocity runs hot
          el.style.color = Math.abs(value) > 0.5 ? 'var(--ember)' : 'var(--bone)'
        }
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // scroll-scrub word reveal — reading pace = scroll pace
        gsap.fromTo(
          '[data-sword]',
          { opacity: 0.14 },
          {
            opacity: 1,
            stagger: 0.02,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-manifesto]',
              start: 'top 75%',
              end: 'bottom 45%',
              scrub: true,
            },
          },
        )

        // giant watermark drifts slower than the page
        gsap.fromTo(
          '[data-watermark]',
          { y: -50 },
          {
            y: 110,
            ease: 'none',
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )

        // stat blocks drift in at offset rates
        gsap.utils.toArray<HTMLElement>('[data-stat-block]').forEach((el, i) => {
          gsap.fromTo(
            el,
            { y: 30 + i * 22, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: '[data-stats]',
                start: 'top 95%',
                end: 'top 55%',
                scrub: true,
              },
            },
          )
        })

        // count-up, once
        const numbers = gsap.utils.toArray<HTMLElement>('[data-stat]')
        ScrollTrigger.create({
          trigger: '[data-stats]',
          start: 'top 85%',
          once: true,
          onEnter: () => {
            numbers.forEach((el, i) => {
              const target = Number(el.dataset.stat)
              const obj = { v: 0 }
              gsap.to(obj, {
                v: target,
                duration: 1.6,
                delay: i * 0.15,
                ease: 'power2.out',
                onUpdate: () => {
                  el.textContent = String(Math.floor(obj.v))
                },
              })
            })
          },
        })
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-sword]', { opacity: 1 })
        gsap.set('[data-stat-block]', { opacity: 1, y: 0 })
        gsap.utils.toArray<HTMLElement>('[data-stat]').forEach((el) => {
          el.textContent = String(Number(el.dataset.stat))
        })
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="studio"
      ref={rootRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* giant outlined index drifting behind the shard's half of the frame */}
      <span
        data-watermark
        aria-hidden="true"
        className="type-display pointer-events-none absolute right-0 top-16 select-none text-[clamp(10rem,24vw,22rem)] leading-none text-transparent"
        style={{ WebkitTextStroke: '1px rgba(127,124,116,0.2)' }}
      >
        01
      </span>

      <div className="relative w-full px-6 py-28 sm:px-10">
        {/* left column — the shard occupies the right half */}
        <div className="max-w-[46ch]">
          <div className="mb-10 flex items-baseline gap-4">
            <span className="type-mono text-[11px] text-dim">01 / STUDIO</span>
            <span className="h-px flex-1 self-center bg-line" />
          </div>

          <p data-manifesto className="text-[clamp(1.3rem,2.6vw,2rem)] leading-[1.4] text-bone">
            {TEXT.split(' ').map((word, i) => (
              <span key={i} data-sword>
                {word}{' '}
              </span>
            ))}
          </p>

          {/* live shard telemetry — this section is wired to the object itself */}
          <div className="mt-10 flex items-center gap-6 border-y border-line py-4">
            <span className="type-mono text-[10px] text-dim">SHARD TELEMETRY</span>
            {HUD.map((item, i) => (
              <span key={item.key} className="type-mono flex items-baseline gap-2 text-[10px]">
                <span className="text-dim">{item.label}</span>
                <span
                  ref={(el) => {
                    hudRefs.current[i] = el
                  }}
                  className="tabular-nums text-bone"
                >
                  0.00
                </span>
              </span>
            ))}
          </div>

          <div data-stats className="mt-10 grid grid-cols-3">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                data-stat-block
                className={`py-2 transition-colors duration-300 hover:bg-[#141419] ${
                  i > 0 ? 'border-l border-line pl-5' : 'pr-5'
                } ${i === 1 ? 'px-5' : ''}`}
              >
                <span className="type-mono block text-[9px] text-dim/60">{stat.tag}</span>
                <span
                  data-stat={stat.value}
                  className="type-display mt-2 block text-[clamp(1.8rem,4vw,3rem)] leading-none text-bone"
                >
                  0
                </span>
                <span className="type-mono mt-2 block text-[10px] text-dim sm:text-[11px]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
