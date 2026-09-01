// Authorial Emphasis. The "read each Gospel vertically" method and the redaction
// framing are Fee & Stuart's, credited in Go Deeper. Scripture is the World
// English Bible (public domain).

export default {
  slug: 'authorial-emphasis',
  eyebrow: 'Context · How to Read a Gospel',
  title: ['Authorial ', 'Emphasis'],
  verse: {
    text: 'But these are written, that you may believe that Jesus is the Christ, the Son of God, and that believing you may have life in his name.',
    ref: 'John 20:31',
  },
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
          type: 'p',
          text: 'If the four Gospels differ because each writer is making a point, the next question is the obvious one: what is each writer’s point? Read a Gospel _vertically_ — straight through, on its own terms — and a distinct portrait comes into focus. None of the four is the "plain" version that the others decorate.',
        },
        {
          type: 'compare',
          items: [
            {
              label: 'Matthew',
              text: 'Jesus as the new Moses. Five teaching blocks echoing the five books of Torah, a mountain for the great sermon, "that it might be fulfilled" a dozen times over. For readers who need to see the whole Hebrew story converging here.',
            },
            {
              label: 'Mark',
              text: 'Urgency and the cross. "Immediately" some forty times; nearly half the book is the last week. No one is allowed to say plainly who Jesus is until he is on the cross — and the first person to get it right is the centurion who kills him.',
            },
            {
              label: 'Luke',
              text: 'The outsiders. Women, Samaritans, tax collectors, the poor and the sick — named and centred where the other accounts pass over them. Prayer and the Spirit frame every turn. A long, deliberate road to Jerusalem holds the middle of the book.',
            },
            {
              label: 'John',
              text: 'The signs and the "I am." Seven miracles, each a worked argument; seven "I am" sayings; a stated purpose — "that you may believe." No parables, no exorcisms, no transfiguration; a different set of episodes almost throughout.',
            },
          ],
        },
        {
          type: 'callout',
          label: 'The test',
          text: 'When two Gospels carry the same scene, the differences between them are not noise to average out. They are each writer telling you what he wants you to notice.',
        },
      ],
    },
    {
      id: 'reading-for-the-frame',
      tab: 'study',
      heading: 'Reading for the Frame',
      sub: 'What a writer adds, cuts, or moves tells you what he is after',
      blocks: [
        {
          type: 'p',
          text: '**Redaction** is the plain name for this move: comparing an episode across Gospels and watching what each writer adds, trims, or relocates. The edits are where the interpretation lives.',
        },
        {
          type: 'example',
          heading: 'The stilling of the storm',
          text: [
            'In Mark the disciples’ cry is a rebuke: "don’t you care that we are perishing?" Matthew changes it to a prayer — "Lord, save us!" — and sets the whole story inside a run of teaching on the cost of following.',
            'Same miracle. Mark uses it to expose fear; Matthew uses it to teach discipleship. Neither is wrong. Each is a choice.',
          ],
          refs: 'Mark 4:35–41 · Matthew 8:23–27',
        },
        {
          type: 'p',
          text: 'The danger runs the other way too: turning a difference of _emphasis_ into a claim of _contradiction_. Matthew’s Jesus and Mark’s Jesus are the same person seen from two angles. Hold both and the figure gains depth; force them to be identical and you flatten all four.',
        },
      ],
    },
    {
      id: 'the-lens-as-an-emphasis-map',
      tab: 'atlas',
      heading: 'The Lens as an Emphasis Map',
      sub: 'Seeing each writer’s priorities in the atlas',
      blocks: [
        { type: 'p', text: 'Two views in this atlas read straight off authorial emphasis.' },
        {
          type: 'xlinks',
          items: [
            { label: 'Open the Atlas — Gospel Lens', href: '#/' },
            { label: 'Charts · Gospel Signature', href: '#/visuals' },
          ],
        },
        { type: 'h', text: 'The Lens, as each writer’s selection' },
        {
          type: 'p',
          text: 'On the timeline, set the Lens to one Gospel and the flags that dim are the events that writer chose to leave out. Mark keeps almost everything except the birth and the resurrection appearances; John drops a third of the row. The gaps are not omissions to fix — they are the edit.',
        },
        { type: 'h', text: 'The Gospel Signature' },
        {
          type: 'p',
          text: 'The Charts page plots each Gospel against the ministry by theme — how much of Matthew is teaching, how much of Mark is miracle, where John concentrates. The four shapes are the four emphases at a glance.',
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
              text: '**How to Read the Bible for All Its Worth**, ch. 7 — the Evangelists as authors with a purpose, and how to read a Gospel "vertically."',
            },
            {
              tag: 'BEMA',
              text: '**BEMA Podcast** — the Gospel sessions on each writer’s audience and aim.',
            },
            {
              tag: 'Tool',
              text: 'A Gospel synopsis (Aland, or Throckmorton) — to see the edits laid side by side.',
            },
          ],
        },
        {
          type: 'honesty',
          text: [
            'How far a writer _shaped_ his material, and how freely, is a live scholarly question — from "he arranged eyewitness memory carefully" to "he composed with considerable freedom." This study stays on the modest end: real events, purposefully told.',
            'Either way the rule holds: emphasis is not contradiction. Read each Gospel for its own point before you make the four agree.',
          ],
        },
      ],
    },
  ],
}
