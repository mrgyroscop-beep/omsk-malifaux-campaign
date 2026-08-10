import { enrichCharacterMarkers } from "./playwyrd-markers.js";

const UPSTREAM_BASE = "https://biggerhat.net/api/v1";
const MAX_RESPONSE_BYTES = 2_000_000;
const LIST_TTL_MS = 6 * 60 * 60 * 1000;
const KEYWORD_TTL_MS = 24 * 60 * 60 * 1000;
const DETAIL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;

function normalizedTarget(url) {
  const relative = url.pathname.replace(/^\/api\/biggerhat\/v1\/?/u, "");
  const match = relative.match(/^(characters|keywords)(?:\/([a-z0-9-]+))?$/u);
  if (!match || (match[1] === "keywords" && match[2])) return null;
  if (match[2] && !SLUG_RE.test(match[2])) return null;

  const parameters = new URLSearchParams();
  if (!match[2]) {
    const page = Number(url.searchParams.get("page") || 1);
    const perPage = Number(url.searchParams.get("per_page") || 100);
    const gameMode = url.searchParams.get("game_mode_type") || "standard";
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > 20 ||
      perPage !== 100 ||
      gameMode !== "standard"
    ) {
      return null;
    }
    parameters.set("game_mode_type", "standard");
    parameters.set("page", String(page));
    parameters.set("per_page", "100");
  }

  const path = `${match[1]}${match[2] ? `/${match[2]}` : ""}`;
  const query = parameters.toString();
  return {
    path,
    url: `${UPSTREAM_BASE}/${path}${query ? `?${query}` : ""}`,
    cacheKey: `biggerhat:${match[2] ? "v2" : "v1"}:${path}${query ? `?${query}` : ""}`,
    characterSlug: match[1] === "characters" ? match[2] || "" : "",
    ttl:
      match[2] ? DETAIL_TTL_MS : match[1] === "keywords" ? KEYWORD_TTL_MS : LIST_TTL_MS,
  };
}

function cachedResponse(entry, state) {
  return new Response(entry.body, {
    status: entry.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "X-BiggerHat-Cache": state,
      "X-BiggerHat-Fetched-At": new Date(entry.fetchedAt).toISOString(),
    },
  });
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

async function fetchUpstream(target, env, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(target.url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "omsk-malifaux-campaign/1.0 (+GitHub Pages)",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`BiggerHat returned ${response.status}`);
    let body = await response.text();
    if (body.length > MAX_RESPONSE_BYTES) throw new Error("BiggerHat response is too large");
    const payload = JSON.parse(body);
    if (target.characterSlug && payload?.data) {
      payload.data = await enrichCharacterMarkers(payload.data, env);
      body = JSON.stringify(payload);
    }
    const entry = { fetchedAt: Date.now(), status: 200, body };
    if (options.waitUntil) {
      options.waitUntil(storeEntry(env, target.cacheKey, entry));
    } else {
      await storeEntry(env, target.cacheKey, entry);
    }
    return entry;
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleBiggerHat(request, env, context = {}) {
  const target = normalizedTarget(new URL(request.url));
  if (!target) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const cached = await readEntry(env, target.cacheKey);
  if (cached && Date.now() - Number(cached.fetchedAt || 0) < target.ttl) {
    return cachedResponse(cached, "HIT");
  }

  if (cached && context.waitUntil) {
    context.waitUntil(fetchUpstream(target, env).catch(() => undefined));
    return cachedResponse(cached, "STALE");
  }

  try {
    const fresh = await fetchUpstream(target, env, {
      waitUntil: context.waitUntil?.bind(context),
    });
    return cachedResponse(fresh, cached ? "REFRESH" : "MISS");
  } catch {
    if (cached) return cachedResponse(cached, "STALE");
    return Response.json(
      { error: "biggerhat_unavailable" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store", "Retry-After": "60" },
      },
    );
  }
}

async function warmCollection(env, collection) {
  const firstUrl = new URL(`${UPSTREAM_BASE}/${collection}`);
  firstUrl.searchParams.set("game_mode_type", "standard");
  firstUrl.searchParams.set("page", "1");
  firstUrl.searchParams.set("per_page", "100");
  const firstTarget = normalizedTarget(
    new URL(firstUrl.href.replace(UPSTREAM_BASE, "https://worker.invalid/api/biggerhat/v1")),
  );
  const first = await fetchUpstream(firstTarget, env);
  const lastPage = Math.min(20, Math.max(1, Number(JSON.parse(first.body)?.meta?.last_page || 1)));

  for (let page = 2; page <= lastPage; page += 1) {
    const pageUrl = new URL(firstUrl);
    pageUrl.searchParams.set("page", String(page));
    const target = normalizedTarget(
      new URL(pageUrl.href.replace(UPSTREAM_BASE, "https://worker.invalid/api/biggerhat/v1")),
    );
    await fetchUpstream(target, env);
  }
}

export async function refreshBiggerHatCache(env) {
  if (!env.BIGGERHAT_CACHE) return;
  await warmCollection(env, "characters");
  await warmCollection(env, "keywords");
}
