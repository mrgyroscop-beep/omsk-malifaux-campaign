(() => {
  "use strict";

  const SOURCE_API_BASE = "https://biggerhat.net/api/v1";
  const PROXY_API_BASE =
    document.querySelector('meta[name="biggerhat-api-url"]')?.content.trim().replace(/\/+$/u, "") ||
    "";
  const API_BASE =
    location.protocol === "file:" || !PROXY_API_BASE ? SOURCE_API_BASE : PROXY_API_BASE;
  const CATALOG_KEY = "m4e-biggerhat-catalog-v1";
  const DETAILS_KEY = "m4e-biggerhat-details-v2";
  const KEYWORDS_KEY = "m4e-biggerhat-keywords-v1";
  const CREW_UPGRADES_KEY = "m4e-biggerhat-crew-upgrades-v1";
  const CREW_UPGRADE_DETAILS_KEY = "m4e-biggerhat-crew-upgrade-details-v1";
  const PAGE_SIZE = 100;
  const DETAIL_CACHE_LIMIT = 50;
  const CATALOG_CACHE_TTL = 24 * 60 * 60 * 1000;
  const KEYWORDS_CACHE_TTL = 24 * 60 * 60 * 1000;

  let catalogMemory = null;
  let catalogPromise = null;
  let detailMemory = null;
  let keywordsMemory = null;
  let keywordsPromise = null;
  let crewUpgradesMemory = null;
  let crewUpgradesPromise = null;
  let crewUpgradeDetailMemory = null;

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      // The builder must keep working when storage is unavailable or full.
      return false;
    }
  }

  function compactText(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ");
  }

  function normalizeKeywords(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map((keyword) =>
        typeof keyword === "string"
          ? { id: null, name: compactText(keyword), slug: compactText(keyword).toLowerCase() }
          : {
              id: keyword?.id ?? null,
              name: compactText(keyword?.name),
              slug: compactText(keyword?.slug || keyword?.name).toLowerCase(),
            },
      )
      .filter((keyword) => keyword.name);
  }

  function normalizeKeyword(raw = {}) {
    const id = Number(raw.id);
    return {
      id: Number.isInteger(id) && id > 0 ? id : null,
      slug: compactText(raw.slug).toLowerCase(),
      gameModeType: compactText(raw.game_mode_type ?? raw.gameModeType).toLowerCase(),
      gameModeTypeLabel: compactText(
        raw.game_mode_type_label ?? raw.gameModeTypeLabel,
      ),
      name: compactText(raw.name),
      description: raw.description == null ? null : String(raw.description).trim(),
    };
  }

  function preferredMiniature(miniatures) {
    if (!Array.isArray(miniatures) || !miniatures.length) return null;
    const miniature =
      miniatures.find((item) => item?.version === "fourth_edition") || miniatures[0];
    return {
      id: miniature?.id ?? null,
      displayName: compactText(miniature?.display_name),
      frontImage: miniature?.front_image || null,
      backImage: miniature?.back_image || null,
      combinationImage: miniature?.combination_image || null,
      version: miniature?.version || null,
      versionLabel: miniature?.version_label || null,
    };
  }

  function nullableNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function normalizeSummary(raw = {}) {
    const name = compactText(raw.display_name || [raw.name, raw.title].filter(Boolean).join(", "));
    const keywords = normalizeKeywords(raw.keywords);
    const characteristics = Array.isArray(raw.characteristics)
      ? raw.characteristics.map(compactText).filter(Boolean)
      : [];

    return {
      id: raw.id ?? null,
      slug: compactText(raw.slug),
      gameModeType: compactText(raw.game_mode_type || "standard").toLowerCase(),
      name: compactText(raw.name),
      title: compactText(raw.title),
      displayName: name,
      nicknames: Array.isArray(raw.nicknames)
        ? raw.nicknames.map(compactText).filter(Boolean)
        : compactText(raw.nicknames)
          ? [compactText(raw.nicknames)]
          : [],
      faction: compactText(raw.faction).toLowerCase(),
      factionLabel: compactText(raw.faction_label || raw.faction),
      secondFaction: compactText(raw.second_faction).toLowerCase(),
      secondFactionLabel: compactText(raw.second_faction_label || raw.second_faction),
      station: compactText(raw.station).toLowerCase(),
      stationLabel: compactText(raw.station_label || raw.station),
      cost: nullableNumber(raw.cost),
      health: nullableNumber(raw.health),
      size: nullableNumber(raw.size),
      base: nullableNumber(raw.base),
      baseLabel: compactText(raw.base_label),
      defense: nullableNumber(raw.defense),
      defenseSuit: compactText(raw.defense_suit),
      willpower: nullableNumber(raw.willpower),
      willpowerSuit: compactText(raw.willpower_suit),
      speed: nullableNumber(raw.speed),
      count: nullableNumber(raw.count),
      isUnhirable: Boolean(raw.is_unhirable),
      isBeta: Boolean(raw.is_beta),
      generatesStone: Boolean(raw.generates_stone),
      keywords,
      characteristics,
      miniature: preferredMiniature(raw.miniatures),
    };
  }

  function normalizeTrigger(raw = {}) {
    return {
      id: raw.id ?? null,
      slug: compactText(raw.slug),
      name: compactText(raw.name),
      suits: compactText(raw.suits),
      stoneCost: nullableNumber(raw.stone_cost) || 0,
      description: String(raw.description ?? "").trim(),
    };
  }

  function normalizeAction(raw = {}) {
    return {
      id: raw.id ?? null,
      slug: compactText(raw.slug),
      name: compactText(raw.name),
      type: compactText(raw.type).toLowerCase(),
      typeLabel: compactText(raw.type_label || raw.type),
      isSignature: Boolean(raw.is_signature),
      stoneCost: nullableNumber(raw.stone_cost) || 0,
      range: compactText(raw.range),
      rangeType: compactText(raw.range_type).toLowerCase(),
      rangeTypeLabel: compactText(raw.range_type_label || raw.range_type),
      stat: compactText(raw.stat),
      statSuits: compactText(raw.stat_suits),
      statModifier: compactText(raw.stat_modifier),
      resistedBy: compactText(raw.resisted_by),
      resistedByLabel: compactText(raw.resisted_by_label || raw.resisted_by),
      targetNumber: compactText(raw.target_number),
      targetSuits: compactText(raw.target_suits),
      damage: compactText(raw.damage),
      description: String(raw.description ?? "").trim(),
      triggers: Array.isArray(raw.triggers) ? raw.triggers.map(normalizeTrigger) : [],
    };
  }

  function normalizeAbility(raw = {}) {
    return {
      id: raw.id ?? null,
      slug: compactText(raw.slug),
      name: compactText(raw.name),
      suits: compactText(raw.suits),
      defensiveAbilityType: compactText(raw.defensive_ability_type),
      stoneCost: nullableNumber(raw.costs_stone) || 0,
      description: String(raw.description ?? "").trim(),
    };
  }

  function normalizeDetail(raw = {}) {
    return {
      ...normalizeSummary(raw),
      actions: Array.isArray(raw.actions) ? raw.actions.map(normalizeAction) : [],
      abilities: Array.isArray(raw.abilities) ? raw.abilities.map(normalizeAbility) : [],
      fetchedAt: new Date().toISOString(),
      source: {
        provider: "BiggerHat",
        apiUrl: raw.slug
          ? `${SOURCE_API_BASE}/characters/${encodeURIComponent(raw.slug)}`
          : SOURCE_API_BASE,
      },
    };
  }

  function normalizeCrewUpgradeMaster(raw = {}) {
    return {
      id: raw.id ?? null,
      slug: compactText(raw.slug),
      displayName: compactText(
        raw.display_name || raw.displayName || [raw.name, raw.title].filter(Boolean).join(", "),
      ),
      station: compactText(raw.station).toLowerCase(),
      faction: compactText(raw.faction).toLowerCase(),
      factionLabel: compactText(raw.faction_label || raw.factionLabel || raw.faction),
    };
  }

  function normalizeCrewUpgradeSummary(raw = {}) {
    return {
      id: raw.id ?? null,
      slug: compactText(raw.slug),
      gameModeType: compactText(raw.game_mode_type || raw.gameModeType || "standard").toLowerCase(),
      name: compactText(raw.name),
      domain: compactText(raw.domain).toLowerCase(),
      faction: compactText(raw.faction).toLowerCase(),
      factionLabel: compactText(raw.faction_label || raw.factionLabel || raw.faction),
      description: String(raw.description ?? "").trim(),
      limitations: compactText(raw.limitations_label || raw.limitations),
      powerBarCount: nullableNumber(raw.power_bar_count ?? raw.powerBarCount),
      frontImage: raw.front_image || raw.frontImage || null,
      backImage: raw.back_image || raw.backImage || null,
      combinationImage: raw.combination_image || raw.combinationImage || null,
      keywords: normalizeKeywords(raw.keywords),
      masters: (Array.isArray(raw.characters)
        ? raw.characters
        : Array.isArray(raw.masters)
          ? raw.masters
          : [])
        .map(normalizeCrewUpgradeMaster)
        .filter((character) => character.slug && character.station === "master"),
    };
  }

  function normalizeCrewUpgradeDetail(raw = {}) {
    return {
      ...normalizeCrewUpgradeSummary(raw),
      actions: Array.isArray(raw.actions) ? raw.actions.map(normalizeAction) : [],
      abilities: Array.isArray(raw.abilities) ? raw.abilities.map(normalizeAbility) : [],
      triggers: Array.isArray(raw.triggers) ? raw.triggers.map(normalizeTrigger) : [],
      markers: (Array.isArray(raw.markers) ? raw.markers : [])
        .map((marker) => ({
          id: marker?.id ?? null,
          slug: compactText(marker?.slug),
          name: compactText(marker?.name),
          description: String(marker?.description ?? "").trim(),
        }))
        .filter((marker) => marker.name),
      tokens: (Array.isArray(raw.tokens) ? raw.tokens : [])
        .map((token) => ({
          id: token?.id ?? null,
          slug: compactText(token?.slug),
          name: compactText(token?.name),
          description: String(token?.description ?? "").trim(),
        }))
        .filter((token) => token.name),
      fetchedAt: new Date().toISOString(),
      source: {
        provider: "BiggerHat",
        apiUrl: raw.slug
          ? `${SOURCE_API_BASE}/upgrades/${encodeURIComponent(raw.slug)}`
          : SOURCE_API_BASE,
      },
    };
  }

  async function request(path, parameters = {}, options = {}) {
    const buildUrl = (base) => {
      const url = new URL(`${base}/${path.replace(/^\/+/, "")}`);
      Object.entries(parameters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          url.searchParams.set(key, String(value));
        }
      });
      return url;
    };

    const controller = new AbortController();
    const abortFromOutside = () => controller.abort();
    if (options.signal?.aborted) controller.abort();
    options.signal?.addEventListener("abort", abortFromOutside, { once: true });
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const fetchJson = async (base) => {
        const response = await fetch(buildUrl(base), {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) {
          const error = new Error(`BiggerHat responded with ${response.status}`);
          error.status = response.status;
          const retryAfter = Number(response.headers.get("Retry-After"));
          error.retryAfter =
            Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;
          throw error;
        }
        return response.json();
      };

      try {
        return await fetchJson(API_BASE);
      } catch (error) {
        const canFallbackFromLegacyProxy =
          error.status === 404 && /^upgrades(?:\/|$)/u.test(path);
        if (
          API_BASE === SOURCE_API_BASE ||
          controller.signal.aborted ||
          (error.status && error.status < 500 && !canFallbackFromLegacyProxy)
        ) {
          throw error;
        }
        return await fetchJson(SOURCE_API_BASE);
      }
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abortFromOutside);
    }
  }

  function getStoredCatalog() {
    const stored = readStorage(CATALOG_KEY, null);
    if (!stored || !Array.isArray(stored.items)) return null;
    return stored;
  }

  function catalogCacheIsFresh(catalog) {
    const savedAt = Date.parse(catalog?.savedAt || "");
    return Number.isFinite(savedAt) && Date.now() - savedAt < CATALOG_CACHE_TTL;
  }

  async function fetchCatalog(onProgress) {
    const first = await request("characters", {
      page: 1,
      per_page: PAGE_SIZE,
      game_mode_type: "standard",
    });
    const lastPage = Math.max(1, Number(first?.meta?.last_page || 1));
    const pages = [first];
    onProgress?.(1, lastPage);

    if (lastPage > 1) {
      for (let page = 2; page <= lastPage; page += 1) {
        const response = await request("characters", {
          page,
          per_page: PAGE_SIZE,
          game_mode_type: "standard",
        });
        pages.push(response);
        onProgress?.(page, lastPage);
      }
    }

    const unique = new Map();
    pages.forEach((page) => {
      (page?.data || []).forEach((character) => {
        const normalized = normalizeSummary(character);
        if (normalized.slug && normalized.gameModeType === "standard") {
          unique.set(normalized.slug, normalized);
        }
      });
    });

    const catalog = {
      savedAt: new Date().toISOString(),
      items: Array.from(unique.values()).sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "en"),
      ),
    };
    catalogMemory = catalog;
    writeStorage(CATALOG_KEY, catalog);
    return catalog;
  }

  async function loadCatalog(options = {}) {
    const { force = false, onProgress } = options;
    if (!force && catalogMemory && catalogCacheIsFresh(catalogMemory)) {
      return catalogMemory;
    }
    const stored = force ? null : getStoredCatalog();
    if (stored && catalogCacheIsFresh(stored)) {
      catalogMemory = stored;
      return stored;
    }
    if (catalogPromise) return catalogPromise;
    catalogPromise = fetchCatalog(onProgress)
      .catch((error) => {
        if (!stored) throw error;
        catalogMemory = stored;
        return stored;
      })
      .finally(() => {
        catalogPromise = null;
      });
    return catalogPromise;
  }

  function searchableText(character) {
    return [
      character.displayName,
      character.name,
      character.title,
      character.factionLabel,
      character.secondFactionLabel,
      character.stationLabel,
      ...(character.nicknames || []),
      ...character.keywords.map((keyword) => keyword.name),
    ]
      .join(" ")
      .toLocaleLowerCase("en");
  }

  async function searchCharacters(query, options = {}) {
    const { force = false, onProgress, limit = 50 } = options;
    const catalog = await loadCatalog({ force, onProgress });
    const terms = compactText(query)
      .toLocaleLowerCase("en")
      .split(" ")
      .filter(Boolean);
    return catalog.items
      .filter((character) => {
        const haystack = searchableText(character);
        return terms.every((term) => haystack.includes(term));
      })
      .slice(0, Math.max(1, limit));
  }

  function getStoredKeywords() {
    const stored = readStorage(KEYWORDS_KEY, null);
    if (!stored || !Array.isArray(stored.items)) return null;
    const items = stored.items
      .map(normalizeKeyword)
      .filter(
        (keyword) =>
          keyword.id &&
          keyword.name &&
          keyword.slug &&
          keyword.gameModeType === "standard",
      );
    if (!items.length) return null;
    return { ...stored, items };
  }

  function keywordCacheIsFresh(keywords) {
    const savedAt = Date.parse(keywords?.savedAt || "");
    return Number.isFinite(savedAt) && Date.now() - savedAt < KEYWORDS_CACHE_TTL;
  }

  async function fetchKeywords() {
    const first = await request("keywords", {
      page: 1,
      per_page: PAGE_SIZE,
      game_mode_type: "standard",
    });
    const lastPage = Math.max(1, Number(first?.meta?.last_page || 1));
    const pages = [first];
    for (let page = 2; page <= lastPage; page += 1) {
      pages.push(
        await request("keywords", {
          page,
          per_page: PAGE_SIZE,
          game_mode_type: "standard",
        }),
      );
    }

    const unique = new Map();
    pages.forEach((page) => {
      (page?.data || []).forEach((keyword) => {
        const normalized = normalizeKeyword(keyword);
        if (
          normalized.id &&
          normalized.name &&
          normalized.slug &&
          normalized.gameModeType === "standard"
        ) {
          unique.set(normalized.slug, normalized);
        }
      });
    });
    if (!unique.size) throw new Error("BiggerHat returned an empty keyword catalog");

    const keywords = {
      savedAt: new Date().toISOString(),
      items: Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, "en")),
    };
    keywordsMemory = keywords;
    writeStorage(KEYWORDS_KEY, keywords);
    return keywords;
  }

  async function loadKeywords(options = {}) {
    if (!options.force && keywordsMemory && keywordCacheIsFresh(keywordsMemory)) {
      return keywordsMemory;
    }
    const stored = options.force ? null : getStoredKeywords();
    if (stored && keywordCacheIsFresh(stored)) {
      keywordsMemory = stored;
      return stored;
    }
    if (keywordsPromise) return keywordsPromise;
    keywordsPromise = fetchKeywords()
      .catch((error) => {
        if (!stored) throw error;
        keywordsMemory = stored;
        return stored;
      })
      .finally(() => {
        keywordsPromise = null;
      });
    return keywordsPromise;
  }

  async function searchKeywords(query, options = {}) {
    const keywords = await loadKeywords({ force: options.force });
    const terms = compactText(query)
      .toLocaleLowerCase("en")
      .split(" ")
      .filter(Boolean);
    return keywords.items
      .filter((keyword) => {
        const haystack = `${keyword.name} ${keyword.slug}`.toLocaleLowerCase("en");
        return terms.every((term) => haystack.includes(term));
      })
      .slice(0, Math.max(1, options.limit || 12));
  }

  function loadDetailMemory() {
    if (detailMemory) return detailMemory;
    const stored = readStorage(DETAILS_KEY, {});
    detailMemory = stored && typeof stored === "object" ? stored : {};
    return detailMemory;
  }

  function cacheDetail(detail) {
    const cache = loadDetailMemory();
    cache[detail.slug] = { savedAt: Date.now(), detail };
    const entries = Object.entries(cache)
      .sort(([, a], [, b]) => Number(b?.savedAt || 0) - Number(a?.savedAt || 0))
      .slice(0, DETAIL_CACHE_LIMIT);
    detailMemory = Object.fromEntries(entries);
    writeStorage(DETAILS_KEY, detailMemory);
  }

  function getCachedCharacter(slug) {
    return loadDetailMemory()[slug]?.detail || null;
  }

  async function getCharacter(slug, options = {}) {
    const cleanSlug = compactText(slug);
    if (!cleanSlug) throw new Error("A character slug is required");
    if (!options.force) {
      const cached = getCachedCharacter(cleanSlug);
      if (cached) return cached;
    }
    const response = await request(
      `characters/${encodeURIComponent(cleanSlug)}`,
      {},
      { signal: options.signal },
    );
    const detail = normalizeDetail(response?.data || {});
    if (!detail.slug) throw new Error("BiggerHat returned an empty character");
    cacheDetail(detail);
    return detail;
  }

  function getStoredCrewUpgrades() {
    const stored = readStorage(CREW_UPGRADES_KEY, null);
    if (!stored || !Array.isArray(stored.items)) return null;
    const items = stored.items
      .map(normalizeCrewUpgradeSummary)
      .filter(
        (upgrade) =>
          upgrade.slug &&
          upgrade.name &&
          upgrade.domain === "crew" &&
          upgrade.gameModeType === "standard",
      );
    return items.length ? { ...stored, items } : null;
  }

  async function fetchCrewUpgrades(onProgress) {
    const first = await request("upgrades", {
      page: 1,
      per_page: PAGE_SIZE,
      game_mode_type: "standard",
      domain: "crew",
    });
    const lastPage = Math.max(1, Number(first?.meta?.last_page || 1));
    const pages = [first];
    onProgress?.(1, lastPage);
    for (let page = 2; page <= lastPage; page += 1) {
      pages.push(
        await request("upgrades", {
          page,
          per_page: PAGE_SIZE,
          game_mode_type: "standard",
          domain: "crew",
        }),
      );
      onProgress?.(page, lastPage);
    }
    const unique = new Map();
    pages.forEach((response) => {
      (response?.data || []).forEach((raw) => {
        const upgrade = normalizeCrewUpgradeSummary(raw);
        if (
          upgrade.slug &&
          upgrade.name &&
          upgrade.domain === "crew" &&
          upgrade.gameModeType === "standard"
        ) {
          unique.set(upgrade.slug, upgrade);
        }
      });
    });
    if (!unique.size) throw new Error("BiggerHat returned an empty Crew Card catalog");
    const catalog = {
      savedAt: new Date().toISOString(),
      items: Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, "en")),
    };
    crewUpgradesMemory = catalog;
    writeStorage(CREW_UPGRADES_KEY, catalog);
    return catalog;
  }

  async function loadCrewUpgrades(options = {}) {
    if (
      !options.force &&
      crewUpgradesMemory &&
      catalogCacheIsFresh(crewUpgradesMemory)
    ) {
      return crewUpgradesMemory;
    }
    const stored = options.force ? null : getStoredCrewUpgrades();
    if (stored && catalogCacheIsFresh(stored)) {
      crewUpgradesMemory = stored;
      return stored;
    }
    if (crewUpgradesPromise) return crewUpgradesPromise;
    crewUpgradesPromise = fetchCrewUpgrades(options.onProgress)
      .catch((error) => {
        if (!stored) throw error;
        crewUpgradesMemory = stored;
        return stored;
      })
      .finally(() => {
        crewUpgradesPromise = null;
      });
    return crewUpgradesPromise;
  }

  function loadCrewUpgradeDetailMemory() {
    if (crewUpgradeDetailMemory) return crewUpgradeDetailMemory;
    const stored = readStorage(CREW_UPGRADE_DETAILS_KEY, {});
    crewUpgradeDetailMemory = stored && typeof stored === "object" ? stored : {};
    return crewUpgradeDetailMemory;
  }

  function getCachedCrewUpgrade(slug) {
    return loadCrewUpgradeDetailMemory()[slug]?.detail || null;
  }

  function cacheCrewUpgradeDetail(detail) {
    const cache = loadCrewUpgradeDetailMemory();
    cache[detail.slug] = { savedAt: Date.now(), detail };
    crewUpgradeDetailMemory = Object.fromEntries(
      Object.entries(cache)
        .sort(([, a], [, b]) => Number(b?.savedAt || 0) - Number(a?.savedAt || 0))
        .slice(0, DETAIL_CACHE_LIMIT),
    );
    writeStorage(CREW_UPGRADE_DETAILS_KEY, crewUpgradeDetailMemory);
  }

  async function getCrewUpgrade(slug, options = {}) {
    const cleanSlug = compactText(slug);
    if (!cleanSlug) throw new Error("A Crew Card slug is required");
    if (!options.force) {
      const cached = getCachedCrewUpgrade(cleanSlug);
      if (cached) return cached;
    }
    const response = await request(
      `upgrades/${encodeURIComponent(cleanSlug)}`,
      {},
      { signal: options.signal },
    );
    const detail = normalizeCrewUpgradeDetail(response?.data || {});
    if (!detail.slug) throw new Error("BiggerHat returned an empty Crew Card");
    cacheCrewUpgradeDetail(detail);
    return detail;
  }

  function clearCatalogCache() {
    catalogMemory = null;
    try {
      localStorage.removeItem(CATALOG_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  }

  function clearDetailCache() {
    detailMemory = {};
    try {
      localStorage.removeItem(DETAILS_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  }

  window.BiggerHatCards = Object.freeze({
    apiBase: API_BASE,
    sourceApiBase: SOURCE_API_BASE,
    normalizeSummary,
    normalizeDetail,
    normalizeKeyword,
    normalizeCrewUpgradeSummary,
    normalizeCrewUpgradeDetail,
    loadCatalog,
    searchCharacters,
    loadKeywords,
    searchKeywords,
    getCharacter,
    getCachedCharacter,
    loadCrewUpgrades,
    getCrewUpgrade,
    getCachedCrewUpgrade,
    clearCatalogCache,
    clearDetailCache,
  });
})();
