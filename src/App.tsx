import { Suspense, lazy, useState } from 'react'
import { useLenisGsap } from './hooks/useLenisGsap'
import Choreography from './components/Choreography'
import SceneBoundary from './components/Scene/SceneBoundary'
import Preloader from './components/DOM/Preloader'
import Nav from './components/DOM/Nav'
import Hero from './components/DOM/Hero'
import Studio from './components/DOM/Studio'
import Work from './components/DOM/Work'
import Process from './components/DOM/Process'
import Footer from './components/DOM/Footer'

const SceneCanvas = lazy(() => import('./components/Scene/Canvas'))

export default function App() {
  const [loaded, setLoaded] = useState(false)

  useLenisGsap()

  return (
    <>
      {/* fixed WebGL canvas behind everything; static poster while it code-splits in */}
      <SceneBoundary>
        <Suspense fallback={<div className="fixed inset-0 z-0 bg-ink" />}>
          <SceneCanvas />
        </Suspense>
      </SceneBoundary>

      {/* film grain above everything */}
      <div className="grain pointer-events-none fixed inset-0 z-[60]" aria-hidden="true" />

      {!loaded && <Preloader onDone={() => setLoaded(true)} />}

      <Nav />

      <p className="sr-only">
        Vessel is a creative technology studio building realtime 3D interfaces,
        shader-driven websites and interactive product experiences. Selected work:
        Ionfield, Halftone, Deep Current. Contact hello@vessel.studio.
      </p>

      <main id="main" className="relative z-10">
        <Hero />
        <Studio />
        <Work />
        <Process />
        <Footer />
      </main>

      <Choreography />
    </>
  )
}
