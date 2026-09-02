// Reading Like a Rabbi — the Hebraic reading method (PaRDeS) that BEMA lays out
// in ep. 110 (Jewish Hermeneutics). Synthesis in the app's voice. The honesty
// box carries the real caveat: the fourfold PaRDeS acronym is medieval, later
// than the first century, even though the underlying practices (allusion to
// Scripture, discovery-based teaching) are ancient — and BEMA itself warns the
// method is loose and easy to over-structure. Complements Parable Structure.
// Scripture is the World English Bible.

export default {
  slug: 'reading-like-a-rabbi',
  eyebrow: 'Context · How to Read a Gospel',
  title: ['Reading Like ', 'a Rabbi'],
  verse: {
    text: 'All these things Jesus spoke to the multitudes in parables; and without a parable, he didn’t speak to them.',
    ref: 'Matthew 13:34',
  },
  standfirst:
    'A rabbi teaches to be discovered, not merely understood. Learn the moves a first-century student was expected to make, and Jesus’ hardest sayings start opening up.',
  tabLabels: { study: 'The Principle', atlas: 'In the Reader', deeper: 'Go Deeper' },
  sections: [
    {
      id: 'meant-to-be-discovered',
      tab: 'study',
      heading: 'Meant to Be Discovered',
      sub: 'Why a parable makes the teaching harder, not easier',
      blocks: [
        {
          type: 'p',
          text: 'When the disciples ask Jesus why he teaches in parables, his answer sounds backwards to a modern ear: so that people _won’t_ understand (Mark 4:11–12, quoting Isaiah 6). A Western teacher explains until the point is clear. An Eastern teacher does the opposite — he **buries** the point so the student has to dig it out, because a truth you _discover_ lodges deeper than a truth you are handed.',
        },
        {
          type: 'p',
          text: 'So a parable is not a simplification. It is a puzzle set for people who actually want in. "So they won’t understand" means: the ones unwilling to do the work will hear a nice story and move on; the ones who dig will find treasure. A rabbi teaches to the most hungry student in the room, not the least.',
        },
        {
          type: 'callout',
          label: 'The first move',
          text: 'Notice what _doesn’t fit_. An odd number, a needless name, a detail that snags — that snag is usually the door the rabbi left open. First-century students hunted for the thing that stood out, because that is where the buried treasure was marked.',
        },
      ],
    },
    {
      id: 'four-levels',
      tab: 'study',
      heading: 'Four Levels',
      sub: 'P’shat, remez, drash, sod — from the surface to the mystery',
      blocks: [
        {
          type: 'p',
          text: 'Jewish tradition later gave the layers of reading a memory-word, **PaRDeS** (also the word for "orchard," or paradise) — four levels a teaching can be worked on:',
        },
        {
          type: 'compare',
          items: [
            {
              label: 'P’shat · plain',
              text: 'The surface reading — what the words plainly say. Not shallow: most good preaching lives here, and it is neither less true nor less inspired than the deeper levels. If you don’t know your Bible, this is all you have — and it is a great deal.',
            },
            {
              label: 'Remez · hint',
              text: 'A deliberate hint pointing to another passage of Scripture. The rabbi buries a quotation or an odd phrase; the student who knows the text recognises it and follows it home to a fuller meaning.',
            },
            {
              label: 'Drash · seek',
              text: 'The interpretation the hint unlocks — truth carried in story, worked out by comparing the two passages. Never a fixed code; nuanced, often many-sided, and meant to be argued out in a group.',
            },
            {
              label: 'Sod · secret',
              text: 'The mystery — the flash of understanding that cannot be taught, only given. When Peter confesses "you are the Christ," Jesus says flesh and blood did not reveal it (Matthew 16:17). That is sod.',
            },
          ],
        },
        {
          type: 'example',
          heading: 'A remez in the parable of the soils',
          text: [
            'Jesus says the good soil yields "a hundred times, some sixty, some thirty." The numbers snag — they run the wrong way, big to small, and "a hundredfold" is oddly specific.',
            'Follow the hint: outside Jesus’ own teaching, "a hundredfold" appears exactly once in the Hebrew Bible — Genesis 26:12, where Isaac sows in the land during a famine and reaps a hundredfold because the Lord blesses him. Isaac then keeps re-digging his father’s wells, yielding rather than fighting, until even his enemies admit "the Lord is with you."',
            'So the good soil’s drash is Isaac: stay in the land, hold to the mission, persevere without grasping — and God’s promise bears fruit. The p’shat ("which soil am I?") is true and good on its own; the remez adds a second, deeper reading for the one who knows the text.',
          ],
          refs: 'Matthew 13:8, 23 · Genesis 26:12',
        },
        {
          type: 'p',
          text: 'This is not a cipher with one hidden answer. The remez is always open to debate, a teaching can carry several, and the point was never to "solve" it — it was to send a room full of students back into the Scriptures, arguing. That wrestling is where the power is.',
        },
      ],
    },
    {
      id: 'in-the-reader',
      tab: 'atlas',
      heading: 'Practising in the Reader',
      sub: 'The method needs a memorised Bible — so build one',
      blocks: [
        {
          type: 'p',
          text: 'The catch in all of this: remez only works if you know the Hebrew Scriptures well enough to hear the echo. A first-century student had them by heart. Most of us do not — which is exactly why a full read-through, with the cross-references in view, is the groundwork.',
        },
        {
          type: 'xlinks',
          items: [
            { label: 'Open the Reader', href: '#/gospels' },
            { label: 'Context · Parable Structure', href: '#/context/parable-structure' },
          ],
        },
        {
          type: 'p',
          text: 'Read a parable in the Reader and try the moves in order: state the **p’shat** plainly; hunt the phrase that snags and look for its **remez** in the Old Testament; then work the **drash** the link opens up. Do it with other people — the method assumed a _havurah_, a learning circle, precisely because no one catches every echo alone.',
        },
        {
          type: 'callout',
          label: 'A companion, not a rival',
          text: 'PaRDeS and the plain-sense reading of _Parable Structure_ are two hands, not two camps. Find the one main point first (p’shat); reach for the deeper levels second, and hold them loosely.',
        },
      ],
    },
    {
      id: 'sources',
      tab: 'deeper',
      heading: 'Sources',
      sub: 'Where this study comes from, and where to be careful',
      blocks: [
        {
          type: 'sources',
          items: [
            {
              tag: 'BEMA',
              text: '**BEMA Podcast**, ep. 110 (Jewish Hermeneutics) — Marty Solomon’s walk through PaRDeS, the discovery model, and the hundredfold remez. He credits his teacher, Ray Vander Laan.',
            },
            {
              tag: 'Fee & Stuart',
              text: '**How to Read the Bible for All Its Worth**, ch. 8 — the parables’ one-point discipline, the necessary check on over-reading a remez.',
            },
            {
              tag: 'Primary',
              text: '**Matthew 13** — Jesus’ block of "the kingdom of heaven is like…" parables, and his own statement about why he teaches this way.',
            },
          ],
        },
        {
          type: 'honesty',
          text: [
            'The **PaRDeS** acronym is medieval — it takes its fourfold shape in rabbinic and kabbalistic tradition roughly a thousand years after Jesus, so presenting it as _the_ first-century system is anachronistic. What is genuinely ancient is the practice underneath it: teaching by allusion to Scripture, and learning by discovery. Take the four levels as a useful lens, not a first-century rulebook.',
            'BEMA is candid that the method is loose and easy to over-structure, and that any given remez is arguable — this is not a Bible code that yields one secret answer. The safeguard is the same as in _Parable Structure_: the plain sense first, the deeper reading held with humility, and the wrestling done in community.',
          ],
        },
      ],
    },
  ],
}
