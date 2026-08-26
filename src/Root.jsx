import { useEffect, useState, lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import HeroLanding from './components/HeroLanding.jsx'
import Tour from './components/Tour.jsx'

// The visuals route is a preview surface, not part of the atlas shell, so it gets a
// hash check rather than a router dependency. Lazy, to keep the charts out of the
// main map bundle.
const VisualsDemo = lazy(() => import('./components/VisualsDemo.jsx'))
const GospelReader = lazy(() => import('./components/GospelReader.jsx'))

const routeOf = () => window.location.hash.replace(/^#/, '')

export default function Root() {
  const [route, setRoute] = useState(routeOf)
  // The Gospel Lens lives here, above the routes, so the atlas and the visuals share
  // one selection — flipping to John on the map keeps John on the charts.
  const [lens, setLens] = useState('All')
  // The reader is a different mode, not a different app — it shares the atlas's theme
  // so crossing between them doesn't flash.
  const [theme, setTheme] = useState(() => localStorage.getItem('pw-theme') || 'dark')
  // Hero shows once per session, on the atlas route only. Persisted so navigating to
  // the reader/visuals and back doesn't re-trigger it.
  const [entered, setEntered] = useState(() => sessionStorage.getItem('jw-entered') === '1')
  // The walkthrough runs once ever (localStorage, unlike the hero's per-session
  // flag) and is reopenable from the header. It points at atlas chrome, so it
  // waits for the hero to be dismissed and for that chrome to exist.
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    const onHash = () => setRoute(routeOf())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!entered || route.replace(/^\//, '') !== '') return
    if (localStorage.getItem('jw-tour-done') === '1') return
    const t = setTimeout(() => setTourOpen(true), 700)
    return () => clearTimeout(t)
  }, [entered, route])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('pw-theme', theme)
  }, [theme])

  // Vercel Web Analytics only sees History-API navigation — its script patches
  // `pushState` and listens for `popstate`, and carries no `hashchange` handler
  // at all. Left to auto-track on a hash router it records one view per full page
  // load and nothing after, so the atlas, the charts and the reader all collapse
  // into `/`. Passing `route` turns auto-tracking off and reports a pageview
  // whenever these two change instead.
  //
  // `route` is the grouping key and `path` the concrete URL, so the 39 reading
  // days report as one row rather than 39. The empty hash has to become `/`:
  // the component skips the pageview when either value is falsy, which would
  // leave the atlas — the most visited surface — recording nothing at all.
  const vaPath  = route || '/'
  const vaRoute = /^\/gospels\/\d+$/.test(route) ? '/gospels/:day' : vaPath

  // The reader: the whole plan, with the curated Passion Week scenes folded into
  // the days they belong to. `/read` was that material's own route before the
  // merge; it now lands on the day the week opens so old links still work.
  const gospels = /^\/(?:gospels(?:\/(\d+))?|read)$/.exec(route)

  let body
  if (route === '/visuals') {
    body = (
      <Suspense fallback={null}>
        <VisualsDemo lens={lens} onLensChange={setLens} theme={theme} onThemeChange={setTheme} />
      </Suspense>
    )
  } else if (gospels) {
    const day = gospels[1] ? Number(gospels[1]) : (route === '/read' ? 311 : null)
    body = (
      <Suspense fallback={null}>
        <GospelReader
          theme={theme}
          lens={lens}
          initialDay={day}
        />
      </Suspense>
    )
  } else {
    body = (
      <>
        <App
          lens={lens}
          onLensChange={setLens}
          theme={theme}
          onThemeChange={setTheme}
          onShowTour={() => setTourOpen(true)}
        />
        {!entered && (
          <HeroLanding onEnter={() => { setEntered(true); sessionStorage.setItem('jw-entered', '1') }} />
        )}
        {tourOpen && entered && <Tour onClose={() => setTourOpen(false)} />}
      </>
    )
  }

  return (
    <>
      {body}
      <Analytics route={vaRoute} path={vaPath} />
    </>
  )
}
