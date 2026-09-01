// Roman Occupation. Synthesis in the app's voice; leans on BEMA's Roman-context
// sessions and on Josephus, cited at the end.

export default {
  slug: 'roman-occupation',
  eyebrow: 'Context · The World Behind the Text',
  title: ['Roman ', 'Occupation'],
  standfirst:
    'Every Gospel scene sits under an occupation: client kings, a standing army, a tax system, and a method of execution designed to be watched.',
  sections: [
    {
      id: 'client-kings-and-prefects',
      heading: 'Client Kings and Prefects',
      sub: 'How Rome actually governed Judea and Galilee',
      blocks: [
        {
          type: 'p',
          text: 'Rome rarely governed a place like Judea directly if it could avoid it. The cheaper method was a **client king**: a local strongman who kept order, collected the taxes, and stayed loyal, in exchange for a crown and a free hand at home. Herod the Great was that man for a generation — which is how the same reign could build the Temple Mount and murder his own sons.',
        },
        {
          type: 'p',
          text: 'At Herod’s death in 4 BC the kingdom was split among his sons. **Antipas** took Galilee and Perea and ruled them for Jesus’ entire lifetime — the "Herod" of the ministry, the one who executed John the Baptist. Judea and Samaria went to Archelaus, who was removed by Rome in AD 6 in favour of direct rule by a **prefect**. **Pontius Pilate** held that post from about AD 26 to 36, working hand in glove with the high-priestly families who ran the Temple.',
        },
        {
          type: 'callout',
          label: 'The census',
          text: 'Luke opens the nativity with a registration "when Quirinius was governor of Syria." Whatever its precise date, the point is unmissable to a first-century reader: the family is on the road because an empire is counting them in order to tax them. Jesus is born into a bureaucratic act of ownership.',
        },
      ],
    },
    {
      id: 'the-weight-of-empire',
      heading: 'The Weight of Empire',
      sub: 'What occupation cost, day to day',
      blocks: [
        { type: 'p', text: 'Occupation was not mainly soldiers in the street. It was money.' },
        {
          type: 'list',
          items: [
            '**Tribute** — a land tax and a head tax owed to Rome, on top of the tithes owed to the Temple. "Is it lawful to pay taxes to Caesar?" is a live and dangerous question, not a riddle.',
            '**Tax farmers** — Rome sold the right to collect. The collector paid Rome up front and kept whatever more he could squeeze. That is why "tax collector" stands next to "sinner" as a category — a Jew working for the occupier and profiting off his neighbours.',
            '**The army and the roads** — a standing military presence, the right to conscript a civilian to carry a load for one mile (hence "go with him two"), and a road network built for legions and trade alike.',
            '**Patronage** — the whole society ran on obligation between patron and client, honour given upward and favour handed down. Rome sat at the top of that pyramid.',
          ],
        },
      ],
    },
    {
      id: 'the-cross-as-state-terror',
      heading: 'The Cross as State Terror',
      sub: 'Why "King of the Jews" is a capital charge',
      blocks: [
        {
          type: 'p',
          text: '**Crucifixion** was not Rome’s ordinary execution. It was a public, drawn-out death used mainly for rebels, runaway slaves, and provincials who challenged Roman order — staged on a road, outside the city, to be seen for as long as possible.',
        },
        {
          type: 'p',
          text: 'The charge fixed above Jesus’ head — "King of the Jews" — is written in the language of sedition. Pilate is not making a theological statement; he is posting the crime. A man acclaimed as a king, talking about a kingdom, with a crowd behind him, is exactly the profile Rome crucified people to deter.',
        },
        {
          type: 'p',
          text: 'This is why the kingdom language in the Gospels carries a charge the modern ear misses. "The kingdom of God is at hand" is good news — and in an occupied province it also lands like a challenge.',
        },
        {
          type: 'xlinks',
          items: [{ label: 'Context · The Kingdom of God', href: '#/context/kingdom-of-god' }],
        },
      ],
    },
    {
      id: 'sources',
      heading: 'Sources',
      sub: 'Where this study comes from',
      blocks: [
        {
          type: 'sources',
          items: [
            {
              tag: 'BEMA',
              text: '**BEMA Podcast** — the sessions on Roman rule, Herod, and the political world of the ministry.',
            },
            {
              tag: 'Primary',
              text: '**Josephus**, _Jewish War_ books 1–2 — Herod, the prefects, and the road to revolt.',
            },
            {
              tag: 'Further',
              text: 'Any standard New Testament backgrounds volume for the provincial tax system and Roman administration.',
            },
          ],
        },
        {
          type: 'honesty',
          text: [
            'Reconstructing everyday life under Rome leans on elite written sources plus archaeology; the texture of an ordinary Galilean’s year is partly inference. Where this study fills a gap, it is a reasoned guess, not a record.',
            '"State terror" is a modern phrase for an ancient practice. It fits the evidence for how Rome used crucifixion — but the term is ours.',
          ],
        },
      ],
    },
  ],
}
