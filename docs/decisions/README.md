# decisions — 결정 기록

> **"왜 이렇게 정했나"를 남기는 결정 기록 묶음이다** — 결정 하나 = 파일 하나.
> 무엇을 만드는지는 [REQUIREMENTS](../REQUIREMENTS.md), 진행 상황은 [PLAN](../PLAN.md), 구현 중의 작은 판단은 [DEVLOG](../DEVLOG.md) `[설계]`.

- 파일 이름: `NNNN-영문-slug.md` (번호 4자리, 순서대로)
- 지난 결정은 고치지 않는다. 뒤집으면 **새 파일**을 만들고, 옛 파일의 상태만 `대체됨 → NNNN`으로 바꾼다
- 형식: 상태 · 날짜 / 맥락 / 결정 / 검토한 대안 / 감수할 것
- 0001 ~ 0012는 2026-11-07 재설계 브레인스토밍(노트북 → 집 PC)에서 정한 것이다
- 결정 파일 없이 [ARCHITECTURE](../ARCHITECTURE.md)에 한 줄로 둔 작은 선택: 한 레포 세 폴더, pnpm, 주소 `zwfnb.sagming.com`
- 아직 결정이 아닌 것: 차트 라이브러리(리포트 시안 때), 서버 리전 · 크기(첫 배포 전)

| 번호 | 결정 | 상태 |
|---|---|---|
| [0001](0001-revival.md) | Express v0를 버리고 처음부터 다시 설계, 옛 코드는 태그 `v0-express` | 채택 |
| [0002](0002-backend-java-spring.md) | 백엔드는 Java 25 + Spring Boot 4, Gradle(Groovy) + VS Code | 채택 |
| [0003](0003-postgresql-flyway.md) | DB는 PostgreSQL 18, 마이그레이션은 Flyway | 채택 |
| [0004](0004-jpa-jdbcclient.md) | DB 접근은 JPA + JdbcClient (jOOQ · QueryDSL 아님) | 채택 |
| [0005](0005-package-by-feature.md) | 기능별 패키지 + Spring Modulith 검사 테스트 | 채택 |
| [0006](0006-session-auth.md) | 세션 쿠키 + CSRF, 세션은 PostgreSQL (JWT 아님) | 채택 |
| [0007](0007-target-and-metrics.md) | 대상은 베이커리 카페 + 델리 메뉴, 지표는 돈과 탄소 두 축 | 채택 |
| [0008](0008-stock-ledger-lots.md) | 재고는 원장 + 로트, 폐기는 원인 · 대상별 | 채택 |
| [0009](0009-rls.md) | 매장 격리는 앱 필터 + 복합 외래 키 + RLS | 채택 |
| [0010](0010-forecast-sql-java-split.md) | 예측은 SQL 특징 + Java 보정, 비교는 백테스트에서 | 채택 |
| [0011](0011-carbon-factors.md) | 탄소는 생산 탄소(Poore & Nemecek)를 주 숫자로 | 채택 (M5에 확인) |
| [0012](0012-ops-reuse-playledger.md) | 운영은 PlayLedger · cbt-journal 틀을 가져온다 | 채택 |
| [0013](0013-frontend-angular.md) | 프런트는 Angular SPA + TypeScript + Tailwind + spartan/ui (htmx · Svelte 아님) | 채택 |
| [0014](0014-motion-gsap.md) | 움직임은 Angular 내장 전환 + GSAP, 화려한 연출은 소개 · 리포트에만 | 채택 |
