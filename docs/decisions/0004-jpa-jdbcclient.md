# 0004 · DB 접근은 Spring Data JPA + JdbcClient

- **상태**: 채택
- **날짜**: 2026-11-07

## 맥락

데이터 모델([DATA_MODEL](../DATA_MODEL.md))을 그려 보니 쿼리가 두 종류로 갈렸다.
- JPA가 편한 쪽(10개 남짓): 계정 · 매장 · 메뉴 · 식자재 · 레시피 · 입고의 저장 · 조회
- SQL이 강한 쪽(8 ~ 10개): 로트를 유통기한 순으로 잠그며 차감(`FOR UPDATE`), 마감 통째 교체, 윈도 함수 WMA · 기준선, 백테스트 집계, 손실 원화(레시피 펼쳐 합산), 탄소 리포트, 외부 데이터 UPSERT

처음 안("JPA 기본 + UPSERT만 네이티브")은 원장 · 로트 · 백테스트가 나오기 전의 판단이었다.

## 결정

- CRUD는 **Spring Data JPA**, SQL이 강한 쿼리는 **JdbcClient**로 SQL을 직접 쓴다
- SQL은 기능 패키지마다 SQL 전용 클래스 하나(`StockQueries` 등)에 모으고, 클래스마다 Testcontainers 테스트를 붙인다

## 검토한 대안

| 후보 | 판단 |
|---|---|
| JPA + jOOQ | SQL을 타입 검사받으며 쓰고 윈도 함수 · `ON CONFLICT`도 된다. DB에서 코드를 생성하는 빌드 단계(Flyway → Testcontainers → 생성)가 M0를 무겁게 하고 처음 배울 게 하나 더 는다 |
| JPA + QueryDSL | 국내 Spring 채용에서 제일 흔하다. JPQL 위라 윈도 함수 · `ON CONFLICT`를 못 해서 핵심 쿼리를 못 푼다. 원래 프로젝트 관리가 멈춰 포크판을 써야 한다 |
| MyBatis만 · jOOQ만 · Spring Data JDBC | SQL은 깔끔하지만 JPA를 안 배우게 된다 — Spring을 고른 이유(JPA 딥 태스크)를 잃는다 |

## 감수할 것

- 문자열 SQL의 오타 · 컬럼 이름 실수는 실행해야 드러난다 → 테스트로 막는다
- M4쯤 SQL 문자열이 괴로우면 그 쿼리들만 jOOQ로 옮겨 전후를 비교한다(딥 태스크 후보)
