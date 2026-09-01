// Parable Structure. The "one main point," audience-and-occasion, and reversal
// framing follow Fee & Stuart ch. 8 (and the Jülicher / Dodd / Jeremias line it
// rests on), credited in Go Deeper. Scripture is the World English Bible.

export default {
  slug: 'parable-structure',
  eyebrow: 'Context · How to Read a Gospel',
  title: ['Parable ', 'Structure'],
  verse: {
    text: 'He didn’t speak to them without a parable; but privately to his own disciples he explained everything.',
    ref: 'Mark 4:34',
  },
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
          type: 'p',
          text: 'For most of church history a parable was read as a code, every element standing for something. Augustine’s Good Samaritan has the inn as the church, the two coins as two sacraments, the innkeeper as the apostle Paul. Adolf Jülicher’s blunt correction, more than a century ago, still holds: a parable usually makes **one** main point of comparison. The rest is scenery.',
        },
        {
          type: 'callout',
          label: 'What a parable is',
          text: 'A short fictional story drawn from ordinary life, told to a specific audience on a specific occasion, that turns on a single comparison — and often on a reversal the hearer does not see coming.',
        },
        { type: 'h', text: 'Audience and occasion are half the meaning' },
        {
          type: 'p',
          text: 'Luke 15 — the lost sheep, the lost coin, the lost son — is told _at_ the Pharisees who are grumbling that Jesus eats with sinners. Read without that frame it is three warm stories about God’s love. Read with it, the elder brother standing outside the party is the point, and he is aimed straight at the audience.',
        },
        { type: 'h', text: 'The sting' },
        {
          type: 'p',
          text: 'The sharpest parables set the hearer up to pass judgement, then spring the trap. Nathan’s "you are the man" to David is the model. The Pharisee and the tax collector, the workers all paid the same wage, the servant forgiven a fortune who throttles a debtor — each lets you settle comfortably on a verdict, then turns it on you.',
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
          type: 'p',
          text: 'The failure mode is treating every detail as freight. Two tests keep it honest:',
        },
        {
          type: 'compare',
          items: [
            {
              label: 'Would a first hearer have caught it?',
              text: 'If the "meaning" of a detail needs a concordance and three cross-references, it is probably a later system laid over the story, not something in it.',
            },
            {
              label: 'Does the story itself flag it?',
              text: 'A few parables come with their own interpretation attached — the sower, the weeds. Most do not, and supplying one prop-by-prop usually smuggles in a conclusion you already held.',
            },
          ],
        },
        {
          type: 'example',
          heading: 'The Good Samaritan',
          text: [
            'The lawyer asks "who is my neighbour?" — a question about where the obligation stops. The parable refuses the question and asks a different one: which of these three _proved_ to be a neighbour? The single point is that reversal — from drawing the circle to being the neighbour, and a hated Samaritan at that.',
            'The oil, the wine, the two coins, the inn are texture that makes the mercy concrete. Turn them into a system and the one uncomfortable point goes soft.',
          ],
          refs: 'Luke 10:25–37',
        },
        {
          type: 'p',
          text: 'Kingdom parables carry their own tension: many describe a reign that is somehow already here and not yet complete — a seed in the ground, yeast in dough, a field left to grow until harvest. That "already / not yet" is doing real work; it is not a detail to allegorise away.',
        },
      ],
    },
    {
      id: 'parables-on-the-map',
      tab: 'atlas',
      heading: 'Parables on the Map',
      sub: 'The 34 parables by where, and to whom',
      blocks: [
        {
          type: 'p',
          text: 'This atlas carries 34 parables, each with a topic, a one-line lesson, and the place it was told.',
        },
        {
          type: 'xlinks',
          items: [
            { label: 'Open the Atlas — Parables list', href: '#/' },
            { label: 'Context · The Kingdom of God', href: '#/context/kingdom-of-god' },
          ],
        },
        {
          type: 'p',
          text: 'Reading them by location and occasion restores the frame the "one point" rule depends on. The Galilee parables cluster around crowds and the kingdom’s hidden growth; the ones told on the road to Jerusalem turn confrontational; the Jerusalem parables of the last week are mostly judgement aimed at the leadership. Same teacher, different rooms.',
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
          type: 'sources',
          items: [
            {
              tag: 'Fee & Stuart',
              text: '**How to Read the Bible for All Its Worth**, ch. 8 — "The Parables: Do You Get the Point?"',
            },
            {
              tag: 'Further',
              text: 'Klyne Snodgrass, **Stories with Intent** — a full modern treatment, parable by parable.',
            },
            {
              tag: 'Background',
              text: 'C. H. Dodd and Joachim Jeremias — the mid-century work that put the parables back in their first-century setting.',
            },
          ],
        },
        {
          type: 'honesty',
          text: [
            'Jülicher’s "one point" rule was a needed correction that got pushed too hard — some parables plainly have two or three moving parts (the sower; the prodigal, where the father, the younger son and the elder son all carry weight). The safe form of the rule: find the main point first, and be very slow to assign meaning to individual props.',
            'And the "sting" is not a licence to aim every parable at whoever you disagree with. The target is set by the audience named in the text.',
          ],
        },
      ],
    },
  ],
}
