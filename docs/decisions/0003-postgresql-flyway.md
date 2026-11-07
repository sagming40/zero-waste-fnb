# 0003 · DB는 PostgreSQL 18, 마이그레이션은 Flyway

- **상태**: 채택
- **날짜**: 2026-11-07

## 맥락

메뉴 ↔ 레시피 ↔ 식자재 ↔ 로트처럼 관계가 엄격한 정형 데이터다. 매장 격리(RLS), 정확한 수량(`NUMERIC`), 예측 특징(윈도 함수), 멱등 배치(`ON CONFLICT`)가 필요하다.

## 결정

- **PostgreSQL 18**. 엔진을 바꾸는 대신 **PostgreSQL을 깊게 쓰는 것**(RLS · 윈도 함수 · 실행 계획 · 부분 인덱스)으로 변화를 준다
- **Flyway**. SQL 파일(`V1__init.sql` …)을 직접 쓴다. 적용된 파일은 체크섬 때문에 고치지 않는다(첫 배포 전 예외는 [DATA_MODEL 5절](../DATA_MODEL.md#5-기술-규칙)). JPA `ddl-auto=validate` — 테이블은 Flyway만 만든다

## 검토한 대안

| 후보 | 판단 |
|---|---|
| MySQL 8 | 국내 Spring + JPA에서 제일 흔하지만 MariaDB를 써 봐서 새로 배우는 게 적고, RLS가 없다 |
| MongoDB | 관계가 엄격한 데이터라 맞지 않다 |
| Oracle | 개인 프로젝트로는 무겁고 배포가 번거롭다 |
| Liquibase | 되돌리기 · 엔티티 비교(liquibase-hibernate)가 있어 Alembic에 더 가깝다. DB가 하나이고 혼자 개발이라 그 장점을 쓸 데가 없고 개념이 더 많다 |
| Hibernate `ddl-auto=update` | 기록도 되돌리기도 없이 테이블을 고친다. 운영에 쓰면 안 된다 |

참고: Alembic처럼 ORM과 한 몸인 마이그레이션 도구는 Java에 없다(Django · Rails · EF Core에는 있다).

## 감수할 것

- 마이그레이션 자동 생성이 없다 — SQL을 손으로 쓴다. PostgreSQL 기능을 깊게 쓸 거라 어차피 손으로 고칠 일이 많다
