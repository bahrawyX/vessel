import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useProgress } from '@react-three/drei'
import { getLenis } from '../../hooks/useLenisGsap'
import { sceneState } from '../../store/sceneState'

const MIN_MS = 1600
// never trap the user: exit even if an asset (e.g. the CDN env map) stalls
const MAX_MS = 8000

export default function Preloader({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)
  const { progress, active } = useProgress()
  const started = useRef(Date.now())
  const exited = useRef(false)

  useEffect(() => {
    getLenis()?.stop()
  }, [])

  useEffect(() => {
    if (exited.current) return

    const update = () => {
      const elapsed = Date.now() - started.current
      const timePct = Math.min(100, (elapsed / MIN_MS) * 100)
      // "ready" = nothing actively loading (procedural scene may load zero assets)
      const ready = !active || progress >= 100
      const shown = Math.min(timePct, ready ? timePct : Math.max(progress, timePct * 0.6))
      if (pctRef.current) {
        pctRef.current.textContent = String(Math.floor(shown)).padStart(3, '0')
      }
      if (((timePct >= 100 && ready) || elapsed > MAX_MS) && !exited.current) {
        exited.current = true
        exit()
      }
    }

    const exit = () => {
      // shard swells into frame while the veil fades and hero lines reveal (overlap)
      gsap.to(sceneState.shard, { scale: 1.0, duration: 1.0, ease: 'back.out(1.4)' })
      window.dispatchEvent(new CustomEvent('vessel:intro'))
      gsap.to(rootRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          getLenis()?.start()
          ScrollTrigger.refresh()
          onDone()
        },
      })
    }

    const id = setInterval(update, 50)
    update()
    return () => clearInterval(id)
  }, [progress, onDone])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] bg-ink"
      aria-hidden="true"
    >
      <div className="flex h-full items-center justify-center">
        <span className="type-mono text-[11px] text-dim">
          COMPILING SHADERS
          <span className="loading-dot">.</span>
          <span className="loading-dot">.</span>
          <span className="loading-dot">.</span>
        </span>
      </div>
      <span
        ref={pctRef}
        className="type-mono absolute bottom-6 right-6 text-[11px] tabular-nums text-dim sm:bottom-10 sm:right-10"
      >
        000
      </span>
    </div>
  )
}
