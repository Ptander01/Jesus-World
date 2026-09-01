// Context — topic registry for the #/context pane.
//
// This is what the pane's landing page renders, and the spine every study hangs
// off. It lives in src/data/ (not exported from a component file) so the pane's
// components stay clean under react-refresh/only-export-components — the same
// reasoning that keeps timelineMaterial.jsx out of TimelineDefs.jsx.
//
// `format` picks the renderer:
//   'study' → ContextStudy  — tabbed: Study / In the Atlas / Go Deeper
//   'guide' → ContextGuide  — one continuous read with a section rail
// The call per topic: tabbed for the interpretive-method studies (they earn the
// "In the Atlas" tab), long-form for the narrative background pieces.
//
// Each topic's content is a sibling module — src/data/context/<slug>.js — loaded
// lazily by the pane. Those are original synthesis in the app's voice: they
// credit Fee & Stuart and the BEMA project and point readers to them, and never
// reproduce them.

export const GROUPS = [
  {
    id: 'how-to-read',
    part: 'Part I',
    title: 'How to Read a Gospel',
    blurb:
      'The interpretive moves — genre, sources, structure, and the jump from first century to now.',
  },
  {
    id: 'world-behind',
    part: 'Part II',
    title: 'The World Behind the Text',
    blurb: 'The room the Gospels were spoken in — its politics, its faith, its hope.',
  },
]

// Shared source references. A study module cites specific chapters / episodes in
// its own `sources` blocks; this is just what the index card advertises.
export const SOURCES = {
  feeStuart: {
    tag: 'Fee & Stuart',
    label: 'How to Read the Bible for All Its Worth',
    by: 'Gordon D. Fee & Douglas Stuart',
  },
  bema: {
    tag: 'BEMA',
    label: 'BEMA Podcast',
    by: 'Marty Solomon & Brent Billings',
    url: 'https://www.bemadiscipleship.com/episodes',
  },
}

export const TOPICS = [
  {
    slug: 'parallel-accounts',
    group: 'how-to-read',
    kind: 'Study · Hermeneutics',
    name: 'Parallel Accounts',
    hook: "Four tellings, often differing. Why that's four witnesses, not one broken transcript.",
    format: 'study',
    accent: '#c9a84c',
    sources: ['feeStuart', 'bema'],
  },
  {
    slug: 'authorial-emphasis',
    group: 'how-to-read',
    kind: 'Study · Hermeneutics',
    name: 'Authorial Emphasis',
    hook: 'Each Evangelist selects and arranges to make a point. The shaping is the message.',
    format: 'study',
    accent: '#4DA1A7',
    sources: ['feeStuart', 'bema'],
  },
  {
    slug: 'how-we-got-the-gospels',
    group: 'how-to-read',
    kind: 'Study · Text',
    name: 'How We Got the Gospels',
    hook: 'Event to oral tradition to written text. Why the gap makes the Gospels sturdier, not shakier.',
    format: 'study',
    accent: '#B27FA5',
    sources: ['feeStuart', 'bema'],
  },
  {
    slug: 'parable-structure',
    group: 'how-to-read',
    kind: 'Study · Hermeneutics',
    name: 'Parable Structure',
    hook: 'One point of comparison, an audience, a sting in the tail. How not to over-read the details.',
    format: 'study',
    accent: '#9289C1',
    sources: ['feeStuart'],
  },
  {
    slug: 'text-to-today',
    group: 'how-to-read',
    kind: 'Study · Application',
    name: 'From Text to Today',
    hook: '"What it meant" before "what it means." A disciplined bridge, and the ditches on either side.',
    format: 'study',
    accent: '#B5885B',
    sources: ['feeStuart'],
  },
  {
    slug: 'second-temple-judaism',
    group: 'world-behind',
    kind: 'Context · First century',
    name: 'Second Temple Judaism',
    hook: 'Sadducees, Herodians, Essenes, Zealots, Pharisees — five ways to answer one occupied-nation question.',
    format: 'guide',
    accent: '#6797C2',
    sources: ['bema'],
  },
  {
    slug: 'roman-occupation',
    group: 'world-behind',
    kind: 'Context · First century',
    name: 'Roman Occupation',
    hook: 'Client kings, the census, the cross as state terror. The pressure every scene sits under.',
    format: 'guide',
    accent: '#BF7E7C',
    sources: ['bema'],
  },
  {
    slug: 'kingdom-of-god',
    group: 'world-behind',
    kind: 'Context · Theology',
    name: 'The Kingdom of God',
    hook: 'Not heaven-when-you-die. A reign breaking in now — "already," and "not yet."',
    format: 'guide',
    accent: '#6aaa6a',
    sources: ['bema', 'feeStuart'],
  },
]

export const topicBySlug = (slug) => TOPICS.find((t) => t.slug === slug) || null
