import { supabase } from './supabase';

// 클라이언트와 서버 시계의 offset (ms). serverTime ≈ Date.now() + offsetMs.
// 폰 시계가 NTP 미동기화로 어긋나도 이 offset 으로 보정.
let offsetMs = 0;
let syncPromise: Promise<void> | null = null;

export const syncServerTime = (): Promise<void> => {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    try {
      const t1 = Date.now();
      const { data, error } = await supabase.rpc('server_now');
      const t2 = Date.now();
      if (error || !data) {
        syncPromise = null; // 실패 시 다음 호출에서 재시도 허용
        return;
      }
      const serverMs = new Date(data as string).getTime();
      // RTT 절반 가정: 서버가 t1+t2 의 중간 지점에서 응답 → offset = serverMs - (t1+t2)/2
      offsetMs = serverMs - (t1 + t2) / 2;
    } catch {
      syncPromise = null;
    }
  })();
  return syncPromise;
};

export const getServerNow = (): number => Date.now() + offsetMs;
