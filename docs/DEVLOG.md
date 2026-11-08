# 개발 일지

> **겪은 일 · 막힌 일 · 배운 것을 적는 문서다** — 최신이 위.
> 진행 상황은 [PLAN](PLAN.md), 결정의 이유는 [decisions/](decisions/README.md). 딥 태스크를 겪은 날은 블록 제목에 `🧩n`을 붙인다.

## 현재 상태

- **지금 단계**: M1 화면 설계 — M0 ✅ 2026-11-08
- **진행 중**: 컬러(E 올리브) · 마감 입력(휴대폰 A + 데스크톱 A) 채택 — [DESIGN](DESIGN.md), [mockups/](mockups/README.md). 프런트는 Angular([0013](decisions/0013-frontend-angular.md))
- **다음에 할 일**: 오늘 손실 · 재고 · 입고 · 예측 · 리포트 · 소개 · 로그인 시안 (CI는 백엔드 · 프런트 두 job 초록불, `36e7ce8`)
- **프런트 켜기**: `frontend/`에서 `pnpm start` → `http://localhost:4200` (백엔드가 켜져 있어야 "정상 (UP)")
- **개발 DB 켜기**: `docker compose -f infra/compose.local.yaml up -d`, 앱은 `backend/`에서 `.\gradlew bootRun --args="--spring.profiles.active=local"` (README "시작하기")
- **목업 보기**: `start docs\mockups\Closing.html` (서버 없이)
- **기기별로 할 일**
  - 회사 PC: 아직 클론 안 함 → [ARCHITECTURE 8.2 체크리스트](ARCHITECTURE.md#82-회사-pc-처음-세팅--체크리스트)를 0번부터. 특히 Docker 라이선스 · 이 레포만 개인 git 이름 · 회사 네트워크 인증서

---

## 2026-11-08 (3) · M1 컬러 · 마감 입력 시안 채택, 프런트 Angular 뼈대 (집 PC)

**한 일**
- 집 PC 세팅 마무리: GitHub CLI 2.103.3 · 프로필 UTF-8(`chcp` 65001) · VS Code 설정 두 개 → ARCHITECTURE 8.3
- `docs/mockups/` 시작: 마감 입력 휴대폰 3 · 데스크톱 3 시안, 컬러 8개 비교 보드(WCAG 대비율 표 포함). 주소 파라미터 `v` · `state` · `palette` · `dark` · `device`
- 채택: 컬러 **E 올리브**, 마감 입력 **휴대폰 A 카드 + 데스크톱 A 표 + 옆 요약** → `DESIGN.md`를 만들어 2 · 3절로 옮겼다

**[설계]**
- 섞되 규칙으로 섞는다: "받는 데이터 모양이 같으면 같은 부품"(한 줄 · 카드). 다른 시안에서는 동작만 가져왔다(키보드 이동 · 분류별 n/m · 빠뜨림 확인)
- 프런트 **Angular** 확정([0013](decisions/0013-frontend-angular.md)): 마감 입력이 "브라우저가 상태를 들고 있어야 하는" 화면이라 htmx는 탈락, Svelte와 결승에서 "프런트도 정해진 구조를 탄탄하게 배운다"로 Angular. npm 기준 Angular 22.2 · Tailwind 4.3 · spartan/ui 1.9
- 움직임([0014](decisions/0014-motion-gsap.md)): Aceternity는 React 부품이라 못 쓰고 Angular 포팅은 관리가 끊겼다 → 내장 전환 + GSAP, 효과는 직접 옮겨 만든다. 연출은 소개 · 로그인 · 리포트에만. 소개 페이지를 F27(S)로 범위에 넣었다
- 데스크톱 스프레드시트(C)는 메뉴가 늘면 빠르지만 입력 항목이 늘면 가로로 넘치고 태블릿 폭에 안 들어간다 → A의 표에 "모든 칸 펼치기" 모드로 나중에
- 그리면서 정한 동작 규칙(사전 검증에서 발견): 품절이면 남은 수량 0 잠금, 행방은 나머지가 폐기, 오류 줄은 손실에서 뺌, 어제 값은 안 건드린 메뉴만, 빠뜨린 메뉴는 저장 전에 확인 — DESIGN 3.2

- 프런트 뼈대(내가 침): `pnpm dlx @angular/cli@22 new frontend`(Angular 22.2 · TypeScript 6.0 · Vitest 5) → Tailwind 4.3 + PostCSS → `styles.css`에 E 올리브 토큰(`@theme inline`) → 개발 서버 프록시 `/api` · `/actuator` → 버튼 하나로 health 표시(signal + HttpClient) → 테스트 4건(`HttpTestingController`로 UP · 503 · 확인 중 잠금)

**막힌 것**
- `provideHttpClient(withFetch())`에 취소선 — 원인: Angular 22에서 `withFetch`가 deprecated("`FetchBackend` is the default"). fetch가 기본이 됐다. 해결: `provideHttpClient()`만. 배운 것: 취소선은 "다음 버전에 지울 예정" — 마우스를 올려 이유를 읽고, 옛 글 · AI가 알려 준 코드도 설치된 버전의 타입 파일(`node_modules/@angular/common/types/http.d.ts`)로 확인한다
- 테스트에서 HTTP 답을 주기 전에 `await fixture.whenStable()`을 기다리면 안 끝난다 — zoneless Angular는 걸려 있는 HTTP 요청도 "할 일"로 센다. "확인 중" 상태는 `fixture.detectChanges()`로 본다(사전 검증에서 발견)
- `pnpm add` 때 peer 경고(`@emnapi/*` 버전) — `pnpm why`로 보니 `@angular/build`의 WebAssembly 예비 파서 쪽. Windows는 네이티브 파서를 써서 무시
- 표에 숫자를 치고 Tab으로 넘어가면 커서가 사라짐 — 원인: `change`(칸을 떠날 때)에서 화면 전체를 다시 그리는데, 그 순간 커서는 이미 다음 칸에 가 있어 새로 그린 칸에서 사라진다. 해결: 다시 그리기를 `setTimeout`으로 커서 이동 뒤로 미루고, 커서가 있던 칸(`data-id` + `data-f`)을 찾아 다시 focus. 배운 것: 실제 프런트에서도 "입력 중에 목록 전체를 다시 그리면 커서를 잃는다" — 프레임워크가 바뀐 부분만 고치는지 확인할 것
- 보드를 `file://`로 열면 선택을 바꿔도 시안이 안 넘어감 — 원인: Chrome이 `file://` 페이지의 `history.replaceState`를 SecurityError로 막고, 그 오류가 그리기 앞에서 터졌다. 해결: try/catch로 감싸고, 화면 파일 안에도 시안 전환 단추. 배운 것: 로컬 서버(`http://`)에서만 확인하면 `file://`에서만 나는 오류를 놓친다 — 사용자가 여는 방식 그대로 확인할 것
- 컬러 C 밝게의 "손실 글 / 옅은 손실" 대비 4.4 → 손실 색을 진하게 바꿔 통과

**확인한 것 (관찰값)**: 입력 중 상태 손실 ₩18,600 · 폐기 10개 · 폐기율 7.9%(손 계산과 같음), 오류 상태는 오류 줄을 빼고 ₩15,000 · 5.4%. 컬러 8개 × 밝게 · 어둡게 대비 "부족" 0건. 데스크톱 C에서 25 → Enter → 12 → Tab 뒤 두 값 유지 · 커서는 다음 칸. 사용자 Chrome `file://`에서 시안 전환 동작(사용자 확인)

---

## 지난 단계

- **M0 재정비 + 뼈대** (2026-11-07 ~ 11-08) — 재설계(decisions 0001 ~ 0012) · 문서 재정비, Spring Boot 4.1.2 뼈대, compose PostgreSQL 18, Modulith 검사 · CI, 테스트 2건 · health UP. 자세히는 [archive/DEVLOG_M0.md](archive/DEVLOG_M0.md)
