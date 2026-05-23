#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { networkInterfaces } from 'os';
import { spawn } from 'child_process';

const ENV_PATH = new URL('../.env', import.meta.url);

if (!existsSync(ENV_PATH)) {
  console.error('❌ .env 파일이 없습니다. .env.example을 복사해서 채워주세요.');
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
  console.error('❌ .env에 SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF 설정 필요');
  process.exit(1);
}

const interfaces = networkInterfaces();
let ip = null;
for (const ifaces of Object.values(interfaces)) {
  for (const iface of ifaces ?? []) {
    if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
      ip = iface.address;
      break;
    }
  }
  if (ip) break;
}

if (!ip) {
  console.error('❌ Wi-Fi IP 감지 실패 (192.168.x.x)');
  process.exit(1);
}

const siteUrl = `exp://${ip}:8081/--/`;
console.log(`🌐 IP 감지: ${ip}`);

// 현재 Site URL이 dev 패턴(exp://, localhost, 빈 값)이 아니면 prod로 보고 갱신 스킵.
// → 같은 .env로 prod 프로젝트를 가리키게 됐을 때 실수로 prod URL을 dev IP로 덮어쓰는 사고 방지.
const authConfigUrl = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`;
const authHeaders = {
  Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

const currentRes = await fetch(authConfigUrl, { headers: authHeaders });
if (!currentRes.ok) {
  console.error(`❌ Supabase 현재 설정 조회 실패 (${currentRes.status})`);
  console.error(await currentRes.text());
  process.exit(1);
}
const currentSiteUrl = (await currentRes.json()).site_url ?? '';

const isDevPattern =
  !currentSiteUrl ||
  currentSiteUrl.startsWith('exp://') ||
  currentSiteUrl.includes('localhost');

if (!isDevPattern) {
  console.log(`⚠️  현재 Site URL이 prod로 보임: ${currentSiteUrl}`);
  console.log('   덮어쓰지 않고 expo start만 진행합니다.\n');
} else {
  console.log(`📡 Supabase Site URL → ${siteUrl}`);
  const patchRes = await fetch(authConfigUrl, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ site_url: siteUrl }),
  });
  if (!patchRes.ok) {
    console.error(`❌ Supabase 업데이트 실패 (${patchRes.status})`);
    console.error(await patchRes.text());
    process.exit(1);
  }
  console.log('✅ Site URL 업데이트 완료\n');
}

const args = process.argv.slice(2);
const child = spawn('npx', ['expo', 'start', '--clear', '--go', ...args], {
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
