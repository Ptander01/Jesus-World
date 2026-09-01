// Parable Structure — scaffold. Section outlines only.

export default {
  slug: 'parable-structure',
  eyebrow: 'Context · How to Read a Gospel',
  title: ['Parable ', 'Structure'],
  verse: { text: 'With many such parables he spoke the word to them, as they were able to hear it.', ref: 'Mark 4:33' },
  standfirst:
    'A parable is not a code to decrypt. It makes one main comparison, to a particular audience, and usually turns on a sting the hearer does not see coming.',
  tabLabels: { study: 'The Principle', atlas: 'In the Atlas', deeper: 'Go Deeper' },
  sections: [
    {
      id: 'one-point-not-an-allegory',
      tab: 'study',
      heading: 'One Point, Not an Allegory',
      sub: 'What a parable is built to do',
      blocks: [
        {
          type: 'draft',
          points: [
            'The correction to centuries of allegorizing: a parable carries one central point of comparison',
            'Audience and occasion are part of the meaning — who is Jesus answering, and why',
            'The "sting": the reversal that lands on the hearer (the Pharisee and the tax collector; the elder brother)',
            'A few parables are given their own interpretation (the sower) — most are not',
          ],
        },
      ],
    },
    {
      id: 'how-to-not-over-read',
      tab: 'study',
      heading: 'How Not to Over-Read',
      sub: 'The details are scenery unless the story flags them',
      blocks: [
        {
          type: 'draft',
          points: [
            'Reading every element as a symbol (the inn, the two coins, the oil) misses the single point',
            'Test: would a first-century hearer have caught this, or is it a later system imposed on the story',
            'Kingdom parables and the already / not-yet tension',
          ],
        },
      ],
    },
    {
      id: 'parables-on-the-map',
      tab: 'atlas',
      heading: 'Parables on the Map',
      sub: 'The 34 parables by where and to whom',
      blocks: [
        {
          type: 'draft',
          points: [
            'Each parable carries a topic, a lesson, and an occasion place id',
            'Reading them by location shows what Jesus taught where, and to which audience',
            'Cross-links: FilterPanel · Parables list',
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
            'Fee & Stuart, ch. 8 — "The Parables: Do You Get the Point?"',
            'Klyne Snodgrass, Stories with Intent — for going deeper',
            'Honesty note: some parables resist a single tidy point; say so rather than forcing one',
          ],
        },
      ],
    },
  ],
}
