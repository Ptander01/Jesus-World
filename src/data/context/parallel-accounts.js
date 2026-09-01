// Parallel Accounts. Synthesis in the app's voice; the method (think
// horizontally / think vertically) and the genre argument are Fee & Stuart's,
// credited in the Go Deeper section. Scripture is the World English Bible
// (public domain), matching the Reader.

export default {
  slug: 'parallel-accounts',
  eyebrow: 'Context · How to Read a Gospel',
  title: ['Parallel ', 'Accounts'],
  verse: {
    text: 'Since many have undertaken to set in order a narrative concerning those matters which have been fulfilled among us…',
    ref: 'Luke 1:1',
  },
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
          type: 'p',
          text: 'Matthew, Mark, Luke and John tell one story four times. Three of them — the _Synoptics_ — run so close that you can set them in parallel columns; John takes his own path. Read them side by side and the differences surface: a saying worded two ways, events in a different order, one account naming two angels at the tomb where another names one.',
        },
        {
          type: 'p',
          text: 'The instinct is to treat every difference as an error to explain away. Fee & Stuart press the opposite case: the Gospels are their own **genre** — not modern biography, not court transcript, not myth. Each writer took real events and real teaching and **selected, arranged, and shaped** them to bring a point home to a particular audience. The shaping is not noise on the signal. It _is_ the signal.',
        },
        {
          type: 'callout',
          label: 'The rule of thumb',
          text: '**Think vertically, then horizontally.** First hear each Gospel on its own terms — what is _this_ writer building toward? Only then read across the four. Flatten them into one harmonised super-Gospel and the four portraits, which were the point, are gone.',
        },
        {
          type: 'verse',
          text: 'It seemed good to me also, having traced the course of all things accurately from the first, to write to you in order, most excellent Theophilus.',
          ref: 'Luke 1:3',
        },
        {
          type: 'p',
          text: 'Luke names his own method in his opening sentence: earlier accounts already existed, eyewitness testimony stood behind them, and he arranged his material deliberately for one reader. "In order" is a claim about structure and purpose — not a promise of a stopwatch.',
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
          type: 'p',
          text: 'Four ordinary things account for nearly all of it, and not one of them is a mistake:',
        },
        {
          type: 'compare',
          items: [
            {
              label: 'Selection',
              text: 'No account is complete, and John says so outright (21:25). Each writer keeps what serves his purpose and lets the rest go.',
            },
            {
              label: 'Arrangement',
              text: 'Matthew gathers teaching into five great blocks; Luke hangs events on a journey to Jerusalem. Order is often thematic, not chronological.',
            },
            {
              label: 'Adaptation',
              text: 'Matthew writes "kingdom of heaven" for readers who guard the divine Name; Luke pauses to explain Jewish customs for outsiders. One teaching, tuned to the room.',
            },
            {
              label: 'Similar events',
              text: 'Jesus taught for years and repeated himself. Two accounts of a beatitude or an anointing may simply be two occasions.',
            },
          ],
        },
        {
          type: 'example',
          heading: 'Easter morning',
          text: [
            'How many women came to the tomb? How many messengers met them? Each Gospel answers differently — and no answer contradicts the others once you stop demanding a police report.',
            'Mark follows one woman’s terror. Matthew stages an earthquake and a single blazing angel. Luke fills the garden with a group and "two men." John narrows to Mary alone in the half-dark, and then a name spoken.',
            'Harmonise the logistics if you like — no account says _only_ one woman, or _only_ one angel. The better question is why each writer framed the morning the way he did. That is where the theology sits.',
          ],
          refs: 'Matthew 28:1–10 · Mark 16:1–8 · Luke 24:1–12 · John 20:1–18',
        },
        {
          type: 'verse',
          text: 'There are also many other things which Jesus did, which if they would all be written, I suppose that even the world itself wouldn’t have room for the books that would be written.',
          ref: 'John 21:25',
        },
        {
          type: 'p',
          text: 'So a difference between accounts is an invitation, not a problem. Ask what this writer saw that the others set aside, and you have found the door into his Gospel.',
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
          type: 'p',
          text: 'This atlas is built for vertical-then-horizontal reading. Two places to practise it:',
        },
        {
          type: 'xlinks',
          items: [
            { label: 'Open the Atlas — set the Gospel Lens', href: '#/' },
            { label: 'Reader · plan day 324', href: '#/gospels/324' },
          ],
        },
        { type: 'h', text: 'The Gospel Lens' },
        {
          type: 'p',
          text: 'Switch the Lens from _All_ to a single Evangelist and the timeline dims every event that writer does not record. Under **John**, seven of the sixteen marquee events go dark — no nativity, no baptism scene, no transfiguration — while a wedding at Cana and a raising at Bethany light up that the others never mention. That gap pattern _is_ John’s argument, made visible.',
        },
        { type: 'h', text: 'Parallel scenes on the map' },
        {
          type: 'p',
          text: 'Where the reading plan runs parallel accounts back to back — the centurion’s servant, the feeding of the crowd, the anointing at Bethany — the map holds one place while the text shifts writers. Read the section straight through in one account, then scrub back and read its neighbour.',
        },
        {
          type: 'example',
          heading: 'Plan day 324 — five scenes, one map',
          text: [
            'The plan’s last day runs 103 verses through Emmaus, Thomas, the shore, the commission and the ascension — Matthew first, then Luke, then John. The map moves through all five sites instead of holding one "Jerusalem" pin.',
            'You are watching three writers order the same days three ways — the horizontal read, built into the scroll.',
          ],
          refs: 'Reader · plan day 324',
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
          type: 'sources',
          items: [
            {
              tag: 'Fee & Stuart',
              text: '**How to Read the Bible for All Its Worth**, ch. 7 — "The Gospels: One Story, Many Dimensions." The horizontal/vertical method and the genre argument are theirs; this page is a summary, not a substitute. Read the chapter.',
            },
            {
              tag: 'BEMA',
              text: '**BEMA Podcast** — the early Gospel sessions on reading the text as ancient literature written for a first hearer, and on letting each writer’s intent stand.',
            },
            {
              tag: 'Tool',
              text: 'Kurt Aland, **Synopsis of the Four Gospels** — the parallel columns in print, for doing this at the desk.',
            },
            {
              tag: 'Primary',
              text: '**Luke 1:1–4** — Luke’s prologue names the method: prior accounts, eyewitness tradition, an orderly arrangement for a named reader.',
            },
          ],
        },
        {
          type: 'honesty',
          text: [
            'The older _harmonisation_ tradition fits every detail into a single timeline; _redaction criticism_ studies each writer’s edits for his theology. This study leans on the second without denying the first.',
            'And a caution the other way: a vivid Hebrew-idiom or Second-Temple reading is a hypothesis about what a first hearer caught — worth holding, worth checking against the text, not the plain sense by default.',
          ],
        },
      ],
    },
  ],
}
