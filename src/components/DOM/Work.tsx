import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sceneState } from '../../store/sceneState'

gsap.registerPlugin(ScrollTrigger)

const VIDEO_A =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_122702_390f5305-8719-41d5-ae80-d23ab3796c28.mp4'
const VIDEO_B =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_123323_f909c2b8-ff6c-4edf-882b-8ebcdbe389b5.mp4'

const PROJECTS = [
  {
    index: '01',
    title: 'IONFIELD',
    description: 'Particle-based product configurator',
    src: VIDEO_A,
  },
  {
    index: '02',
    title: 'HALFTONE',
    description: 'Scroll-reactive editorial for a photo agency',
    src: VIDEO_B,
  },
  {
    index: '03',
    title: 'DEEP CURRENT',
    description: 'WebGL data-ocean for a climate NGO',
    src: VIDEO_A,
  },
]

export default function Work() {
  const rootRef = useRef<HTMLElement>(null)

  // one refresh once every video knows its dimensions — no layout-shifting
  // load may move trigger positions mid-scroll (aspect boxes prevent shifts,
  // this is belt-and-suspenders for trigger math)
  useEffect(() => {
    const videos = Array.from(
      rootRef.current?.querySelectorAll<HTMLVideoElement>('video') ?? [],
    )
    if (!videos.length) return
    let pending = videos.filter((v) => v.readyState < 1).length
    if (pending === 0) return
    let cancelled = false
    const onLoaded = () => {
      pending -= 1
      if (pending === 0 && !cancelled) ScrollTrigger.refresh()
    }
    videos.forEach((v) => {
      if (v.readyState < 1) v.addEventListener('loadedmetadata', onLoaded, { once: true })
    })
    return () => {
      cancelled = true
      videos.forEach((v) => v.removeEventListener('loadedmetadata', onLoaded))
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // DOM beat synced to each crossing: the upcoming card slides in from
        // its own side and settles as the shard lands opposite it.
        // DOM only — never touches sceneState.
        gsap.utils.toArray<HTMLElement>('[data-card]').forEach((card, i) => {
          gsap.fromTo(
            card,
            { opacity: 0.4, x: i % 2 === 1 ? 40 : -40 },
            {
              opacity: 1,
              x: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: card.parentElement,
                start: 'top 80%',
                end: 'top 40%',
                scrub: 1,
              },
            },
          )
        })
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-card]', { opacity: 1, x: 0 })
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // the shard notices when you touch the work
  const rimUp = () => gsap.to(sceneState, { rimBoost: 0.15, duration: 0.4 })
  const rimDown = () => gsap.to(sceneState, { rimBoost: 0, duration: 0.4 })

  return (
    <section id="work" ref={rootRef} className="pt-28">
      <div className="px-6 sm:px-10">
        <div className="flex items-baseline gap-4">
          <span className="type-mono text-[11px] text-dim">02 / SELECTED WORK</span>
          <span className="h-px flex-1 self-center bg-line" />
          <span className="type-mono hidden text-[11px] text-dim sm:block">
            THE OBJECT CROSSES OVER — KEEP SCROLLING
          </span>
        </div>
      </div>

      {/* alternating rows: card on one side, the shard crosses to the other.
          Spacing is viewport-relative at ALL widths so every crossing owns
          real scroll distance on small screens too (no whip-throughs). */}
      <div className="space-y-[30svh]">
      {PROJECTS.map((project, i) => (
        <div
          key={project.index}
          data-wrow={i}
          className="flex min-h-[100svh] flex-col justify-center px-6 sm:px-10"
        >
          <article
            data-card
            onMouseEnter={rimUp}
            onMouseLeave={rimDown}
            className={`w-full lg:w-[46%] ${i % 2 === 1 ? 'lg:ml-auto' : 'lg:mr-auto'}`}
          >
            <div className="group aspect-[16/10] cursor-pointer overflow-hidden rounded-lg bg-[#141419]">
              <video
                src={project.src}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="h-full w-full scale-[1.06] object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.12]"
              />
            </div>
            <div className="mt-5 flex items-start justify-between gap-6">
              <div>
                <h3 className="type-display text-[20px] text-bone">{project.title}</h3>
                <p className="mt-1 text-[14px] leading-[1.65] text-dim">
                  {project.description}
                </p>
              </div>
              <span className="type-mono shrink-0 text-[11px] text-dim">
                {project.index}
              </span>
            </div>
          </article>
        </div>
      ))}
      </div>
    </section>
  )
}
