# 계획

> **목표 · 단계(M0 …) · 완료 기준 · 진행 현황을 적는 문서다. 진행 상황은 여기에만 적는다.**
> 무엇을 만드는지는 [REQUIREMENTS](REQUIREMENTS.md)(기능 번호 F · N), 겪은 일은 [DEVLOG](DEVLOG.md), 왜 그렇게 정했는지는 [decisions/](decisions/README.md).

## 1. 목표

- 베이커리 카페 + 델리 메뉴의 마감 기록으로 **내일 생산량 · 발주량**을 권장하고, 낭비된 **돈과 탄소**를 보여 주는 웹 앱(REQUIREMENTS 1절)
- 프런트 · 백엔드 · DB · 서버 · 배포 · 운영 · 코드 구현 전부를 탄탄하게 — 자기계발 프로젝트라 시간이 걸려도 완성도 우선([0001](decisions/0001-revival.md))
- Spring · JPA · 프런트가 전부 처음이다. 코드는 사용자가 직접 친다(CLAUDE.md 타이핑 학습 모드)

## 2. 진행 현황

⬜ 시작 전 · 🔄 진행 중 · ✅ 완료 + 날짜

| 단계 | 상태 |
|---|---|
| M0 재정비 + 뼈대 | ✅ 2026-11-08 — 점검 결과 [archive/DEVLOG_M0](archive/DEVLOG_M0.md) 2026-11-08 (2) |
| M1 화면 설계 | 🔄 |
| M2 운영 뼈대 | ⬜ |
| 첫 배포 | ⬜ |
| M3 재고 | ⬜ |
| M4 예측 | ⬜ |
| M5 외부 신호 + 탄소 | ⬜ |
| M6 마감 점검 | ⬜ |

## 3. 단계

M2 ~ M5는 REQUIREMENTS의 M 기능을 네 묶음으로 끊은 것이다 — **묶음 하나가 끝날 때마다 혼자 써 볼 수 있는 앱**이 된다. 프런트가 아직 안 정해져서 화면 쪽 완료 기준은 "화면에서 한 동작"으로만 적는다.

### M0 재정비 + 뼈대

- [x] 재설계: 범위 · 스택 · 데이터 모델 · 운영 (2026-11-07, decisions 0001 ~ 0012)
- [x] 문서를 전역 문서 체계로 재정비, 옛 문서는 `archive/` (2026-11-07)
- [x] **M0 의존성 목록** 확인 (2026-11-07): Boot 4.1.2 · Java 25 · Gradle Groovy, `com.sagming.zwfnb`. M0 = Web · Data JPA · PostgreSQL · Flyway · Actuator · Validation · Testcontainers · Modulith(test만) · Lombok. Security · Session JDBC · springdoc은 M2. 설치: Spring Boot Extension Pack
- [x] 옛 코드에 태그 `v0-express`(→ `93e31dc`)를 달고 `backend/`(Express) · `seed/` · `schema.sql`을 지웠다 (2026-11-07, `0974dbe`)
- [x] `.gitignore` · `.gitattributes`를 새 스택 기준으로, 옛 `.env.example` 삭제 (2026-11-07, `8d226c9`). 빌드 폴더는 각 폴더의 `.gitignore`가 맡는다
- [x] Spring 뼈대(`backend/`, Spring Initializr, Boot 4.1.2 · Gradle 9.8.2) + Testcontainers 테스트 1건 통과 (2026-11-07, `06d6e64`)
- [x] compose(`infra/compose.local.yaml`, PostgreSQL 18 · 5433) + `application.yml`(공용) · `application-local.yml`(DB 접속) (2026-11-07, `82018a9`). Flyway `V1`은 빈 파일로 만들지 않고 M2 첫 테이블 때 만든다 — 빈 V1을 나중에 채우면 체크섬이 바뀐다
- [x] `/actuator/health` → `{"status":"UP"}` (bootRun local, 2026-11-07)
- [x] Modulith 검사 테스트 — 위반을 일부러 넣어 빨간불까지 확인 (2026-11-08, `f130c17`)
- [x] CI: GitHub Actions에서 `./gradlew test` — 첫 실행 초록불, 1m 26s (2026-11-08, `6fde811`)
- [x] README "시작하기"를 실제 명령으로(개발 DB · bootRun · 테스트) + CI 배지, COMMIT_CONVENTION 예시를 재설계 뒤 실제 커밋으로 (2026-11-08). README 명령을 처음부터 그대로 따라가 보는 건 M0 닫기 점검에서

