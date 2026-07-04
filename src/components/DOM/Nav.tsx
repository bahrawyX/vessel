import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { getLenis } from '../../hooks/useLenisGsap'
import { useClock } from '../../hooks/useClock'

const LINKS = [
  { word: 'STUDIO', target: '#studio' },
  { word: 'WORK', target: '#work' },
  { word: 'PROCESS', target: '#process' },
  { word: 'CONTACT', target: '#contact' },
]

export default function Nav() {
  const time = useClock()
  const overlayRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!overlayRef.current) return
    const links = overlayRef.current.querySelectorAll('[data-overlay-link]')
    if (menuOpen) {
      gsap.to(overlayRef.current, {
        clipPath: 'inset(0% 0 0% 0)',
        duration: 0.7,
        ease: 'power3.inOut',
      })
      gsap.fromTo(
        links,
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.3 },
      )
    } else {
      gsap.to(overlayRef.current, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.7,
        ease: 'power3.inOut',
      })
    }
  }, [menuOpen])

  const scrollTo = (target: string) => {
    setMenuOpen(false)
    getLenis()?.scrollTo(target, { offset: -68 })
  }

  return (
    <>
      <header className="fixed top-0 z-40 flex h-[68px] w-full items-center justify-between px-6 mix-blend-difference sm:px-10">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            getLenis()?.scrollTo(0)
          }}
          className="type-display text-[15px] text-bone"
        >
          VESSEL&reg;
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <button
              key={link.word}
              onClick={() => scrollTo(link.target)}
              className="type-mono text-[11px] text-dim transition-colors duration-300 hover:text-bone"
            >
              {link.word}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          <span className="type-mono text-[11px] tabular-nums text-dim">CAI {time}</span>
          <span id="scroll-progress" className="type-mono text-[11px] tabular-nums text-dim">
            000
          </span>
        </div>

        <button
          onClick={() => setMenuOpen(true)}
          className="type-mono flex min-h-[44px] items-center text-[11px] text-bone md:hidden"
        >
          MENU
        </button>
      </header>

      {/* Mobile overlay */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 z-50 flex flex-col justify-between bg-ink p-6 md:hidden ${
          menuOpen ? '' : 'pointer-events-none'
        }`}
        style={{ clipPath: 'inset(0 0 100% 0)' }}
      >
        <div className="flex items-center justify-between">
          <span className="type-display text-[15px] text-bone">VESSEL&reg;</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="type-mono flex min-h-[44px] items-center text-[11px] text-dim"
          >
            CLOSE
          </button>
        </div>
        <div className="flex flex-col gap-3 pb-10">
          {LINKS.map((link) => (
            <span key={link.word} className="block overflow-hidden">
              <button
                data-overlay-link
                onClick={() => scrollTo(link.target)}
                className="type-display block text-[clamp(2.5rem,12vw,4rem)] leading-[1.05] text-bone"
              >
                {link.word}
              </button>
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
