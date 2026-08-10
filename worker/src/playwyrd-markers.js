const FIRESTORE_BASE =
  "https://firestore.googleapis.com/v1/projects/playwyrd/databases/(default)/documents/metadata/card_data/factions";
const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_SNAPSHOT_BYTES = 1_000_000;

const FACTION_DOCUMENTS = Object.freeze({
  arcanists: "Arcanists",
  bayou: "Bayou",
  explorers_society: "Explorer's Society",
  guild: "Guild",
  neverborn: "Neverborn",
  outcasts: "Outcasts",
  resurrectionists: "Resurrectionist",
  ten_thunders: "Ten Thunders",
});

const MODEL_ALIASES = Object.freeze({
  doppleganger: "Doppelganger",
  "keepside-stangers": "KeepsideStrangers",
});

function compactText(value) {
  return String(value ?? "").trim().replace(/\s+/gu, " ");
}

function identity(value) {
  return compactText(value)
    .normalize("NFKD")
    .replace(/[’‘]/gu, "'")
    .replace(/[^a-z0-9]+/giu, "")
    .toLowerCase();
}

function modelIdentity(name, title) {
  return compactText(`${name || ""} ${title || ""}`)
    .normalize("NFKD")
    .replace(/[’‘]/gu, "'")
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((part) => part && part !== "the")
    .join("");
}

function firestoreValue(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 16) return null;
  if (Object.hasOwn(value, "stringValue")) return value.stringValue;
  if (Object.hasOwn(value, "booleanValue")) return value.booleanValue;
  if (Object.hasOwn(value, "integerValue")) return Number(value.integerValue);
  if (Object.hasOwn(value, "doubleValue")) return Number(value.doubleValue);
  if (Object.hasOwn(value, "nullValue")) return null;
  if (value.arrayValue) {
    return (value.arrayValue.values || []).map((item) => firestoreValue(item, depth + 1));
  }
  if (value.mapValue) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, item]) => [
        key,
        firestoreValue(item, depth + 1),
      ]),
    );
  }
  return null;
}

async function boundedJson(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Play Wyrd returned an empty response");

  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_SNAPSHOT_BYTES) {
      await reader.cancel();
      throw new Error("Play Wyrd response is too large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return JSON.parse(new TextDecoder().decode(bytes));
}

function normalizedModels(payload) {
  const models = firestoreValue(payload?.fields?.models);
  if (!models || typeof models !== "object") {
    throw new Error("Play Wyrd snapshot has no models");
  }

  return Object.values(models)
    .map((model) => ({
      id: compactText(model?.id),
      name: compactText(model?.name),
      title: compactText(model?.title),
      text: String(model?.text ?? ""),
    }))
    .filter((model) => model.id && model.name && model.text);
}

async function readEntry(env, key) {
  if (!env.BIGGERHAT_CACHE) return null;
  try {
    return await env.BIGGERHAT_CACHE.get(key, "json");
  } catch {
    return null;
  }
}

async function storeEntry(env, key, entry) {
  if (!env.BIGGERHAT_CACHE) return;
  await env.BIGGERHAT_CACHE.put(key, JSON.stringify(entry));
}

async function fetchSnapshot(env, faction, documentName) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${FIRESTORE_BASE}/${encodeURIComponent(documentName)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Play Wyrd returned ${response.status}`);
    const payload = await boundedJson(response);
    const entry = {
      faction,
      fetchedAt: Date.now(),
      models: normalizedModels(payload),
    };
    await storeEntry(env, `playwyrd:v1:${faction}`, entry);
    return entry;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadSnapshot(env, faction) {
  const documentName = FACTION_DOCUMENTS[faction];
  if (!documentName) return null;

  const key = `playwyrd:v1:${faction}`;
  const cached = await readEntry(env, key);
  if (cached && Date.now() - Number(cached.fetchedAt || 0) < SNAPSHOT_TTL_MS) {
    return cached;
  }

  try {
    return await fetchSnapshot(env, faction, documentName);
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

function findModel(models, character) {
  const aliasId = MODEL_ALIASES[compactText(character?.slug).toLowerCase()];
  if (aliasId) {
    const alias = models.find((model) => model.id === aliasId);
    if (alias) return alias;
  }

  const combined = modelIdentity(character?.name, character?.title);
  if (!combined) return null;

  const combinedMatches = models.filter(
    (model) => modelIdentity(model.name, model.title) === combined,
  );
  if (combinedMatches.length === 1) return combinedMatches[0];

  const name = identity(character?.name);
  const title = identity(character?.title);

  const nameMatches = models.filter((model) => identity(model.name) === name);
  const exact = nameMatches.find((model) => identity(model.title) === title);
  if (exact) return exact;
  return nameMatches.length === 1 ? nameMatches[0] : null;
}

function escapedName(value) {
  return compactText(value)
    .replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
    .replace(/[’']/gu, "['’]")
    .replace(/\s+/gu, "\\s+");
}

export function markersForAction(cardText, actionName) {
  const namePattern = escapedName(actionName);
  if (!namePattern) return { isSignature: false, stoneCost: 0 };

  const header = new RegExp(
    `(?:^|\\s)((?:[fs]\\s*){1,2})${namePattern}(?=\\s+(?:(?:[qyp])?\\d|[-]))`,
    "iu",
  );
  const match = String(cardText || "").match(header);
  const markers = compactText(match?.[1]).replace(/\s+/gu, "").toLowerCase();
  return {
    isSignature: markers.includes("f"),
    stoneCost: markers.includes("s") ? 1 : 0,
  };
}

export async function enrichCharacterMarkers(character, env) {
  const faction = compactText(character?.faction || character?.faction_label).toLowerCase();
  if (!FACTION_DOCUMENTS[faction] || !Array.isArray(character?.actions)) return character;

  let snapshot;
  try {
    snapshot = await loadSnapshot(env, faction);
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: "playwyrd_snapshot_unavailable",
        faction,
        message: String(error?.message || "unknown").slice(0, 160),
      }),
    );
    return character;
  }

  const model = findModel(snapshot.models || [], character);
  if (!model) return character;

  let enrichedActions = 0;
  const actions = character.actions.map((action) => {
    const markers = markersForAction(model.text, action?.name);
    const isSignature = Boolean(action?.is_signature) || markers.isSignature;
    const stoneCost = Math.max(Number(action?.stone_cost) || 0, markers.stoneCost);
    if (
      isSignature === Boolean(action?.is_signature) &&
      stoneCost === Number(action?.stone_cost || 0)
    ) {
      return action;
    }
    enrichedActions += 1;
    return {
      ...action,
      is_signature: isSignature,
      stone_cost: stoneCost,
      marker_source: "playwyrd",
    };
  });

  if (!enrichedActions) return character;
  return {
    ...character,
    actions,
    marker_metadata: {
      provider: "Play Wyrd",
      modelId: model.id,
      faction,
      fetchedAt: new Date(snapshot.fetchedAt).toISOString(),
      enrichedActions,
    },
  };
}
