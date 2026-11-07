# 개발 일지

> **겪은 일 · 막힌 일 · 배운 것을 적는 문서다** — 최신이 위.
> 진행 상황은 [PLAN](PLAN.md), 결정의 이유는 [decisions/](decisions/README.md). 딥 태스크를 겪은 날은 블록 제목에 `🧩n`을 붙인다.

## 현재 상태

- **지금 단계**: M0 재정비 + 뼈대 — 재설계 · 문서 재정비 끝
- **다음에 할 일**: `.gitignore` · `.env.example`을 새 스택 기준으로 → Spring 뼈대(Initializr, PLAN M0)
- **기기별로 할 일**
  - 집 PC: Spring Boot Extension Pack 설치
  - 노트북: `git pull`, `oracle.oracle-java` 끄기, Docker Desktop 켜서 엔진 확인
  - 회사 PC: 처음 클론 + 환경 확인(ARCHITECTURE 8절)

---

## 2026-11-07 (2) · 재설계 마무리와 문서 재정비 (집 PC)

**한 일**
- 노트북(지하철)에서 시작한 재설계 브레인스토밍을 집 PC에서 이어서 끝냈다. 정한 것은 decisions 0001 ~ 0012
- 레포 · 집 PC 환경 확인: JDK Temurin 25.0.2, Docker 29.8.2 엔진 동작, Node 24.15 · pnpm 12.15, Spring Boot 확장 없음
- 외부 데이터 조사(공공데이터포털 · KAMIS · 도로명주소 · 탄소 계수) → REQUIREMENTS 3절
- 문서를 전역 문서 체계로 재정비: BRAINSTORM을 REQUIREMENTS · ARCHITECTURE · DATA_MODEL · PLAN · decisions에 녹이고 지웠다. 옛 문서는 `archive/`

**[설계]** 브레인스토밍 중 방향을 바꾼 것
- 처음엔 "재고 흐름 A / B / C" 하나만 넓히려다, 사용자 의도가 "전 영역을 탄탄하게 다시"라는 걸 확인하고 범위를 전체로 넓혔다
- 프런트(Angular)는 노트북에서 확정했다가 다시 열었다 — 화면을 그려 보기 전이라 근거가 없다. M1에서 정한다
- DB 접근은 "JPA + UPSERT만 네이티브"에서 **JPA + JdbcClient**로 — 원장 · 로트 · 백테스트로 SQL 비중이 커졌다
- 딥 태스크 7은 "같은 WMA를 두 언어로"에서 **SQL 특징 + Java 보정, 비교는 백테스트**로 — 비교가 장난감에 그치지 않게
- 트러블슈팅 전용 문서는 만들지 않기로 — 세트 밖 문서가 늘면 v0의 빈 `BE_트러블슈팅.md`처럼 된다. 커밋 + DEVLOG `🧩` + README 표로

**사전 검증에서 발견** (실제로 겪은 오류는 아니다)
- v0 스키마 구멍 10개 → DATA_MODEL 6절
- 품절 날은 판매량이 수요보다 작다(검열된 수요) → 마감에 품절 여부를 받는다
- 실사가 없으면 자동 차감 오차가 쌓여 발주 권장이 틀린다 → F12를 M으로
- RLS: 커넥션 풀 재사용 · 소유자 우회 · **Testcontainers 슈퍼유저 함정** → DATA_MODEL 3절
- 데모 데이터로는 날씨 효과를 증명하지 못한다(되찾기만 한다) → REQUIREMENTS 4절
- `@Scheduled` 배치는 앱이 살아 있어도 혼자 죽을 수 있다 → 마지막 성공 시각을 헬스에

**이번 세션 커밋**: `47fd744` · `3500f3f` · `9f316ca` · `0744a3f` · `3743a54` · `81bf550` (브레인스토밍), 이 블록의 문서 재정비 커밋

**다음에 할 일**: M0 의존성 목록 → 뼈대

## 2026-11-07 (1) · 레포 다시 열기 (노트북)

- 2026-07-12 이후 멈춘 레포를 다시 열었다. 스택을 새로 고르기로 하고 재설계 브레인스토밍 문서와 프로젝트 CLAUDE.md를 만들었다(`207df27`)
- 노트북 환경: JDK 25.0.5, Java · Spring Boot · Gradle 확장, ⚠️ `oracle.oracle-java` 충돌 가능성, ⚠️ Docker 엔진 응답 없음
