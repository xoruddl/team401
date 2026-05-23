# 운영 출시 준비 체크리스트

## 티어 구분
- **[필수]** 안 하면 출시 불가능 (빌드/심사/법)
- **[권장]** 안 해도 출시는 되지만 운영 시 고통
- **[선택]** 시간 나면

---

## 빌드 / 배포

- [ ] **[필수]** Apple Developer Program 가입 ($99/년)
- [ ] **[필수]** Google Play Console 가입 ($25 1회)
- [ ] **[필수]** EAS production 빌드 셋업 (`eas build --profile production`)
  - `eas.json` 이미 존재
- [ ] **[필수]** `app.json` 정리 — icon, splash, displayName, version
  - 현재 기본값일 가능성. 적어도 아이콘/스플래시 디자인 필요
- [ ] **[필수]** Custom scheme `team401://` 활성화 (EAS 빌드 시 자동)
- [ ] **[필수]** App Store / Play Store 등록 + 심사 (스크린샷·설명·1~2주 소요)

---

## 인증

- [ ] **[필수]** 카카오 production 앱 redirect URL `team401://` 등록
- [ ] **[필수]** Supabase Site URL → `team401://` 고정
- [x] **[권장]** ~~`scripts/start.mjs` Site URL 갱신을 dev 모드 전용으로 가드~~ (현재 Site URL이 dev 패턴이 아니면 자동 스킵)

---

## 법 / 약관 (한국 앱스토어 심사 강제)

- [ ] **[필수]** 개인정보처리방침 (한국어, 외부 URL 가능 — Notion/GitHub Pages)
  - 카카오 로그인 → 닉네임/사진 수집 명시
- [ ] **[권장]** 이용약관 (있으면 좋음)
- [ ] **[필수]** App Store Connect "수집 데이터" 항목 작성

---

## 운영 가시성

- [ ] **[권장]** Sentry 도입
  - `npx expo install @sentry/react-native`
  - 무료 플랜 5,000 events/월 (동아리 규모 충분)
  - 셋업 30분 + 소스맵 업로드 30분
- [ ] **[권장]** Supabase Logs 정기 확인 루틴 (대시보드 → Logs)
- [ ] **[선택]** 분석 도구 (Amplitude / Mixpanel)

---

## 데이터 안전망

- [ ] **[필수]** 백업 전략
  - 무료 플랜은 자동 백업 없음
  - 옵션: (a) Supabase Pro $25/월, (b) cron으로 `pg_dump` → S3, (c) 매주 수동 백업
- [ ] **[권장]** Supabase URL/키 환경변수화 + dev 환경 분리
  - 사용자 늘기 시작하면 그때
- [ ] **[권장]** 마이그레이션 squash → `supabase db reset` 가능하게
  - dev 환경 만들 때 같이 진행
- [ ] **[선택]** Supabase anon key 회전 절차 매뉴얼
- [ ] **[권장]** season_entries 자동 정리 (시즌 종료 후 N개월 지난 것 삭제)
  - 옵션 A: 매년 고정 날짜에 전체 삭제 ("초기화")
  - 옵션 B: `out_date < now() - interval '6 months'` 식으로 점진 삭제 (권장)
  - 기간/방식 미정

---

## 성능 / 안정성

- [x] **[권장]** ~~`season_entries` 인덱스 추가 (in_date, out_date, user_id)~~ (0016)
- [x] **[권장]** ~~보드 대여 race 패배 메시지 한국어화~~ (PG 23505 캐치 → "방금 다른 사람이 먼저 빌렸습니다")
- [ ] **[권장]** `useProfile` 캐싱 (Context 또는 React Query)
  - 탭 이동마다 같은 query 6번 반복
- [ ] **[선택]** Notice realtime
- [ ] **[선택]** SeasonEntry realtime
- [ ] **[선택]** 로딩 스켈레톤 (풀스크린 스피너 → 카드 placeholder)
- [ ] **[선택]** Error boundary (React 컴포넌트 에러 시 화이트스크린 방지)
- [ ] **[선택]** 오프라인 indicator
- [ ] **[선택]** 카카오 avatar URL 만료 대비 (자체 storage 캐싱)
- [ ] **[권장]** 투표 100명+ 동시 참여 부하 대비 (큰 행사 직전에)
  - (B) Realtime debounce 300ms → 1500ms (5분 작업)
  - (C) 본인 join 후 직접 fetchVotes 제거, Realtime에 위임 (5분 작업)
  - (A) Realtime payload로 incremental state update (1~2시간, 정말 부하 클 때)

---

## 유저 경험

- [ ] **[권장]** Push notifications (공지/투표 알림)
  - expo-notifications + Supabase Edge Function trigger
- [ ] **[선택]** 강제 업데이트 배너 (치명적 버그 시 구버전 차단)
- [ ] **[선택]** 앱 버전/빌드 표시 (마이페이지)

---

## 정리 작업

- [x] **[권장]** ~~`App.tsx` Linking 핸들러 에러 처리~~ (OAuth error / 토큰 누락 / setSession 실패 모두 Alert)
- [ ] **[선택]** 중복 policy 정리 (`profiles_select`, `profiles_update`) — 대시보드 자동 생성된 것
- [ ] **[선택]** `supabase/.DS_Store` gitignore 추가

---

## 최소 출시 가능 (Minimum Viable Launch)

진짜 출시만 한다면 이것만:

1. Apple Developer Program 가입
2. EAS production 빌드
3. 카카오 prod redirect URL `team401://` 등록
4. Supabase Site URL 고정
5. app.json — 아이콘 + 스플래시 + 이름 + 버전
6. 개인정보처리방침 URL
7. App Store Connect / Play Console 등록 + 스크린샷
8. Sentry 도입
9. 백업 첫 1회 + 정기 일정
10. ~~season_entries 인덱스 추가~~ (완료)

---

## 추정 소요

| 단계 | 시간 |
|---|---|
| 코드/SQL 변경 (Sentry, 인덱스, 에러 메시지, app.json) | 2~3시간 |
| Apple Developer 가입 → 승인 대기 | ~24시간 |
| EAS 빌드 + 카카오 prod redirect 등록 + 디바이스 테스트 | 반나절 |
| 개인정보처리방침 작성 | 1~2시간 |
| App Store 스크린샷·설명·심사 신청 | 반나절 |
| Apple 심사 대기 | 1~3일 |
| Google 심사 대기 | 1~7일 |

**총 1~2주** (대기 시간 포함)

---

## 이미 완료

- [x] 폴더 구조 리팩토링 (features/ + components/ui)
- [x] RLS 정책 감사 (이미 안전)
- [x] 누락 마이그레이션 복구 (0012 — votes / vote_entries / season_entries / join_vote)
- [x] 시즌방 saveEntry RPC화 — race condition + 데이터 손실 해결 (0013)
- [x] Board / Notice 페이지네이션 + cursor 무한스크롤
- [x] 투표 Realtime (0014) + 1분 tick으로 시간 기반 상태 전환
- [x] 보드 대여 Realtime (0015)
- [x] season_entries 인덱스 (0016)
- [x] 보드 대여 race 에러 한국어화
- [x] App.tsx Linking 에러 처리
- [x] start.mjs prod 덮어쓰기 가드
