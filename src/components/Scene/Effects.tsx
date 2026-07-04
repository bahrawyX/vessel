import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { ChromaticAberrationEffect } from 'postprocessing'
import { sceneState } from '../../store/sceneState'

export default function Effects({ mobile }: { mobile: boolean }) {
  // imperative effect instance — avoids ref-as-prop churn inside EffectComposer
  const chroma = useMemo(() => new ChromaticAberrationEffect(), [])

  useFrame(() => {
    const v = Math.abs(sceneState.velocity)
    const o = 0.0006 + v * 0.004
    chroma.offset.set(o, o)
  })

  if (mobile) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.35} luminanceThreshold={0.7} luminanceSmoothing={0.3} mipmapBlur />
        <Noise opacity={0.035} />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.55} luminanceThreshold={0.7} luminanceSmoothing={0.3} mipmapBlur />
      <primitive object={chroma} />
      <Noise opacity={0.035} />
      <Vignette eskil={false} offset={0.25} darkness={0.75} />
    </EffectComposer>
  )
}
