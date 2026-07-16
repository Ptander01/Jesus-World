# Miracle & Parable Crosswalk — content drop reconciliation

Hand-built audit trail for the merge of the `Jesus-content` data drop into
`gospels-data.json`. Automated matching was attempted and **rejected**: both
ref-based and name-similarity matching produced false pairs (name similarity
paired *First Catch of Fish* with *Coin in the fish's mouth* on the word "fish",
and *Boy with a Spirit* with *Drives out an unclean spirit* on "spirit"). Every
row below is hand-checked.

## The 25-vs-33 gap — what it actually was

The drop's `HANDOFF.md` / `INTEGRATION.md` described the gap as "a counting-convention
gap, not a disagreement — dropping the 5 `optional` yields 28; the rest is
doublet-merging choices (e.g. treating the two blind-men or two feeding accounts
as one)."

**That explanation does not hold for the miracles.** The repo listed both feedings
separately and did not contain *Two Blind Men* at all, so no doublet merging was in
play. The real decomposition:

| | count |
|---|---|
| Shared by drop and repo | 24 |
| Repo-only (drop is missing it) | 1 — *Invalid healed at Bethesda*, John 5:1-15 |
| Drop-only (repo was missing it) | 9 — 5 substantive + 4 flagged `optional` |
| **Union** | **34** |

Check: drop 33 = 24 + 9. Repo 25 = 24 + 1. Union = 34.

The nine the repo lacked were a genuine content gap, not a convention — they include
*Calming the Storm* (Mark 4:35-41), *Woman with the Bleeding* (Mark 5:25-34) and
*Boy with a Spirit* (Mark 9:14-29).

The doublet-merging the drop describes is real, but it lives in the **parables** —
see the parable section below.

## Counting rule (adopted)

> **Individually narrated miracle accounts, counting synoptic parallels of a single
> event once. Union of both sources: 34.** Five borderline accounts carry
> `optional: true`; excluding them yields 29. The app displays all 34 by default.

`optional` marks accounts commonly merged or omitted by harmonists — retained as data
so the count rule stays visible and reversible rather than baked into the record set.

## Miracles — the 34

`type` in the drop is landed as **`miracleType`**: the repo's existing
`churchEvents.type` is the marker glyph (`founding`/`support`/`letter-received`/
`leadership`) consumed by `ChurchTrack.jsx` and is unrelated.

`band` is **not stored**. It is derived from `journeyId` (see below).

### Shared — 24 (enriched in place, repo record retained)

| repo id | drop id | miracleType | gospels | optional |
|---|---|---|---|---|
| `cana-first-sign` | `cana-wine` | nature | John | |
| `cana-officials-son` | `officials-son` | healing | John | |
| `capernaum-unclean-spirit` | `capernaum-demoniac` | exorcism | Mark, Luke | |
| `capernaum-peters-mother` | `peters-mother` | healing | Matthew, Mark, Luke | |
| `capernaum-leper` | `leper` | healing | Matthew, Mark, Luke | |
| `capernaum-paralytic` | `paralytic-roof` | healing | Matthew, Mark, Luke | |
| `capernaum-withered-hand` | `withered-hand` | healing | Matthew, Mark, Luke | |
| `capernaum-centurion` | `centurion-servant` | healing | Matthew, Luke | |
| `nain-widows-son` | `nain-son` | resurrection | Luke | |
| `gergesa-legion` | `gerasene` | exorcism | Matthew, Mark, Luke | |
| `capernaum-jairus` | `jairus` | resurrection | Matthew, Mark, Luke | |
| `bethsaida-5000` | `feeding-5000` | provision | Matthew, Mark, Luke, John | |
| `sea-walk-water` | `walk-water` | nature | Matthew, Mark, John | |
| `tyre-syrophoenician` | `syrophoenician` | exorcism | Matthew, Mark | |
| `decapolis-deaf` | `deaf-mute` | healing | Mark | |
| `decapolis-4000` | `feeding-4000` | provision | Matthew, Mark | |
| `bethsaida-blind` | `bethsaida-blind` | healing | Mark | |
| `capernaum-tax-fish` | `coin-fish` | nature | Matthew | ✓ |
| `jerusalem-blind-born` | `man-born-blind` | healing | John | |
| `bethany-lazarus` | `lazarus` | resurrection | John | |
| `samaria-ten-lepers` | `ten-lepers` | healing | Luke | |
| `jericho-bartimaeus` | `bartimaeus` | healing | Matthew, Mark, Luke | |
| `jerusalem-fig-tree` | `fig-tree` | nature | Matthew, Mark | |
| `gethsemane-ear` | `malchus-ear` | healing | Luke | |

