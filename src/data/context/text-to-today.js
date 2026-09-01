// From Text to Today — scaffold. Section outlines only.

export default {
  slug: 'text-to-today',
  eyebrow: 'Context · How to Read a Gospel',
  title: ['From Text ', 'to Today'],
  verse: { text: 'Every scribe trained for the kingdom… brings out of his treasure what is new and what is old.', ref: 'Matthew 13:52' },
  standfirst:
    'Interpretation runs in one order: what it meant, then what it means. Skip the first and "what it means" is only what you brought with you.',
  tabLabels: { study: 'The Principle', atlas: 'In the Atlas', deeper: 'Go Deeper' },
  sections: [
    {
      id: 'what-it-meant-first',
      tab: 'study',
      heading: 'What It Meant, Before What It Means',
      sub: 'Exegesis is the non-negotiable first step',
      blocks: [
        {
          type: 'draft',
          points: [
            'Exegesis: the deliberate, historical reading of what the author meant to his first hearers',
            'The distance is real — language, politics, custom, genre all sit between the reader and the text',
            'Genre governs application: narrative, parable, and discourse do not transfer the same way',
          ],
        },
      ],
    },
    {
      id: 'a-disciplined-bridge',
      tab: 'study',
      heading: 'A Disciplined Bridge',
      sub: 'Moving from the first century to now without breaking the text',
      blocks: [
        {
          type: 'draft',
          points: [
            'Find the principle, not the cultural particular',
            'The "comparable situations" test — a modern case genuinely like the original',
            'Descriptive vs. prescriptive: not everything narrated is commanded',
          ],
        },
      ],
    },
    {
      id: 'using-this-atlas-responsibly',
      tab: 'atlas',
      heading: 'Using This Atlas Responsibly',
      sub: 'The map and timeline give you the "then"',
      blocks: [
        {
          type: 'draft',
          points: [
            'The atlas fills in the historical context so the exegesis has something to stand on',
            'Resist collapsing first-century politics into a modern political proxy',
            'Cross-links: Atlas · Reader',
          ],
        },
      ],
    },
    {
      id: 'sources',
      tab: 'deeper',
      heading: 'Sources',
      sub: 'Where this study comes from',
      blocks: [
        {
          type: 'draft',
          points: [
            'Fee & Stuart, chs. 1–4 — the exegetical method and the "then/now" hermeneutic',
            'Fee & Stuart, ch. 11 — the Gospels applied',
            'Honesty note: the two ditches — flat literalism, and "it means whatever it means to me"',
          ],
        },
      ],
    },
  ],
}
