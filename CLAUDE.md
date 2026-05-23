# team401

스노보드 동아리 앱

## 앱 실행

- Wi-Fi 환경: `npm start` (현재 IP를 감지해 Supabase Site URL을 자동 업데이트 후 expo 실행)
- 모바일 데이터 환경: `npm run start:tunnel`
- IP 업데이트 없이 raw 실행: `npm run start:raw`

> 최초 실행 전 `.env.example`을 `.env`로 복사하고 Supabase Personal Access Token + 프로젝트 ref 설정 필요. 자세한 내용은 아래 카카오 로그인 트러블슈팅 참고.

## 기술 스택

- 프론트: React Native + Expo + TypeScript
- 백엔드: Supabase (Auth, DB, Realtime)

## 패키지 버전 (Expo Go SDK 54 기준)

- expo: ~54.0.0
- expo-asset: ~12.0.12
- expo-font: ~14.0.11
- expo-status-bar: ~3.0.9
- react: 19.1.0
- react-native: 0.81.5
- @types/react: ~19.1.0
- typescript: ~5.9.2

> Expo Go 앱이 지원하는 SDK 버전과 프로젝트 SDK 버전이 일치해야 함.
> 버전 충돌 시: `rm -rf node_modules package-lock.json && npm install`

## 주요 기능

- 카카오 로그인 (운영자/일반회원 구분)
- 시즌방: 인/아웃 날짜 등록, 날짜별 인원 조회
- 선착순 투표: 활동 모집, 대기 번호

## 카카오 로그인 트러블슈팅

### 문제
Supabase OAuth 로그인 후 Safari가 `localhost`로 리다이렉트되며 실패.

### 원인
Supabase 서버가 `exp://` 스킴의 redirect URL을 허용하지 않아, 등록된 redirect URL 매칭에 실패하면 Site URL(`http://localhost:3000`)로 fallback함.

### 해결 방법
1. **Supabase Site URL을 현재 Wi-Fi IP로 자동 업데이트** — `npm start` 실행 시 `scripts/start.mjs`가 Supabase Management API로 PATCH (`exp://<현재IP>:8081/--/`)
   - 와일드카드(`exp://**`)는 Supabase가 매칭하지 않아 fallback 발생 → Site URL 자체를 갱신하는 방식
2. **코드에서 `redirectTo`를 동적으로 생성** — `Linking.createURL('/')` 사용 (Site URL과 일치하므로 fallback 거치지 않고 바로 매칭)
3. **`WebBrowser.openBrowserAsync`로 변경** — `openAuthSessionAsync` 대신 사용
4. **`App.tsx`에 Linking 리스너 추가** — 앱으로 돌아오는 deep link를 감지해 세션 설정
5. **Supabase 클라이언트에 `flowType: 'implicit'` 설정** (`src/lib/supabase.ts`)
6. **카카오 동의항목**: 닉네임, 프로필 사진만 필수 동의 (이메일은 비즈앱 심사 없이 불가)
7. **Supabase 카카오 Provider**: `Allow users without an email` 토글 ON

### .env 설정 (최초 1회)

`.env.example`을 `.env`로 복사 후 두 값 채우기:

- `SUPABASE_ACCESS_TOKEN`: https://supabase.com/dashboard/account/tokens 에서 새로 생성
- `SUPABASE_PROJECT_REF`: 대시보드 URL의 프로젝트 ID 부분 (`https://supabase.com/dashboard/project/<여기>`)

### 관련 파일
- `scripts/start.mjs` — IP 감지 + Supabase Site URL 자동 업데이트 + expo 실행
- `src/lib/supabase.ts` — flowType: 'implicit'
- `src/screens/LoginScreen.tsx` — `Linking.createURL('/')` 로 redirectTo 동적 생성, openBrowserAsync 사용
- `App.tsx` — Linking 이벤트 리스너로 세션 처리

### 향후 정공법 (배포 시)

EAS 개발 빌드 + 커스텀 스킴 `team401://` 사용 → IP 의존성 영구 제거. `app.json`에 `scheme: "team401"`, `eas.json` 이미 셋업 완료. Apple Developer Program 유료 가입 후 `eas build --profile development --platform ios` 실행하면 됨.

---

## 진행 상황

### 완료
- [x] Expo SDK 54 + React Native 0.81.5 환경 세팅
- [x] 폴더 구조 생성 (src/screens, src/components, src/lib, src/hooks, src/types, src/navigation)
- [x] 의존성 설치 (@supabase/supabase-js, react-native-url-polyfill, @react-navigation/native, @react-navigation/native-stack, react-native-screens, react-native-safe-area-context)
- [x] React Navigation 구조 설정 (src/navigation/index.tsx) — 로그인 전/후 스택 분리
- [x] LoginScreen UI — 카카오 버튼 (노란색), 버튼 누르면 임시로 Home 이동
- [x] HomeScreen UI — 시즌방 / 선착순 투표 카드 메뉴

### 해야 할 것
- [x] Supabase 클라이언트 설정 (src/lib/supabase.ts)
- [x] 카카오 로그인 연동 (Supabase Auth + expo-web-browser)
- [x] 시즌방 화면 구현 (인/아웃 날짜 등록/수정, 날짜별 인원 조회)
- [ ] 선착순 투표 화면 구현 (활동 모집, 대기 번호)
