import { useEffect, useState } from 'react'
import { Canvas, advance } from '@react-three/fiber'
import gsap from 'gsap'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import Shard from './Shard'
import Effects from './Effects'
import { useMedia } from '../../hooks/useMedia'

export default function SceneCanvas() {
  const fine = useMedia('(pointer: fine)')
  const mobile = useMedia('(max-width: 767px)')
  const [dpr, setDpr] = useState(mobile ? 1.5 : 2)

  // one clock for everything: gsap.ticker drives Lenis, ScrollTrigger AND the
  // render loop (frameloop="never" + advance). gsap's ticker also survives
  // backgrounded tabs via its setTimeout fallback, unlike raw rAF.
  // R3F assigns this timestamp to clock.elapsedTime verbatim, so it MUST be
  // seconds — gsap's ticker time already is.
  useEffect(() => {
    const tick = (time: number) => advance(time)
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, dpr]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 35, position: [0, 0, 6] }}
        frameloop="never"
        onCreated={({ gl, scene, camera }) => {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(window as any).__vessel = { scene, camera }
          }
          // allow the browser to restore a lost context instead of killing the scene
          gl.domElement.addEventListener(
            'webglcontextlost',
            (e) => e.preventDefault(),
            false,
          )
        }}
      >
        <color attach="background" args={['#0B0B0F']} />
        <fog attach="fog" args={['#0B0B0F', 7, 14]} />
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, d - 0.5))}
        >
          {/* fully procedural studio environment — zero network assets */}
          <Environment resolution={256}>
            <Lightformer
              intensity={3}
              position={[3, 2, 4]}
              scale={[5, 5, 1]}
              color="#ffffff"
            />
            <Lightformer
              intensity={1.4}
              position={[-4, 1, -2]}
              rotation-y={Math.PI}
              scale={[4, 6, 1]}
              color="#dfe6f5"
            />
            <Lightformer
              intensity={0.8}
              position={[0, -4, 0]}
              rotation-x={Math.PI / 2}
              scale={[6, 6, 1]}
              color="#f5e8dc"
            />
            <Lightformer
              intensity={2}
              position={[0, 4, -3]}
              rotation-x={-Math.PI / 3}
              scale={[3, 1, 1]}
              color="#ffffff"
            />
          </Environment>
          <directionalLight position={[4, 3, 5]} intensity={0.6} color="#ffffff" />
          <Shard fine={fine} mobile={mobile} />
          <Effects mobile={mobile} />
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