### Repo-only — 1 (retained; absent from the drop)

| repo id | ref | miracleType | gospels |
|---|---|---|---|
| `jerusalem-bethesda` | John 5:1-15 | healing | John |

Fields assigned here rather than sourced from the drop. Uncontroversial: John alone
narrates the Bethesda sign.

### Drop-only — 9 (added as new `churchEvents` records)

`year` / `cityId` / `journeyId` assigned by hand against the repo's existing
chronology; the drop supplies no time or map anchor. Glyph `type: "support"`
matches the repo's convention for miracles (23 of 25 already use it).

| new repo id | ref | cityId | year | journeyId | miracleType | gospels | optional |
|---|---|---|---|---|---|---|---|
| `capernaum-first-catch` | Luke 5:1-11 | capernaum | 30.36 | period-2 | provision | Luke | |
| `sea-calm-storm` | Mark 4:35-41 | capernaum | 31.48 | period-2 | nature | Matthew, Mark, Luke | |
| `capernaum-bleeding-woman` | Mark 5:25-34 | capernaum | 31.64 | period-2 | healing | Matthew, Mark, Luke | |
| `capernaum-two-blind` | Matt 9:27-31 | capernaum | 31.66 | period-2 | healing | Matthew | ✓ |
| `capernaum-mute-demoniac` | Matt 9:32-34 | capernaum | 31.67 | period-2 | exorcism | Matthew | ✓ |
| `hermon-boy-spirit` | Mark 9:14-29 | mount-hermon | 32.36 | period-3 | exorcism | Matthew, Mark, Luke | |
| `perea-bent-woman` | Luke 13:10-17 | bethany-beyond-jordan | 33.00 | period-4 | healing | Luke | ✓ |
| `perea-dropsy` | Luke 14:1-6 | bethany-beyond-jordan | 33.01 | period-4 | healing | Luke | ✓ |
| `tiberias-second-catch` | John 21:1-14 | tiberias | 33.29 | period-6 | provision | John | |

Anchoring notes:

- `capernaum-first-catch` — Luke 5:1-11 sits beside the existing
  `Calls the first disciples` (Mark 1:16-20, 30.35). Mark's account carries no
  miracle; Luke's catch is the miracle. Placed at 30.36, adjacent, not merged.
- `sea-calm-storm` — the storm occurs on the crossing *to* Gergesa; placed at 31.48,
  just before `gergesa-legion` (31.5).
- `capernaum-bleeding-woman` — Mark interleaves this with Jairus (31.65); placed at
  31.64.
- `hermon-boy-spirit` — healed at the foot of the mountain immediately after
  `The Transfiguration` (mount-hermon, 32.35). The drop locates it at Caesarea
  Philippi; the repo's transfiguration node is `mount-hermon`, so it follows that.
- `perea-bent-woman` / `perea-dropsy` — the drop gives location "Perea", which has no
  city node. `bethany-beyond-jordan` is the repo's Perea node; both land just before
  `The rich young ruler` (33.02).
- `tiberias-second-catch` — **see the ref-overlap fix below.**

### Ref-overlap fix (one existing record edited)

The repo's `tiberias-restoration` ("Peter restored", category `encounter`) cited
**John 21:1-23**, which entirely contains the drop's *Second Catch of Fish*
(John 21:1-14). Adding the miracle without narrowing the encounter would cite the
same verses twice under two categories.

