// How We Got the Gospels. The route from event → oral tradition → written text,
// and why that route is ordinary rather than alarming. Draws on Fee & Stuart's
// genre/exegesis work and the BEMA project's ep. 82 ("The Text") and ep. 83
// (Gospel Narrative), plus the Essene scribal culture of ep. 78. The "In the
// Atlas" tab is grounded in this app's own reading plan, which already encodes
// textual-criticism decisions (see CLAUDE.md's reading-plan notes). Scripture is
// the World English Bible.

export default {
  slug: 'how-we-got-the-gospels',
  eyebrow: 'Context · How to Read a Gospel',
  title: ['How We Got ', 'the Gospels'],
  verse: {
    text: 'even as those who from the beginning were eyewitnesses and servants of the word delivered them to us…',
    ref: 'Luke 1:2',
  },
  standfirst:
    'Between the events and the four books lies a generation of telling, remembering, and finally writing. Knowing that route makes the Gospels sturdier, not shakier.',
  tabLabels: { study: 'The Principle', atlas: 'In the Atlas', deeper: 'Go Deeper' },
  sections: [
    {
      id: 'from-event-to-text',
      tab: 'study',
      heading: 'From Event to Text',
      sub: 'The Gospels come out of an oral world',
      blocks: [
        {
          type: 'p',
          text: 'The four Gospels were written down decades after the events they record — most estimates fall between about AD 65 and 95, a generation or more after the crucifixion. For a modern reader raised on the idea of a reporter with a notebook, that gap can feel like a problem. In a first-century setting it is simply how a culture kept and passed on what mattered.',
        },
        {
          type: 'p',
          text: 'That world was an **oral culture**. Teaching was memorised, recited, and handed on with care long before anyone reached for a scroll — scrolls were expensive, literacy was uneven, and a rabbi’s words were meant to be carried in the students, not filed on a shelf. The years between the ministry and the written Gospels are not a silence to be nervous about; they are the ordinary working of oral tradition.',
        },
        {
          type: 'callout',
          label: 'Inspiration is not dictation',
          text: 'Holding the Gospels as inspired does not require that they be stenographic transcripts. A God who works through an oral tradition, a writer’s selection, and a chosen genre is no less at work than a God dictating word for word. **Inspired** means "from God," not "assembled like a court record."',
        },
      ],
    },
    {
      id: 'the-sources-behind',
      tab: 'study',
      heading: 'The Sources Behind the Gospels',
      sub: 'Eyewitnesses, shared material, and careful hands',
      blocks: [
        {
          type: 'p',
          text: 'Luke tells us plainly where his Gospel comes from. He is not an eyewitness; he is a careful compiler working from those who were.',
        },
        {
          type: 'verse',
          text: 'Since many have undertaken to set in order a narrative concerning those matters which have been fulfilled among us, even as those who from the beginning were eyewitnesses and servants of the word delivered them to us…',
          ref: 'Luke 1:1–2',
        },
        {
          type: 'p',
          text: 'Two things sit in that sentence: **eyewitness testimony**, and a body of accounts already circulating ("many have undertaken"). Scholars comparing the Synoptics find so much shared wording that they posit common material behind them — an early source, often labelled **Q**, whether written or oral. None of this competes with inspiration; it is the raw tradition the Evangelists shaped.',
        },
        {
          type: 'p',
          text: 'And the culture that carried the text prized getting it right. The Essenes at Qumran copied Scripture as a four-person job — one reciting, one checking the recitation, one writing, one checking the writing — pausing to wash before writing the divine Name. When the Dead Sea Scrolls surfaced a thousand years older than the manuscripts scholars had, the text had barely drifted. That is the scribal world the Gospels were born into.',
        },
        {
          type: 'callout',
          label: 'Why this steadies rather than unsettles',
          text: 'A late writing date, a shared source, an oral pre-history — each is sometimes waved as a reason to doubt. Each is really a reason for confidence: the Gospels rest on eyewitness memory, held by a community trained to carry words faithfully, and written while people who had been there were still alive to object.',
        },
      ],
    },
    {
      id: 'the-text-you-are-reading',
      tab: 'atlas',
      heading: 'The Text You’re Reading',
      sub: 'Where textual decisions become visible in this atlas',
      blocks: [
        {
          type: 'p',
          text: 'The Reader carries the whole four Gospels as a 39-day chronological read (in the World English Bible). Because it prints the real text, it also inherits the real textual questions — and it flags them rather than smoothing them over.',
        },
        {
          type: 'xlinks',
          items: [
            { label: 'Open the Reader', href: '#/gospels' },
            { label: 'Context · Parallel Accounts', href: '#/context/parallel-accounts' },
          ],
        },
        { type: 'h', text: 'Disputed passages, kept and marked' },
        {
          type: 'p',
          text: 'A few well-known passages are absent from the earliest manuscripts — the longer ending of Mark, the woman caught in adultery, a stray verse here and there. The plan keeps them and marks them as additional readings rather than dropping them or pretending the question away. One verse, Mark 11:26, simply isn’t there: the reading runs to 11:25 and resumes at 11:27, exactly where the critical text leaves a gap.',
        },
        {
          type: 'p',
          text: 'This is textual criticism made concrete. The apparatus behind a study Bible — "the earliest manuscripts do not include…" — is the same honesty the reading plan practises by keeping the seams visible.',
        },
      ],
    },
    {
      id: 'sources',
      tab: 'deeper',
      heading: 'Sources',
      sub: 'Where this study comes from, and where it gets contested',
      blocks: [
        {
          type: 'sources',
          items: [
            {
              tag: 'Fee & Stuart',
              text: '**How to Read the Bible for All Its Worth** — the genre argument (the Gospels are not modern journalism) and the exegesis-first method that a text with a history requires.',
            },
            {
              tag: 'BEMA',
              text: '**BEMA Podcast**, Session 3 — ep. 82 (The Text: when, where, who, why) on oral culture and authorship, ep. 83 (Gospel Narrative), and ep. 78 (Essenes) on the scribal transmission of Scripture.',
            },
            {
              tag: 'Primary',
              text: '**Luke 1:1–4** — the New Testament’s own account of how a Gospel was made: prior narratives, eyewitness tradition, careful arrangement.',
            },
            {
              tag: 'Further',
              text: 'On transmission and manuscripts, a standard introduction to New Testament textual criticism (e.g. the work of Bruce Metzger).',
            },
          ],
        },
        {
          type: 'honesty',
          text: [
            'Dating and authorship are genuinely debated — who wrote each Gospel, in what order, and how early. This study stays on the widely-shared ground (an oral pre-history, eyewitness tradition, shared source material) and leaves the finer disputes open.',
            'BEMA’s ep. 82 also presses further claims — the documentary hypothesis, and a late dating of parts of the Old Testament (including Daniel). Those belong to Old Testament scholarship, are more contested, and are not load-bearing for anything on this page; weigh them on their own terms.',
            'Across all of it, the rule holds: a text with a history is not a text without authority. How the Gospels were made is a separate question from whether they are trustworthy — and the history, read fairly, supports the trust.',
          ],
        },
      ],
    },
  ],
}
