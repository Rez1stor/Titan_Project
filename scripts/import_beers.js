#!/usr/bin/env node
// Script: import_beers.js
// Fetch beers from an external catalog API and POST them to the local Titan_Project API.
// Usage:
// 1) npm install axios
// 2) Set environment variables and run: CATALOG_API_KEY=yourkey TARGET_API_BASE=http://127.0.0.1:5542 node scripts/import_beers.js
// Environment variables (defaults shown):
// - CATALOG_API_BASE (default: https://catalog.beer)
// - CATALOG_API_KEY (required)
// - TARGET_API_BASE (default: http://127.0.0.1:5542)
// - TOTAL (default: 1000)
// - PER_PAGE (default: 50)
// - DRY_RUN (if set to '1' will not POST to target API)

const axios = require('axios');

const EXTERNAL_BASE = process.env.CATALOG_API_BASE || 'https://catalog.beer';
const API_KEY = process.env.CATALOG_API_KEY || '4c7f79a2-ee1a-47c8-a410-d8eb16ce5c88';
const TARGET_BASE = process.env.TARGET_API_BASE || 'http://127.0.0.1:5542';
const TOTAL = Number(process.env.TOTAL || 10);
const PER_PAGE = Number(process.env.PER_PAGE || 50);
const DRY_RUN = process.env.DRY_RUN === '1';
const MIN_FILLED_RATIO = Number(process.env.MIN_FILLED_RATIO || 0.6);

const candidateEndpoints = ['/beers', '/v1/beers', '/api/beers', '/api/v1/beers', '/beers/search', '/products', '/items'];
const candidateAuthHeaders = [
  { Authorization: `Bearer ${API_KEY}` },
  { 'X-Api-Key': API_KEY },
  { 'x-api-key': API_KEY },
  { 'Api-Key': API_KEY },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function probeEndpoint() {
  console.log('Probing external API for a usable endpoint...');
  for (const ep of candidateEndpoints) {
    for (const hdr of candidateAuthHeaders) {
      try {
        const url = `${EXTERNAL_BASE.replace(/\/$/, '')}${ep}`;
        const res = await axios.get(url, { params: { page: 1, limit: 1 }, headers: hdr, timeout: 5000 });
        const data = res.data;
        // Acceptable if response contains an array or object with data/results
        if (Array.isArray(data) || data?.results || data?.data) {
          console.log(`Probed endpoint ${url} with header ${Object.keys(hdr)[0]} -> OK`);
          return { url, header: hdr, kind: Array.isArray(data) ? 'array' : 'object' };
        }
      } catch (err) {
        // ignore and continue
      }
    }
  }
  throw new Error('Could not find a usable endpoint on the external API. Please verify CATALOG_API_BASE and the API key.');
}

function extractItemsFromResponse(resData) {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData.results)) return resData.results;
  if (Array.isArray(resData.data)) return resData.data;
  // try common places
  if (Array.isArray(resData.items)) return resData.items;
  return [];
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toStringOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function countFilledFields(product) {
  const fields = [
    product.name,
    product.description,
    product.strengthAbv,
    product.beerStyle,
    product.beerIbu,
    product.beerSrm
  ];

  let filled = 0;
  for (const value of fields) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim().length === 0) continue;
    filled += 1;
  }

  return {
    filled,
    total: fields.length,
    ratio: fields.length === 0 ? 0 : filled / fields.length,
  };
}

function hasMajorityFields(product) {
  const metrics = countFilledFields(product);
  return metrics.ratio > 0.5 && metrics.ratio >= MIN_FILLED_RATIO;
}

function mapExternalToProduct(item) {
  // Best-effort mapping, adjust as necessary.
  const name = toStringOrNull(item.name || item.title || item.beer_name || item.productName);
  return {
    name,
    categoryName: 'Beer',
    description: toStringOrNull(item.description || item.style || item.taster_notes),
    imageUrl: toStringOrNull(item.image_url || item.image || item.labels?.medium),
    avgRating: toNumberOrNull(item.rating || item.avgRating || item.average_review),
    reviewsCount: toNumberOrNull(item.reviews_count || item.review_count || item.reviews),
    basePrice: toNumberOrNull(item.price || item.basePrice),
    strengthAbv: toNumberOrNull(item.abv || item.alcohol || item.alcohol_by_volume),
    beerStyle: toStringOrNull(item.style || item.beer_style),
    beerIbu: toNumberOrNull(item.ibu),
    beerSrm: toNumberOrNull(item.srm),
  };
}

async function postProduct(product) {
  const url = `${TARGET_BASE.replace(/\/$/, '')}/api/products`;
  try {
    if (DRY_RUN) {
      console.log('[DRY RUN] Would POST', product.name);
      return null;
    }
    const res = await axios.post(url, product, { headers: { 'Content-Type': 'application/json', 'X-User-Id': '1' }, timeout: 10000 });
    return res.data;
  } catch (err) {
    console.error('Failed to POST product', product.name, err.response?.status, err.response?.data || err.message);
    return null;
  }
}

async function fetchAndImport() {
  if (!API_KEY) {
    console.error('CATALOG_API_KEY is required.');
    process.exit(1);
  }

  const probe = await probeEndpoint();
  console.log('Using external URL:', probe.url);

  const collected = [];
  let page = 1;
  const perPage = PER_PAGE;

  while (collected.length < TOTAL) {
    try {
      const params = { page, limit: perPage };
      const res = await axios.get(probe.url, { params, headers: probe.header, timeout: 10000 });
      const items = extractItemsFromResponse(res.data);
      if (!items || items.length === 0) {
        console.log('No more items returned from external API, stopping.');
        break;
      }

      for (const it of items) {
        if (collected.length >= TOTAL) break;
        collected.push(it);
      }

      console.log(`Fetched page ${page}, items: ${items.length}, total collected: ${collected.length}`);
      page += 1;
      await sleep(200); // be nice
    } catch (err) {
      console.error('Error fetching page', page, err.message || err);
      break;
    }
  }

  console.log(`Collected ${collected.length} items; mapping and importing to ${TARGET_BASE}`);

  const concurrency = 6;
  let inFlight = 0;
  let idx = 0;
  const results = [];

  async function next() {
    if (idx >= collected.length) return;
    const item = collected[idx++];
    inFlight++;
    const product = mapExternalToProduct(item);

    if (!hasMajorityFields(product)) {
      const quality = countFilledFields(product);
      console.log(`Skipping low-quality item: ${product.name || 'unknown'} (${quality.filled}/${quality.total} fields)`);
      results.push(null);
      inFlight--;
      await sleep(50);
      if (idx < collected.length) await next();
      return;
    }

    const created = await postProduct(product);
    results.push(created);
    inFlight--;
    // throttle
    await sleep(50);
    if (idx < collected.length) await next();
  }

  const starters = [];
  for (let i = 0; i < concurrency && i < collected.length; i++) starters.push(next());
  await Promise.all(starters);

  console.log('Import finished. Created:', results.filter(Boolean).length);
}

if (require.main === module) {
  fetchAndImport().catch((err) => { console.error(err); process.exit(1); });
}
