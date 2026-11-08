# 개발 일지

> **겪은 일 · 막힌 일 · 배운 것을 적는 문서다** — 최신이 위.
> 진행 상황은 [PLAN](PLAN.md), 결정의 이유는 [decisions/](decisions/README.md). 딥 태스크를 겪은 날은 블록 제목에 `🧩n`을 붙인다.

## 현재 상태

- **지금 단계**: M1 화면 설계 — 모든 화면 시안을 다 그리고 M2 구현 시작(2026-11-08 결정)
- **채택된 것**: 컬러 E 올리브 · 마감 입력 · 오늘 손실 · 앱 이동(아래 탭 / 왼쪽 메뉴) · 문구 규칙 · **로그인 · 가입 · 초대(휴대폰 A 탭 + 데스크톱 B 소개 + 입력)** — [DESIGN](DESIGN.md) 2 ~ 9절. 프런트 Angular 뼈대 + CI 두 job 초록불. 결정 0013 Angular · 0014 GSAP · 0015 ECharts
- **다음에 할 일** (어느 기기든 `git pull`부터)
  1. M2 화면 시안 이어서: **첫 매장 등록 / 매장 고르기**(`Store.html` — A 한 화면 · B 1·2·3 단계, 상태: 검색 중 · 결과 0건 · 주소 API 실패, 끝에 "메뉴 → 식자재 → 레시피 → 첫 마감" 시작 체크리스트) → 메뉴 · 식자재 · 레시피(식자재에 **기본 단가** 칸, 레시피에 쓰인 식자재는 단위 잠금) → 매장 · 직원
  2. 그다음 M3 · M4 · M5 · 소개 시안
  3. 회사 PC에서 처음이면: [ARCHITECTURE 8.2 체크리스트](ARCHITECTURE.md#82-회사-pc-처음-세팅--체크리스트)를 0번부터 — 클론 전. 끝나면 8.3 표에 회사 PC 줄
- **열린 질문**: 비밀번호 찾기(M2에 메일 발송 없음, 점주가 잊었을 때가 비어 있음) — DESIGN 9.4
- **켜는 법**: 개발 DB `docker compose -f infra/compose.local.yaml up -d` → `backend/`에서 `.\gradlew bootRun --args="--spring.profiles.active=local"` → `frontend/`에서 `pnpm start`(http://localhost:4200). 목업은 서버 없이 `start docs\mockups\Map.html`(화면 지도) · `Auth.html` · `Closing.html` · `Loss.html` · `Colors.html`. Claude 미리보기는 `.claude/launch.json`의 `mockups`(파이썬) 또는 `mockups-node`(노드, 파이썬 없는 노트북)
- **기기별로 할 일**
  - 회사 PC: 위 3번
  - 집 PC · 노트북: 없음 (노트북 2026-11-09 끝까지 push)

---

## 2026-11-09 (1) · M1 로그인 · 가입 · 초대 채택, M2 단가는 "기본 단가" (노트북)

**한 일**
- M2용 화면 순서를 보드 넷으로 잡았다: 로그인 · 가입(`Auth`) → 첫 매장 등록 · 매장 고르기(`Store`) → 메뉴 · 식자재 · 레시피(`Settings`) → 매장 · 직원(`Members`)
- `Auth.html` 보드: 휴대폰 A 탭 · B 이메일 먼저, 데스크톱 A 가운데 카드 · B 소개 + 입력, 상태 8개(로그인 · 가입 · 실패 · 잠김 · 초대 넷). 공용 `auth.js` · `auth.css`
- 채택 **휴대폰 A + 데스크톱 B** → DESIGN 9절. 문구 다섯 곳을 사용자가 다듬었다 → 규칙 둘을 DESIGN 6절에: 계정 보안 안내(실패 · 잠김)는 합쇼체, 점주를 부를 때는 "사장님"(역할 이름은 점주 · 직원 그대로)

**[설계]**
- **M2 단가 = 식자재 기본 단가**(사용자 결정): 손실은 레시피 × 단가인데 단가는 입고 로트(F10, M3)에서 온다 → M2 완료 기준 "손실 원화"를 못 채운다(사전 검증에서 발견). 로트 단가가 먼저, 없으면 기본 단가. 빈 단가는 0이 아니라 "단가 없는 재료 n개" → DATA_MODEL 4절 9, REQUIREMENTS F05
- 기본 단가를 고치면 지난 손실이 바뀐다 → 마감 줄에 **그날 원가(1개당)**도 찍는다(DATA_MODEL 5절, 사전 검증에서 발견)
- 이메일 먼저(B)는 이메일만 넣어도 가입 여부가 드러난다. 로그인 실패 문구도 어느 쪽이 틀렸는지 말하지 않는다
- 초대 링크는 연 사람의 사정이 넷(계정 없음 · 로그인됨 · 이미 직원 · 만료)이라 상태를 나눴다. 만료 · 사용 · 취소는 한 문구

**막힌 것**
- 노트북에서 목업 미리보기가 안 뜸 — 원인: 노트북에 파이썬이 없다(`mockups` 설정이 `python -m http.server`). 해결: `launch.json`에 노드 한 줄 정적 서버 `mockups-node`(5501). 배운 것: 미리보기 설정도 기기마다 깔린 것에 기대니, 이미 있는 런타임(노드)으로 하나 더 둔다

**확인한 것 (관찰값)**: 기기 2 × 시안 2 × 상태 8 = 32가지를 iframe으로 하나씩 열어 본문이 다 그려짐(90 ~ 353자), 콘솔 오류 0건. 문구 수정 뒤 실패 · 잠김 · 이미 직원 · 만료 화면에서 새 문구를 확인

---

## 2026-11-08 (3) · M1 컬러 · 마감 입력 · 오늘 손실 · 앱 이동 채택, 프런트 Angular 뼈대 · CI (집 PC)

**한 일**
- 집 PC 세팅 마무리: GitHub CLI 2.103.3 · 프로필 UTF-8(`chcp` 65001) · VS Code 설정 두 개 → ARCHITECTURE 8.3
- `docs/mockups/` 시작: 마감 입력 휴대폰 3 · 데스크톱 3 시안, 컬러 8개 비교 보드(WCAG 대비율 표 포함). 주소 파라미터 `v` · `state` · `palette` · `dark` · `device`
- 채택: 컬러 **E 올리브**, 마감 입력 **휴대폰 A 카드 + 데스크톱 A 표 + 옆 요약** → `DESIGN.md`를 만들어 2 · 3절로 옮겼다
- 오늘 손실(F19) 시안 휴대폰 3 · 데스크톱 2 → **휴대폰 A 숫자 먼저 + 데스크톱 A 대시보드** 채택, B의 "막대를 누르면 그날" · C의 "한 줄 요약"을 동작으로만 → DESIGN 7절
- 앱 화면 지도(`Map.html`): 흐름 · 하루 흐름 · 이동 시안(휴대폰 3 · 데스크톱 2) · 점주와 직원 → **아래 탭 + 왼쪽 메뉴(폭 조절 · 접기 · 브라우저 기억)**, 첫 화면은 점주 "오늘"(마감 여부로 바뀜) · 직원 "마감", 직원에게 금액 숨김(화면 + API) → DESIGN 8절
- 문구 규칙(사용자 지시) → DESIGN 6절: "버리다" 대신 "낭비되다"(수동형), 행동은 "폐기", 남았지만 낭비되지 않은 것은 "절약", 계산에서 빼는 것은 "제외"
- CI에 프런트 job(pnpm install --frozen-lockfile → test → build), 회사 PC 처음 세팅 체크리스트(ARCHITECTURE 8.2)

**[설계]**
- 섞되 규칙으로 섞는다: "받는 데이터 모양이 같으면 같은 부품"(한 줄 · 카드). 다른 시안에서는 동작만 가져왔다(키보드 이동 · 분류별 n/m · 빠뜨림 확인)
- 프런트 **Angular** 확정([0013](decisions/0013-frontend-angular.md)): 마감 입력이 "브라우저가 상태를 들고 있어야 하는" 화면이라 htmx는 탈락, Svelte와 결승에서 "프런트도 정해진 구조를 탄탄하게 배운다"로 Angular. npm 기준 Angular 22.2 · Tailwind 4.3 · spartan/ui 1.9
- 움직임([0014](decisions/0014-motion-gsap.md)): Aceternity는 React 부품이라 못 쓰고 Angular 포팅은 관리가 끊겼다 → 내장 전환 + GSAP, 효과는 직접 옮겨 만든다. 연출은 소개 · 로그인 · 리포트에만. 소개 페이지를 F27(S)로 범위에 넣었다
- 차트 **ECharts** 확정([0015](decisions/0015-charts-echarts.md)): 백테스트(선 여러 개 · 확대 · 툴팁)가 가장 어렵고, 모든 차트를 한 라이브러리로 해야 툴팁 · 색 · 어두운 모드가 같다. ECharts 6.1 · ngx-echarts 22.0(Angular 22 지원). 쓰는 부품만 등록 + SVG 렌더러 + 지연 로딩
- 데스크톱 스프레드시트(C)는 메뉴가 늘면 빠르지만 입력 항목이 늘면 가로로 넘치고 태블릿 폭에 안 들어간다 → A의 표에 "모든 칸 펼치기" 모드로 나중에
- 그리면서 정한 동작 규칙(사전 검증에서 발견): 품절이면 남은 수량 0 잠금, 행방은 나머지가 폐기, 오류 줄은 손실에서 뺌, 어제 값은 안 건드린 메뉴만, 빠뜨린 메뉴는 저장 전에 확인 — DESIGN 3.2

- 프런트 뼈대(내가 침): `pnpm dlx @angular/cli@22 new frontend`(Angular 22.2 · TypeScript 6.0 · Vitest 5) → Tailwind 4.3 + PostCSS → `styles.css`에 E 올리브 토큰(`@theme inline`) → 개발 서버 프록시 `/api` · `/actuator` → 버튼 하나로 health 표시(signal + HttpClient) → 테스트 4건(`HttpTestingController`로 UP · 503 · 확인 중 잠금)

**막힌 것**
- 왼쪽 메뉴 폭 조절 손잡이가 끌리지 않음 — 원인: 손잡이를 메뉴 바깥(`right: -3px`)에 두었는데 메뉴의 `overflow: auto`가 그 부분을 잘라 냈다. 해결: 안쪽(`right: 0`)으로, 끄는 동안 오른쪽 iframe에 `pointer-events: none`. 배운 것: 스크롤 영역 밖으로 삐져나온 요소는 보이지도 잡히지도 않는다
- 화면 지도를 그리다 PLAN M1 목록에 M2에서 바로 쓸 설정 화면(로그인 · 매장 등록 · 메뉴 · 레시피 · 직원 초대)이 빠져 있던 것을 찾았다 → PLAN M1에 더함
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
