// Housing Watch data lives as JSON files in a private Supabase Storage bucket,
// written by the daily cron and read by the /housing pages. No table, no
// migration, and no deploy when the numbers change.
import fs from 'node:fs';
import path from 'node:path';
import { supabaseAdmin } from '@/lib/supabase-server';

const BUCKET = 'housing-watch';

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists|duplicate/i.test(error.message || '')) throw error;
}

// Local development: HOUSING_LOCAL_STORE=<dir> reads and writes plain files there instead.
const LOCAL = process.env.HOUSING_LOCAL_STORE;
const localStore = LOCAL && {
  async get(name) {
    try { return JSON.parse(fs.readFileSync(path.join(LOCAL, name), 'utf8')); } catch { return null; }
  },
  async put(name, obj) {
    fs.mkdirSync(LOCAL, { recursive: true });
    fs.writeFileSync(path.join(LOCAL, name), JSON.stringify(obj));
  },
};

export const housingStore = localStore || {
  async get(name) {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(name);
    if (error || !data) return null;
    try {
      return JSON.parse(await data.text());
    } catch {
      return null;
    }
  },
  async put(name, obj) {
    const body = JSON.stringify(obj);
    const up = () => supabaseAdmin.storage.from(BUCKET).upload(name, body, {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '60',
    });
    let { error } = await up();
    if (error && /bucket not found|not found/i.test(error.message || '')) {
      await ensureBucket();
      ({ error } = await up());
    }
    if (error) throw error;
  },
};
