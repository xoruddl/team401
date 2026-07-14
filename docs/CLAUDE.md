# docs 문서 지도

이 디렉토리는 화면/기능별 스펙 문서를 모아두는 곳입니다. 새 문서를 추가하거나 파일명을 바꾸면 반드시 아래 표를 갱신하세요.

## 화면/기능 스펙 문서

| 문서 | 화면 | 관련 코드 | 상태 |
|---|---|---|---|
| auth.md | 로그인 / 승인 대기 | `src/pages/LoginScreen.tsx`, `src/pages/PendingScreen.tsx`, `src/features/auth`, `src/features/pending` | 골격만 생성됨 |
| home.md | 홈(활동) 탭 | `src/pages/HomeScreen.tsx`, `src/features/home` | 골격만 생성됨 |
| community.md | 커뮤니티 탭 | `src/pages/CommunityScreen.tsx` | 골격만 생성됨 |
| mypage.md | 마이페이지 | `src/pages/MyPageScreen.tsx`, `src/features/mypage` | 골격만 생성됨 |
| season-room.md | 시즌방 (인/아웃 날짜 등록, 인원 조회) | `src/pages/SeasonRoomScreen.tsx`, `src/features/season-room` | 골격만 생성됨 |
| vote.md | 선착순 투표 (모집, 대기 번호) | `src/pages/VoteScreen.tsx`, `src/features/vote` | 골격만 생성됨 |
| members.md | 회원 관리 (운영자) | `src/pages/MemberManagementScreen.tsx`, `src/features/members` | 골격만 생성됨 |
| board.md | 게시판 | `src/pages/BoardScreen.tsx`, `src/features/board` | 골격만 생성됨 |
| notice.md | 공지사항 | `src/pages/NoticeScreen.tsx`, `src/features/notice` | 골격만 생성됨 |
| skateboard.md | 스케이트보드 대여 | `src/pages/SkateboardRentalScreen.tsx`, `src/features/skateboard` | 골격만 생성됨 |

## 기타 문서

- `history.md` — 프로젝트 진행 상황 히스토리 (루트 `CLAUDE.md`와 동기화되는 로그)
- `swagger.yaml` — API 스펙. `npm run docs`로 로컬 Swagger UI 확인 (http://localhost:4000)

## 새 문서 추가 규칙

1. 파일명은 대응하는 `src/features/<name>` 폴더명을 따른다 (feature 폴더가 없으면 화면 이름 기준 kebab-case).
2. 문서를 만들거나 지우면 위 표를 같이 갱신한다 — 상태는 `작성 필요` / `골격만 생성됨` / `작성됨` / `수정 중` 중 하나로 표시.
3. 문서 내용 권장 순서: 화면 목적 → 주요 플로우 → 데이터 모델/API 연동 (`swagger.yaml` 참고) → 엣지 케이스.
4. 여러 화면이 겹치는 내용(예: 카카오 로그인 트러블슈팅)은 중복 작성하지 말고 관련 문서에서 서로 링크만 건다.
