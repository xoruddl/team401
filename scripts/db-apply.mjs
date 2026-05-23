#!/usr/bin/env node
// Supabase Management API로 SQL 파일 실행.
// 사용: node scripts/db-apply.mjs <sql파일경로>
import { readFileSync, existsSync } from 'fs';

const ENV_PATH = new URL('../.env', import.meta.url);
if (!existsSync(ENV_PATH)) {
  console.error('❌ .env 파일이 없습니다.');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(ENV_PATH, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF } = env;
if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error('❌ .env에 SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF 필요');
  process.exit(1);
}

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error('❌ 사용법: node scripts/db-apply.mjs <sql파일경로>');
  process.exit(1);
}

const query = readFileSync(sqlPath, 'utf-8');
console.log(`📄 ${sqlPath} 적용 중...`);

const res = await fetch(
  `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  },
);

const text = await res.text();
if (!res.ok) {
  console.error(`❌ 실패 (${res.status})`);
  console.error(text);
  process.exit(1);
}
console.log('✅ 적용 완료');
console.log(text);
