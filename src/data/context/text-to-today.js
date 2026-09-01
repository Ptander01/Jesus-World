// From Text to Today. The "then / now" hermeneutic, the exegesis-first order, and
// the descriptive/prescriptive and "comparable situations" tests are Fee &
// Stuart's (chs. 1–4, 11), credited in Go Deeper.

export default {
  slug: 'text-to-today',
  eyebrow: 'Context · How to Read a Gospel',
  title: ['From Text ', 'to Today'],
  verse: {
    text: 'Therefore every scribe who has been made a disciple in the Kingdom of Heaven is like a man who is a householder, who brings out of his treasure new and old things.',
    ref: 'Matthew 13:52',
  },
  standfirst:
    'Interpretation runs in one order: what it meant, then what it means. Skip the first and "what it means" is only what you brought with you.',
  tabLabels: { study: 'The Principle', atlas: 'In the Atlas', deeper: 'Go Deeper' },
  sections: [
    {
      id: 'what-it-meant-first',
      tab: 'study',
      heading: 'What It Meant, Before What It Means',
      sub: 'Exegesis is the step you cannot skip',
      blocks: [
        {
          type: 'p',
          text: '**Exegesis** is the deliberate, historical reading of what a text meant to its first hearers — this author, these words, that situation. It is the first task, and it is not optional. The alternative is not "no interpretation"; it is unexamined interpretation, where the reader’s own assumptions quietly fill the gap.',
        },
        {
          type: 'p',
          text: 'The distance is real. Language, politics, custom, geography and genre all sit between a first-century Galilean audience and a reader now. Most of this atlas exists to close that distance — the map, the timeline, the reading plan, and these studies.',
        },
        {
          type: 'callout',
          label: 'Genre governs application',
          text: 'A parable, a piece of narrative, and a block of direct teaching do not transfer to now in the same way. "Jesus went up a mountain" is not a command about hiking; "love your enemies" is not merely a description of first-century manners. Knowing which kind of text you are holding decides what you are allowed to do with it.',
        },
      ],
    },
    {
      id: 'a-disciplined-bridge',
      tab: 'study',
      heading: 'A Disciplined Bridge',
      sub: 'From the first century to now without breaking the text',
      blocks: [
        {
          type: 'list',
          items: [
            '**Find the principle, not the cultural particular.** A greeting with a holy kiss, a head covering, a basin of feet — the enacted form is first-century; the principle (honour, welcome, humble service) is what crosses over.',
            '**Use the "comparable situations" test.** An instruction applies most directly where a modern situation genuinely matches the original one. The further the match, the more carefully you argue the bridge.',
            '**Tell description from prescription.** The Gospels _narrate_ a great deal that they do not _command_. That the disciples drew lots, or that a crowd was fed on a hillside, reports what happened; it does not by itself instruct.',
          ],
        },
        {
          type: 'p',
          text: 'None of this makes the text mean less. A principle rightly found is more demanding than a rule mechanically copied, because it reaches situations the original writer never listed.',
        },
      ],
    },
    {
      id: 'using-this-atlas-responsibly',
      tab: 'atlas',
      heading: 'Using This Atlas Responsibly',
      sub: 'The map and the timeline give you the "then"',
      blocks: [
        {
          type: 'p',
          text: 'The atlas is a tool for the first step. It fills in the historical setting so the exegesis has something solid to stand on before any application is attempted.',
        },
        {
          type: 'xlinks',
          items: [
            { label: 'Context · Roman Occupation', href: '#/context/roman-occupation' },
            { label: 'Context · Second Temple Judaism', href: '#/context/second-temple-judaism' },
          ],
        },
        {
          type: 'p',
          text: 'One caution the atlas makes easy to ignore: resist collapsing first-century politics into a modern proxy. The Zealots are not a party in a current election; the Pharisees are not a stand-in for people you dislike at church. Let the "then" stay genuinely strange before you carry anything across.',
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
              text: '**How to Read the Bible for All Its Worth**, chs. 1–4 — the exegetical method and the "then / now" hermeneutic — and ch. 11 on applying the Gospels.',
            },
            {
              tag: 'Companion',
              text: 'Gordon Fee & Douglas Stuart, **How to Read the Bible Book by Book** — the same method run through each book in turn.',
            },
            {
              tag: 'BEMA',
              text: '**BEMA Podcast** — for the "what it meant" half: hearing the text in its own world before asking what it asks of us.',
            },
          ],
        },
        {
          type: 'honesty',
          text: [
            'There are two ditches. One is flat literalism — copying a first-century cultural form as if the form were the command. The other is "it means whatever it means to me" — skipping the historical step entirely so the text becomes a mirror.',
            'And drawing the principle out of the particular involves judgement. Careful readers land in different places on hard cases; the method narrows the range and shows the work, it does not remove the need to decide.',
          ],
        },
      ],
    },
  ],
}
