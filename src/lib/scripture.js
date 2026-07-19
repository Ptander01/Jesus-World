// scripture.js
// Client for bible-api.com (World English Bible — public domain), the same source
// passion-reading.json's verses were fetched from. Every `ref` field in
// gospels-data.json ("Matt 3:13-17; Mark 1:9-11") is accepted by the API verbatim —
// no abbreviation normalization needed, verified against all ref styles in the data.

const CACHE_KEY = "jw-scripture-cache-v1";
const memCache = new Map();

function loadDiskCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDiskCache(cache) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // sessionStorage full or unavailable — in-memory cache still works this session
  }
}

// A `ref` field is one or more passages joined with "; ", one per attesting Gospel
// ("Matt 3:13-17; Mark 1:9-11"). Split into the individual citations.
export function splitRefs(ref) {
  return (ref ?? "")
    .split(";")
    .map((r) => r.trim())
    .filter(Boolean);
}

// Fetches one passage. Returns { reference, text, verses: [{verse, text}] }.
// Throws on network/API failure — callers render the error state.
export async function fetchPassage(ref) {
  if (memCache.has(ref)) return memCache.get(ref);

  const disk = loadDiskCache();
  if (disk[ref]) {
    memCache.set(ref, disk[ref]);
    return disk[ref];
  }

  const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=web`);
  if (!res.ok) throw new Error(`bible-api ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  const passage = {
    reference: data.reference,
    text: data.text?.trim() ?? "",
    verses: (data.verses ?? []).map((v) => ({ verse: v.verse, text: v.text?.trim() ?? "" })),
  };

  memCache.set(ref, passage);
  disk[ref] = passage;
  saveDiskCache(disk);
  return passage;
}

// Fetches every passage in a multi-ref string in parallel. Individual failures
// don't sink the whole request — each entry carries its own ok/error state so the
// UI can show the passages that loaded even if one citation didn't resolve.
export async function fetchPassages(ref) {
  const refs = splitRefs(ref);
  return Promise.all(
    refs.map(async (r) => {
      try {
        return { ref: r, ok: true, passage: await fetchPassage(r) };
      } catch (err) {
        return { ref: r, ok: false, error: err.message };
      }
    })
  );
}