- `tiberias-restoration`: ref narrowed **John 21:1-23 → John 21:15-23** ("Feed my
  sheep" — the restoration proper). Category, year and label unchanged.
- `tiberias-second-catch`: new miracle at John 21:1-14, year 33.29 (just before the
  restoration at 33.3).

### Band ↔ period

The drop uses 5 bands; the repo has 6 periods. `band` is derived from `journeyId`,
never stored:

| band | journeyId | period |
|---|---|---|
| gold | `period-1` | Early Ministry |
| teal | `period-2` | Galilean Ministry |
| purple | `period-3` | Withdrawals |
| orange | `period-4` | Judea & Perea |
| red | `period-5` | Passion Week |
| *(none in drop)* | `period-6` | Resurrection |

The repo's `journeyId` wins on conflict — it is what the map, timeline and play loop
already run on. Three drop bands disagreed with the repo's periods:

| item | drop band | repo period | resolution |
|---|---|---|---|
| Feeding the 5,000 | purple | `period-2` (teal) | repo wins |
| Walking on Water | purple | `period-2` (teal) | repo wins |
| Second Catch of Fish | red | — | **`period-6`** — John 21 is post-resurrection; the drop has no band for it |

The drop's 5-band model had nowhere to put the Resurrection period, which is why
`band` is derived rather than stored.

## Parables — the 34

The repo's 19 all appear in the drop; the drop adds 13. The repo merged two doublets
that the drop splits — **this is the doublet-merging the drop's guide described, in
the parables rather than the miracles**:

| repo record | drop records | resolution |
|---|---|---|
| `The Hidden Treasure and the Pearl` | `Hidden Treasure` + `Pearl of Great Price` | split into 2 |
| `The Talents` (`gospels: "Matthew and Luke"`) | `The Talents` + `The Minas` | split into 2 — Matt 25 talents and Luke 19 minas are distinct accounts |

19 repo records = 21 drop-granularity records; + 13 new = **34**. One (`Sheep & Goats`)
carries `optional: true` — part parable, part judgment vision.

### theme → topic

The repo's 6 `theme` values map onto the drop's 7 `topic` values 1:1, except one split:

| repo theme | drop topic |
|---|---|
| Kingdom of Heaven | `kingdom` |
| Grace and the Lost | `lost` |
| Prayer and Humility | `prayer` |
| Wealth and Poverty | `money` |
| Watchfulness and Judgment | `readiness` |
| Discipleship and Mercy | `mercy` **+** `cost` (splits) |

The drop's 7 topics are adopted — finer-grained, and the radar gains a 7th axis.

**One categorisation conflict:** `The Workers in the Vineyard` / `Laborers in the
Vineyard` is `Grace and the Lost` in the repo and `cost` in the drop. The drop's
value is taken, for consistency with the other 33.

### gospels: string → array

The repo stored parable attestation as a **string**; the drop and `attestation.js`
expect an **array**. Conversion:

| repo string | array |
|---|---|
| `"Luke"` | `["Luke"]` |
| `"Matthew"` | `["Matthew"]` |
| `"Synoptics"` | `["Matthew","Mark","Luke"]` |
| `"Matthew and Luke"` | `["Matthew","Luke"]` |

### Parable time anchors

4 of the repo's 19 parables had no `occasion`, hence no year and no derivable band —
they would have dropped out of the heatmap and stream entirely. Every parable now
carries a `journeyId`: derived from `occasion.year` where present (authoritative),
otherwise mapped from the drop's `band`.

## Deferred — not part of this pass

The four visuals read only `name`, `miracleType`/`topic`, `band` and `gospels[]`
(verified against `lib/analysis.js`). These drop fields are therefore **not** merged:

- `location` — the drop's 17 location strings do not match the repo's 26 city-node
  names (`Sea of Galilee`, `Decapolis`, `Perea`, `Galilee`, `Judea`, `Samaria border`
  have no node; `Tyre & Sidon` is two nodes). The repo's `cityId` is already correct
  and authoritative. Only needed if miracles/parables go on the **map**.
- `region` — superseded by the repo's `provinces`.
- `phase` — the drop's `phases.js` has 9 harmony phases against the repo's 6 periods;
  no mapping attempted.
- `summary` — the repo's `sublabel` is already populated and tuned to the timeline UI.
