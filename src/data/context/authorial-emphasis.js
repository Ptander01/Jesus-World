// Authorial Emphasis — scaffold. Section outlines only.

export default {
  slug: 'authorial-emphasis',
  eyebrow: 'Context · How to Read a Gospel',
  title: ['Authorial ', 'Emphasis'],
  verse: { text: 'These are written so that you may believe…', ref: 'John 20:31' },
  standfirst:
    'Each Evangelist chose what to keep, where to put it, and how to frame it. The shaping is not interference on the signal — it is the message.',
  tabLabels: { study: 'The Principle', atlas: 'In the Atlas', deeper: 'Go Deeper' },
  sections: [
    {
      id: 'each-gospel-has-a-thesis',
      tab: 'study',
      heading: 'Each Gospel Has a Thesis',
      sub: 'Four portraits, each built toward a point',
      blocks: [
        {
          type: 'draft',
          points: [
            'Matthew — Jesus as the new Moses; fulfillment formulas; five teaching blocks; "kingdom of heaven"',
            'Mark — urgency ("immediately"), the road to the cross, the messianic secret',
            'Luke — outsiders, women, the poor; prayer and the Spirit; the long journey to Jerusalem',
            'John — seven signs, the "I am" sayings, believe-and-live',
          ],
        },
      ],
    },
    {
      id: 'reading-for-the-frame',
      tab: 'study',
      heading: 'Reading for the Frame',
      sub: 'What a writer adds, cuts, or reorders tells you what he is after',
      blocks: [
        {
          type: 'draft',
          points: [
            'Redaction, in plain terms: compare a scene across Gospels and watch the edits',
            'Same miracle, two framings — the change of setting or audience carries the interpretation',
            'The danger: turning a difference of emphasis into a claim of contradiction',
          ],
        },
      ],
    },
    {
      id: 'the-lens-as-an-emphasis-map',
      tab: 'atlas',
      heading: 'The Lens as an Emphasis Map',
      sub: 'Seeing each writer’s priorities in the atlas',
      blocks: [
        {
          type: 'draft',
          points: [
            'The Gospel Lens gap pattern on the timeline reads as each writer’s selection',
            'The Gospel Signature radar on the Charts page compares the four by theme at a glance',
            'Cross-links: Charts · Gospel Signature radar',
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
            'Fee & Stuart, ch. 7 — the Evangelists as authors, not stenographers',
            'BEMA Podcast — the Gospel episodes on each writer’s intent',
            'Honesty note: emphasis is not contradiction; hold the four together',
          ],
        },
      ],
    },
  ],
}
