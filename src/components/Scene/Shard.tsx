import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import CustomShaderMaterial from 'three-custom-shader-material'
import gsap from 'gsap'
import vertexShader from './shaders/shard.vert.glsl?raw'
import fragmentShader from './shaders/shard.frag.glsl?raw'
import { sceneState } from '../../store/sceneState'

const LERP = 0.08
const MOUSE_LERP = 0.05

export default function Shard({ fine, mobile }: { fine: boolean; mobile: boolean }) {
  const scrollGroup = useRef<THREE.Group>(null!)
  const mouseGroup = useRef<THREE.Group>(null!)
  const driftGroup = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)
  const hovering = useRef(false)
  const lookTarget = useRef(new THREE.Vector3(0, -0.2, 0))

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: sceneState.uAmp },
      uFreq: { value: sceneState.uFreq },
      uVelocity: { value: 0 },
      uRim: { value: sceneState.uRim },
      uHover: { value: 0 },
      uHitPoint: { value: new THREE.Vector3(99, 99, 99) },
      uEmber: { value: new THREE.Color(1.0, 0.36, 0.22) },
    }),
    [],
  )

  useFrame((state) => {
    const s = sceneState
    const g = scrollGroup.current

    // scroll choreography: lerp the real scene toward sceneState (double smoothing)
    g.position.x += (s.shard.x - g.position.x) * LERP
    g.position.y += (s.shard.y - g.position.y) * LERP
    g.position.z += (s.shard.z - g.position.z) * LERP
    const sc = g.scale.x + (s.shard.scale - g.scale.x) * LERP
    g.scale.setScalar(sc)
    g.rotation.x += (s.shard.rotX - g.rotation.x) * LERP
    g.rotation.y += (s.shard.rotY - g.rotation.y) * LERP
    g.rotation.z += (s.shard.rotZ - g.rotation.z) * LERP

    // pointer parallax — additive on the inner group (fine pointers only)
    if (fine) {
      const m = mouseGroup.current
      m.rotation.x += (state.pointer.y * 0.18 - m.rotation.x) * MOUSE_LERP
      m.rotation.y += (state.pointer.x * 0.28 - m.rotation.y) * MOUSE_LERP
    }

    // idle drift — absolute (clock-derived), not accumulated: accumulation
    // multiplies if HMR ever leaks an extra frame subscriber and jumps on
    // timer spikes; this is always exactly 0.06 rad/s no matter what
    driftGroup.current.rotation.y = state.clock.elapsedTime * 0.06

    // uniforms
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uVelocity.value = s.velocity
    uniforms.uAmp.value += (s.uAmp - uniforms.uAmp.value) * LERP
    uniforms.uFreq.value += (s.uFreq - uniforms.uFreq.value) * LERP
    uniforms.uRim.value += (s.uRim + s.rimBoost - uniforms.uRim.value) * LERP

    // camera: lerp position AND aim toward their own targets — the aim is
    // deliberately NOT the shard, so lateral shots read on screen
    const cam = state.camera
    cam.position.x += (s.cam.x - cam.position.x) * LERP
    cam.position.y += (s.cam.y - cam.position.y) * LERP
    cam.position.z += (s.cam.z - cam.position.z) * LERP
    const t = lookTarget.current
    t.x += (s.camTarget.x - t.x) * LERP
    t.y += (s.camTarget.y - t.y) * LERP
    t.z += (s.camTarget.z - t.z) * LERP
    cam.lookAt(t)
  })

  const onPointerMove = (e: { point: THREE.Vector3 }) => {
    if (!fine) return
    const local = meshRef.current.worldToLocal(e.point.clone())
    uniforms.uHitPoint.value.copy(local)
    if (!hovering.current) {
      hovering.current = true
      gsap.to(uniforms.uHover, { value: 1, duration: 0.3 })
    }
  }

  const onPointerOut = () => {
    if (!fine) return
    hovering.current = false
    gsap.to(uniforms.uHover, { value: 0, duration: 1.2, ease: 'expo.out' })
  }

  return (
    <group ref={scrollGroup} position={[0, -0.2, 0]} scale={0.6}>
      <group ref={mouseGroup}>
        <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0}>
          <group ref={driftGroup}>
            <mesh ref={meshRef} onPointerMove={onPointerMove} onPointerOut={onPointerOut}>
              <icosahedronGeometry args={[1.4, mobile ? 48 : 96]} />
              <CustomShaderMaterial
                baseMaterial={THREE.MeshPhysicalMaterial}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                color="#101014"
                metalness={0.1}
                roughness={0.28}
                clearcoat={1}
                clearcoatRoughness={0.15}
                envMapIntensity={1.4}
              />
            </mesh>
          </group>
        </Float>
      </group>
    </group>
  )
}
