// Second Temple Judaism. Draws on BEMA's Session 3 arc — ep. 73 (intro), ep. 74
// (Silent Years: Synagogue), ep. 75 (Welcome to Hellenism) — plus the standard
// primary sources. Synthesis in the app's voice; the episodes are cited in the
// closing section, not reproduced.

export default {
  slug: 'second-temple-judaism',
  eyebrow: 'Context · The World Behind the Text',
  title: ['Second Temple ', 'Judaism'],
  standfirst:
    'The four centuries between Malachi and Matthew are not silent. They are where the words Jesus will use — Messiah, kingdom, the people of God — get their first-century meaning.',
  sections: [
    {
      id: 'after-the-exile',
      heading: 'After the Exile',
      sub: 'A people restored to the land, but not to a throne',
      blocks: [
        {
          type: 'p',
          text: 'The Old Testament ends with a people back in the land but not in charge of it. The exile to Babylon broke something the return under Persia did not repair: there is a rebuilt temple but no king, a homeland but a foreign governor, and the prophets falling quiet.',
        },
        {
          type: 'callout',
          label: 'The question underneath everything',
          text: 'How do you stay faithful to God’s covenant when someone else’s empire runs your land, taxes your crops, and garrisons your capital? Every party, every movement, and every revolt in this period is an answer to that one question.',
        },
        {
          type: 'p',
          text: 'With prophecy quiet, the centre of gravity shifts to the **Torah** and to the scribes who study and apply it. Being God’s people becomes, more and more, a matter of how you live — Sabbath, food, purity, the festivals — when the Temple is far off and the nation is not free.',
        },
      ],
    },
    {
      id: 'the-synagogue',
      heading: 'The Synagogue',
      sub: 'What carried Jewish life when the Temple was far away',
      blocks: [
        {
          type: 'p',
          text: 'The institution that holds Jewish life together through this period barely appears in the Old Testament: the **synagogue**. A local gathering — ten households were enough — for reading Torah, prayer, and teaching. Portable, un-centralised, and present everywhere Jews lived.',
        },
        {
          type: 'p',
          text: 'It is also the room most of Jesus’ recorded teaching happens in. "He entered, as was his custom, into the synagogue on the Sabbath day" is Luke’s shorthand for a pattern. When the Gospels show him handed a scroll, standing to read and sitting to comment, that is ordinary synagogue practice — and the argument that follows is a synagogue argument.',
        },
        {
          type: 'p',
          text: 'BEMA 74, "Silent Years: Synagogue," walks through how the institution formed and what it assumed about the people in the room.',
        },
      ],
    },
    {
      id: 'welcome-to-hellenism',
      heading: 'Welcome to Hellenism',
      sub: 'Alexander’s longer conquest — of language and imagination',
      blocks: [
        {
          type: 'p',
          text: 'Alexander the Great died in 323 BC having conquered from Greece to India, and the longer conquest was cultural. **Hellenism** — the Greek language, the gymnasium, the Greek way of framing a question — became the water everyone swam in. For Jews it forced a running argument: how much of this do we take on, and where is the line?',
        },
        {
          type: 'p',
          text: 'The crisis came under Antiochus IV, who in 167 BC banned circumcision and the Sabbath and set up a pagan altar in the Temple itself. The **Maccabean revolt** that followed won a rare stretch of independence — the memory behind Hanukkah, and behind the hope, still alive in Jesus’ day, that God would again drive out an occupier.',
        },
        {
          type: 'p',
          text: 'BEMA 75, "Welcome to Hellenism," covers the pressure to assimilate and the fault line it opened inside the nation.',
        },
      ],
    },
    {
      id: 'four-parties-one-question',
      heading: 'Four Parties, One Question',
      sub: 'Pharisees, Sadducees, Essenes, Zealots',
      blocks: [
        {
          type: 'p',
          text: 'By the first century the answers had hardened into groups. Josephus lists them; the Gospels assume you already know them.',
        },
        {
          type: 'compare',
          items: [
            {
              label: 'Pharisees',
              text: 'Take the Temple’s holiness home with you. Extend priestly purity to the ordinary table and the ordinary day, through careful application of Torah. Popular, lay-led — and the group Jesus argues with most, often because they are closest.',
            },
            {
              label: 'Sadducees',
              text: 'Work the system from inside. The priestly aristocracy who ran the Temple and dealt with Rome. Conservative on the text, sceptical of resurrection and angels, invested in the arrangement that kept them in place.',
            },
            {
              label: 'Essenes',
              text: 'Withdraw and wait. Judge the Temple establishment corrupt, pull back to the desert, keep themselves pure, and expect God to settle accounts soon.',
            },
            {
              label: 'Zealots',
              text: 'Drive them out. God alone is king, so tribute to Caesar is treason against God. The armed-resistance answer — which gets its war in AD 66 and its ending at Masada.',
            },
          ],
        },
        {
          type: 'p',
          text: 'Jesus fits none of the four cleanly, and that is part of why he is heard as dangerous. He shares the Pharisees’ seriousness about Torah and their hope of resurrection, keeps company the Essenes would never touch, threatens the Sadducees’ Temple directly, and talks about a kingdom without picking up the Zealots’ sword.',
        },
      ],
    },
    {
      id: 'sources',
      heading: 'Sources',
      sub: 'Where this study comes from, and how to hold it',
      blocks: [
        {
          type: 'sources',
          items: [
            {
              tag: 'BEMA',
              text: '**BEMA Podcast**, Session 3 — ep. 73 (intro), ep. 74 ("Silent Years: Synagogue"), ep. 75 ("Welcome to Hellenism"). Transcripts and slides are linked from each episode page.',
            },
            {
              tag: 'Primary',
              text: '**1 & 2 Maccabees** for the revolt; **Josephus**, _Antiquities_ and _Jewish War_, for the parties and the politics.',
            },
            {
              tag: 'Further',
              text: 'The Dead Sea Scrolls — the Essenes (or a group very like them) in their own words.',
            },
          ],
        },
        {
          type: 'honesty',
          text: [
            'BEMA reads the first century through a strongly Hebraic, Second-Temple lens, drawing on teachers like Ray Vander Laan. It is a rich frame, and it is _one_ frame — some of its specific claims are contested by other scholars. Hold it alongside the primary sources, not above them.',
            'The four-party sketch is a simplification too. Most first-century Jews belonged to no party at all, and the lines between the groups were blurrier than a list makes them look.',
          ],
        },
      ],
    },
  ],
}