**완료 기준**: `./gradlew test`가 Testcontainers 위에서 통과(건수를 DEVLOG에), `/actuator/health`가 200, CI 초록불. DB 계정 둘(소유자 · 앱)은 RLS와 함께 M2에서 나눈다 — 지금 나누면 Testcontainers 쪽도 같이 바꿔야 한다. 프런트 뼈대는 M1에서 프런트를 정한 뒤로 미룬다.

### M1 화면 설계

- **앱의 모든 화면** 목업 시안을 그려 비교 → `DESIGN.md` · `mockups/`. 화면 목록은 [mockups/Map.html](mockups/Map.html)(DESIGN 8절). 구현(M2) 전에 전부 그린다 (2026-11-08 사용자 결정 — 단계마다 미루지 않는다)
  - [x] 컬러: 8개 비교 → **E 올리브** 채택, 밝게 · 어둡게 대비 4.5 이상 (2026-11-08, DESIGN 2절)
  - [x] 마감 입력: 휴대폰 3 · 데스크톱 3 비교 → **휴대폰 A 카드 + 데스크톱 A 표 + 옆 요약** 채택 (2026-11-08, DESIGN 3절)
  - [x] 오늘 손실: 휴대폰 3 · 데스크톱 2 비교 → **휴대폰 A 숫자 먼저 + 데스크톱 A 대시보드** 채택 (2026-11-08, DESIGN 7절)
  - [x] 앱 화면 지도 · 이동: **휴대폰 아래 탭 + 데스크톱 왼쪽 메뉴(폭 조절 · 접기)**, 첫 화면 규칙, 직원 금액 숨김 (2026-11-08, DESIGN 8절)
  - 남은 화면 — 지도의 순서대로(먼저 만드는 단계부터)
    - [ ] **M2에 필요한 것**: 로그인 · 가입(F01, 직원 초대 링크) · 첫 매장 등록 / 매장 고르기(F02 · F03) · 메뉴 · 식자재 · 레시피 설정(F04 ~ F06) · 매장 · 직원(F03 초대 · 내보내기) — 2026-11-08 화면 지도를 그리다 PLAN에서 빠져 있던 것을 찾았다
    - [ ] M3: 재고(F11 · F21) · 입고(F10) · 재료 폐기(F09) · 실사(F12)
    - [ ] M4: 내일 권장 — 생산 · 발주(F16 · F17), "오늘" 맨 위 "오늘 만들 것" 자리 · 백테스트(F18)
    - [ ] M5: 탄소 리포트(F20)
    - [ ] 소개(랜딩, F27 — 연출은 [0014](decisions/0014-motion-gsap.md))
- [x] **프런트 결정**: Angular 22 · TypeScript · Tailwind 4 · spartan/ui (2026-11-08, [0013](decisions/0013-frontend-angular.md)) — 마감 입력 시안이 근거. 차트는 ECharts ([0015](decisions/0015-charts-echarts.md), 2026-11-08)
- [x] 프런트 뼈대(pnpm): `frontend/`, E 올리브 토큰을 Tailwind 테마로, 버튼 하나, 개발 서버 프록시(`/api` · `/actuator`)로 백엔드 health를 화면에 표시 — Vitest 4건 통과 (2026-11-08)
- [x] CI에 프런트(pnpm 테스트 · 빌드) 더하기 — `frontend` job 25초, Vitest 4건, 백엔드 job과 둘 다 초록불 (2026-11-08, `36e7ce8`)

**완료 기준**: 화면 지도의 모든 화면 시안 채택(mockups/README에 채택 표시와 날짜, 규칙은 DESIGN), 프런트 결정 파일, 프런트 화면에 버튼 하나.

### M2 운영 뼈대 — "기록하면 낭비된 돈이 보인다"

F01 ~ F06 · F08 · F19, N02 · N03 · N04 · N05(헬스 부분). 외부 API는 F02 주소 검색만.

- 딥 태스크: 🧩2 트랜잭션(마감 다시 입력 = 통째로 바꿈), 🧩6 RLS
- `DATA_MODEL.md`의 컬럼은 이 단계의 마이그레이션으로 옮겨 간다
- 첫 엔티티 전에 `backend/lombok.config`(`lombok.addLombokGeneratedAnnotation = true`, ARCHITECTURE 2절 Lombok 규칙) — M0 점검에서 미룸(아직 Lombok을 쓰는 코드가 없다)
- 결정할 것: 오류 응답 형식(안: RFC 9457), OpenAPI → TypeScript 타입 생성 여부, `store_member` · `store_invitation`의 RLS

**완료 기준**: 남의 매장 · 비로그인 · 직원 권한 실패 테스트 통과(직원 요청에 금액이 내려가지 않는지 포함)(앱 역할로 접속한 Testcontainers에서), 같은 날 마감을 두 번 입력해도 줄 수가 같다, 휴대폰에서 로그인 → 마감 입력 → 오늘 손실 원화를 본다.

