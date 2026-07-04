import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'
import { useClock } from '../../hooks/useClock'
import { useMedia } from '../../hooks/useMedia'

gsap.registerPlugin(ScrollTrigger)

const SOCIALS = ['INSTAGRAM', 'TWITTER', 'LINKEDIN']

export default function Footer() {
  const time = useClock()
  const fine = useMedia('(pointer: fine)')
  const rootRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const ctaLabelRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)

  // giant wordmark letter reveal
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-letter]',
          { yPercent: 100 },
          {
            yPercent: 0,
            duration: 1,
            ease: 'expo.out',
            stagger: 0.04,
            scrollTrigger: { trigger: '[data-wordmark]', start: 'top 85%', once: true },
          },
        )
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-letter]', { yPercent: 0 })
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // magnetic CTA (fine pointers only)
  useEffect(() => {
    if (!fine || !ctaRef.current) return
    const cta = ctaRef.current
    const label = ctaLabelRef.current!

    const onMove = (e: MouseEvent) => {
      const rect = cta.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      if (Math.hypot(dx, dy) < 120) {
        const clamp = gsap.utils.clamp(-12, 12)
        gsap.to(cta, { x: clamp(dx * 0.35), y: clamp(dy * 0.35), duration: 0.4, ease: 'expo.out' })
        gsap.to(label, { x: clamp(dx * 0.15), y: clamp(dy * 0.15), duration: 0.4, ease: 'expo.out' })
      } else {
        gsap.to([cta, label], { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
      }
    }

    const onEnter = (e: MouseEvent) => {
      const rect = cta.getBoundingClientRect()
      gsap.set(fillRef.current, {
        left: e.clientX - rect.left,
        top: e.clientY - rect.top,
        xPercent: -50,
        yPercent: -50,
        scale: 0,
      })
      gsap.to(fillRef.current, { scale: 1, duration: 0.5, ease: 'expo.out' })
      gsap.to(label, { color: 'var(--ink)', duration: 0.3 })
    }
    const onLeave = () => {
      gsap.to(fillRef.current, { scale: 0, duration: 0.5, ease: 'expo.out' })
      gsap.to(label, { color: 'var(--bone)', duration: 0.3 })
      gsap.to([cta, label], { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
    }

    window.addEventListener('mousemove', onMove)
    cta.addEventListener('mouseenter', onEnter)
    cta.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cta.removeEventListener('mouseenter', onEnter)
      cta.removeEventListener('mouseleave', onLeave)
    }
  }, [fine])

  return (
    <footer
      id="contact"
      ref={rootRef}
      className="flex min-h-[100svh] flex-col justify-between overflow-hidden pt-32"
    >
      <div className="px-6 sm:px-10">
        <span className="type-mono text-[11px] text-dim">04 / CONTACT</span>
        <h2 className="type-display mt-6 max-w-[20ch] text-[clamp(2rem,5vw,4.2rem)] leading-[1.02] text-bone">
          READY TO BUILD SOMETHING PHYSICAL?
        </h2>

        <a
          ref={ctaRef}
          href="mailto:hello@vessel.studio"
          className="relative mt-10 inline-flex min-h-[44px] items-center gap-2 overflow-hidden rounded-full border border-bone px-8 py-4"
        >
          <span
            ref={fillRef}
            className="absolute h-[420px] w-[420px] scale-0 rounded-full bg-ember"
            aria-hidden="true"
          />
          <span
            ref={ctaLabelRef}
            className="type-mono relative z-10 flex items-center gap-2 text-[12px] text-bone"
          >
            START A PROJECT
            <ArrowUpRight size={14} />
          </span>
        </a>
      </div>

      <div className="mt-24 grid gap-10 px-6 sm:grid-cols-3 sm:px-10">
        <div className="type-mono flex flex-col gap-2 text-[11px] text-dim">
          <a href="mailto:hello@vessel.studio" className="underline-link w-fit text-bone">
            hello@vessel.studio
          </a>
          <span>+20 100 000 0000</span>
        </div>
        <div className="type-mono flex flex-col gap-2 text-[11px]">
          {SOCIALS.map((social) => (
            <a key={social} href="#" className="underline-link w-fit text-dim">
              {social} ↗
            </a>
          ))}
        </div>
        <div className="type-mono flex flex-col gap-2 text-[11px] text-dim">
          <span>CAIRO — {time}</span>
          <span>© 2026 VESSEL</span>
        </div>
      </div>

      {/* giant wordmark: the shard glows through the letterforms */}
      <div
        data-wordmark
        className="mt-16 w-full translate-y-[10%] mix-blend-difference"
        aria-label="Vessel"
      >
        <div className="type-display w-full text-center text-[clamp(4rem,20vw,18rem)] leading-[0.85] text-bone">
          {'VESSEL®'.split('').map((letter, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <span data-letter className="inline-block">
                {letter}
              </span>
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
