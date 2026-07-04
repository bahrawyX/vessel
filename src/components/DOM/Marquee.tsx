import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { sceneState } from '../../store/sceneState'

const UNIT = 'REALTIME 3D ✦ SHADER CRAFT ✦ CREATIVE ENGINEERING ✦ '

export default function Marquee() {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(trackRef.current, {
          xPercent: -50,
          duration: 26,
          ease: 'none',
          repeat: -1,
        })

        // skew rides the SAME normalized velocity as the shader
        let skew = 0
        const tick = () => {
          skew += (sceneState.velocity * 7 - skew) * 0.1
          gsap.set(trackRef.current, { skewX: skew })
        }
        gsap.ticker.add(tick)
        return () => gsap.ticker.remove(tick)
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef} className="overflow-hidden border-y border-line py-3">
      <div ref={trackRef} className="flex w-max whitespace-nowrap" aria-hidden="true">
        {[0, 1].map((half) => (
          <span key={half} className="type-mono text-[12px] text-dim">
            {Array.from({ length: 6 }, () => UNIT).join('')}
          </span>
        ))}
      </div>
      <ul className="sr-only">
        <li>Realtime 3D</li>
        <li>Shader craft</li>
        <li>Creative engineering</li>
      </ul>
    </div>
  )
}