### 첫 배포 (M2 뒤)

12월 AWS 이사 뒤라 처음부터 AWS(크레딧 결과로 서울 / 시드니). PlayLedger · cbt-journal 틀([0012](decisions/0012-ops-reuse-playledger.md)), `SERVER.md`를 이때 만든다.

- 딥 태스크: 🧩5 배포(환경변수 · 프록시 · DB 계정 둘 · **JVM 메모리 측정**)
- 하위 주소 `zwfnb.sagming.com`, 백업(R2) · 복원 연습 · uptime 감시 · Dependabot

**완료 기준**: 운영 주소에서 로그인 → 마감 입력 → 손실 원화, 복원 연습 결과, uptime 초록불, JVM 메모리 측정값(DEVLOG).

### M3 재고

F09 · F10 · F11 · F12 · F21.

- 딥 태스크: 같은 로트 동시 차감 락, 원장 합계 성능

**완료 기준**: 입고 → 마감 차감 → 폐기 → 실사 뒤 원장 합계 = 로트 남은 양 = 화면 재고, 같은 로트를 동시에 차감해도 음수가 안 된다(동시성 테스트).

### M4 예측

F13 · F16 · F17 · F18.

- 딥 태스크: 🧩3 배치 멱등성, 🧩4 휴무 · 콜드스타트 · 품절일, 🧩7 윈도 함수 특징 · 백테스트 비교([0010](decisions/0010-forecast-sql-java-split.md))

**완료 기준**: 배치를 두 번 돌려도 행 수가 같다, 백테스트에서 기준선 2개 대비 오차 수치, Java 반복 vs SQL 윈도 함수의 실행 시간 · 쿼리 횟수.

### M5 외부 신호 + 탄소

F14 · F20, N01 · N05(배치 감시).

- 딥 태스크: 🧩8 외부 API 장애, 🧩1 N+1(리포트 쿼리)
- 확인: 탄소 데이터 라이선스 · 국가 처리 계수([0011](decisions/0011-carbon-factors.md)), 공휴일 과거 연도 조회

**완료 기준**: 외부 API를 끊어도 예측이 돈다("날씨 없이 계산함" 표시), 날씨 넣기 전후 백테스트 오차 비교, 마지막 예측 성공이 26시간을 넘으면 uptime이 실패한다, 탄소 리포트에 출처 표시.

### M6 마감 점검

전역 "마일스톤 닫기 전 점검"을 M 전체에 대해 한다. 그 뒤 S 기능(REQUIREMENTS 2절)으로.

**완료 기준**: 문서 ↔ 코드 대조 표와 전체 검증 관찰값이 DEVLOG에, 운영 주소에서 로그인 → 입력 → 권장 → 리포트.

## 4. 딥 태스크

포트폴리오의 간판이다. 겪은 날 **커밋 메시지**(COMMIT_CONVENTION ②의 문제 → 분석 → 해결 → 수치) + **DEVLOG 날짜 블록 제목에 `🧩n`**으로 남기고, 끝내면 README "딥 태스크" 표에 한 줄을 채운다. 따로 문서를 두지 않는다(CLAUDE.md "문서 함정 막기").

| # | 주제 | 단계 | 이 스택에서 |
|---|---|---|---|
| 🧩1 | N+1 → JOIN · 인덱스 | M5 | JPA 지연 로딩에서 저절로 생긴다 → fetch join · `@EntityGraph` · 배치 사이즈 비교, `EXPLAIN ANALYZE` 전후 ms |
| 🧩2 | 트랜잭션 | M2 | 반쪽 저장을 테스트로 먼저 재현 → `@Transactional`. 함정: checked 예외는 기본 롤백 안 됨, 같은 클래스 안 호출은 프록시를 안 탄다 |
| 🧩3 | 배치 멱등성 | M4 | 두 번 돌려 중복 확인 → `ON CONFLICT DO UPDATE` |
| 🧩4 | 엣지 케이스 | M4 | 휴무일과 판매 0 구분, 신메뉴 콜드스타트, 품절일(검열된 수요) |
| 🧩5 | 배포 | 첫 배포 | 환경변수 · 프록시 · DB 계정 둘 · JVM 메모리 |
| 🧩6 | RLS | M2 | 커넥션 풀 위에서 트랜잭션마다 매장 값 넘기기, 슈퍼유저 테스트 함정 |
| 🧩7 | 윈도 함수 특징 · 백테스트 | M4 | Java 반복 vs SQL 한 번 |
| 🧩8 | 외부 API 장애 | M5 | 타임아웃 · 재시도 · 캐시 · 원본 저장, 없어도 도는 예측 |
