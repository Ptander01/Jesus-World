// Parallel Accounts — scaffold. Section outlines only; `draft` blocks list what
// each section will cover. The content pass replaces `blocks` with the real
// block list (p / verse / callout / example / compare / xlinks / sources /
// honesty) — the renderers already handle all of them.

export default {
  slug: 'parallel-accounts',
  eyebrow: 'Context · How to Read a Gospel',
  title: ['Parallel ', 'Accounts'],
  verse: { text: 'Since many have undertaken to set down an orderly account…', ref: 'Luke 1:1' },
  standfirst:
    'Matthew, Mark, Luke and John tell one story four times. Read carefully and the seams show — and the seams are where the meaning is.',
  tabLabels: { study: 'The Principle', atlas: 'In the Atlas', deeper: 'Go Deeper' },
  sections: [
    {
      id: 'four-witnesses',
      tab: 'study',
      heading: 'Four Witnesses',
      sub: 'Why the accounts differ — and why a careful reader is glad they do',
      blocks: [
        {
          type: 'draft',
          points: [
            'The Synoptics run in parallel columns; John takes his own path',
            'The Gospels are their own genre — not modern biography, not transcript, not myth',
            "Fee & Stuart's method: think vertically (each Gospel on its own terms) before horizontally (compare across the four)",
            'Flattening the four into one harmonized super-Gospel loses the four portraits that were the point',
          ],
        },
      ],
    },
    {
      id: 'where-differences-come-from',
      tab: 'study',
      heading: 'Where the Differences Come From',
      sub: 'Four ordinary causes — none of them "getting it wrong"',
      blocks: [
        {
          type: 'draft',
          points: [
            'Selection — no account is complete (John 21:25)',
            'Arrangement — Matthew groups teaching thematically; Luke hangs events on the road to Jerusalem',
            'Adaptation — "kingdom of heaven" for a Jewish readership; Luke explains customs for outsiders',
            'Similar events — Jesus taught for years and repeated himself',
            'Worked example: Easter morning — how many women, how many angels, and why each writer framed it as he did',
          ],
        },
      ],
    },
    {
      id: 'try-it-here',
      tab: 'atlas',
      heading: 'Try It Here',
      sub: 'The tools in this atlas that make parallel reading visible',
      blocks: [
        {
          type: 'draft',
          points: [
            'The Gospel Lens dims every marquee event a chosen Evangelist does not record — the gap pattern is that writer’s argument',
            'Where the reading plan runs parallel accounts back to back, the map holds one place while the text changes writers',
            'Worked example: plan day 324 — 103 verses through five post-resurrection scenes, Matthew then Luke then John',
            'Cross-links: set the Lens to John · Reader day 324',
          ],
        },
      ],
    },
    {
      id: 'sources',
      tab: 'deeper',
      heading: 'Sources',
      sub: 'Where this study comes from, and where readers part ways',
      blocks: [
        {
          type: 'draft',
          points: [
            'Fee & Stuart, ch. 7 — "The Gospels: One Story, Many Dimensions" (the horizontal/vertical method and the genre argument)',
            'BEMA Podcast — early Gospel episodes on reading the text in its own world',
            'Kurt Aland, Synopsis of the Four Gospels — the parallel columns in print',
            'Luke 1:1–4 — Luke names his own method',
            'Honesty note: harmonization vs. redaction criticism; a vivid idiom reading is a hypothesis to check, not the plain sense',
          ],
        },
      ],
    },
  ],
}
