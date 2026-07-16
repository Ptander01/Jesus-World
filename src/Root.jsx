import { useEffect, useState, lazy, Suspense } from 'react'
import App from './App.jsx'

// The visuals route is a preview surface, not part of the atlas shell, so it gets a
// hash check rather than a router dependency. Lazy, to keep the charts out of the
// main map bundle.
const VisualsDemo = lazy(() => import('./components/VisualsDemo.jsx'))

const routeOf = () => window.location.hash.replace(/^#/, '')

export default function Root() {
  const [route, setRoute] = useState(routeOf)

  useEffect(() => {
    const onHash = () => setRoute(routeOf())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route === '/visuals') {
    return (
      <Suspense fallback={null}>
        <VisualsDemo />
      </Suspense>
    )
  }
  return <App />
}
