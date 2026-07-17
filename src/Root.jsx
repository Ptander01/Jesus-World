import { useEffect, useState, lazy, Suspense } from 'react'
import App from './App.jsx'

// The visuals route is a preview surface, not part of the atlas shell, so it gets a
// hash check rather than a router dependency. Lazy, to keep the charts out of the
// main map bundle.
const VisualsDemo = lazy(() => import('./components/VisualsDemo.jsx'))
const ReadingMode = lazy(() => import('./components/ReadingMode.jsx'))

const routeOf = () => window.location.hash.replace(/^#/, '')

export default function Root() {
  const [route, setRoute] = useState(routeOf)
  // The Gospel Lens lives here, above the routes, so the atlas and the visuals share
  // one selection — flipping to John on the map keeps John on the charts.
  const [lens, setLens] = useState('All')
  // The reader is a different mode, not a different app — it shares the atlas's theme
  // so crossing between them doesn't flash.
  const [theme, setTheme] = useState(() => localStorage.getItem('pw-theme') || 'dark')

  useEffect(() => {
    const onHash = () => setRoute(routeOf())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('pw-theme', theme)
  }, [theme])

  if (route === '/visuals') {
    return (
      <Suspense fallback={null}>
        <VisualsDemo lens={lens} onLensChange={setLens} />
      </Suspense>
    )
  }
  if (route === '/read') {
    return (
      <Suspense fallback={null}>
        <ReadingMode theme={theme} lens={lens} onExit={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }
  return <App lens={lens} onLensChange={setLens} theme={theme} onThemeChange={setTheme} />
}
