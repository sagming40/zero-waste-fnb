# 0005 · 백엔드 패키지는 기능별 + Spring Modulith 검사 테스트

- **상태**: 채택
- **날짜**: 2026-11-07

## 맥락

기능이 25개 남짓이다. 레포는 한 레포에 `backend/` · `frontend/` · `infra/`로 나눈다 — 레포 둘은 API를 바꿀 때 버전 맞추기 · 문서 갈라짐이 생기고, Gradle이 프런트까지 빌드하는 방식은 Caddy가 프런트를 내보내기로 해서 이득이 없다.

## 결정

- 백엔드는 **기능별 패키지**(`store` · `menu` · `closing` · `stock` · `forecast` · `report` · `external` · `common`), 각 폴더 안에 controller · service · repository. 목록은 [ARCHITECTURE 2절](../ARCHITECTURE.md#2-레포--코드-구조)
- **Spring Modulith는 검사 테스트만** 쓴다 — 기능끼리 공개된 것만 부르는지 테스트가 지킨다
- **모듈 이벤트는 쓰지 않는다** — 마감 저장 → 재고 차감은 한 트랜잭션이어야 하는데 Modulith 이벤트는 커밋 뒤에 돈다. 직접 호출한다

## 검토한 대안

- **층별 패키지**(`controller/` · `service/` · `repository/`) — 국내 예제 · 강의에서 제일 흔하고 처음엔 찾기 쉽다. 기능이 20개를 넘으면 기능 하나 고치려고 폴더 넷을 오간다
- **기능별 + 검사 없음** — 시간이 지나면 기능끼리 몰래 내부를 건드려 경계가 무너진다

## 감수할 것

- 기능 사이 공개 범위를 처음부터 의식해야 해서 초반에 조금 번거롭다
