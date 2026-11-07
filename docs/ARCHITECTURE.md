# 아키텍처

> **코드가 어떻게 나뉘고 요청 · 배치가 어떻게 흐르는지, 인증, 개발 · 운영 환경을 적는 문서다.**
> 테이블 · 매장 격리 규칙은 [DATA_MODEL](DATA_MODEL.md), 기능 범위는 [REQUIREMENTS](REQUIREMENTS.md), 각 선택의 이유는 [decisions/](decisions/README.md). 엔드포인트 목록은 springdoc(Swagger)이 원본이라 여기 옮기지 않는다.

## 1. 한눈에

| 층 | 선택 | 이유 |
|---|---|---|
| 백엔드 | Java 25 (LTS) + Spring Boot 4.x, Gradle (Groovy DSL), 편집기 VS Code | [0002](decisions/0002-backend-java-spring.md) |
| DB | PostgreSQL 18 + Flyway | [0003](decisions/0003-postgresql-flyway.md) |
| DB 접근 | Spring Data JPA + JdbcClient | [0004](decisions/0004-jpa-jdbcclient.md) |
| 코드 구조 | 기능별 패키지 + Spring Modulith 검사 테스트 | [0005](decisions/0005-package-by-feature.md) |
| 인증 | Spring Security, 세션 쿠키 + CSRF, 세션은 Spring Session JDBC | [0006](decisions/0006-session-auth.md) |
| 테스트 | JUnit 5 + Testcontainers(진짜 PostgreSQL) | H2 같은 가짜 DB는 RLS · 윈도 함수 · `ON CONFLICT`가 다르게 돈다 |
| API 문서 | springdoc-openapi | 엔드포인트 목록의 원본. Spring REST Docs는 정확하지만 손이 많이 간다 |
| 배치 | 앱 안 `@Scheduled(cron = …, zone = "Asia/Seoul")` | Spring Batch는 대형 배치용이라 과하다 |
| 프런트 | **M1에서 정한다.** 후보 Angular 21+ · TypeScript · Tailwind · spartan/ui, 맞수 Thymeleaf + htmx | 화면을 그려 보고 상호작용이 얼마나 많은지 본 뒤. 패키지 관리자는 어느 쪽이든 **pnpm** |
| 운영 | 컨테이너 + Caddy, 이미지 GHCR, 백업 R2 — PlayLedger 틀 재사용 | [0012](decisions/0012-ops-reuse-playledger.md) |
| 주소 | `zwfnb.sagming.com` (Cloudflare DNS만 · 회색 구름, HTTPS는 Caddy) | 레포 이름과 이어지고 휴대폰으로 치기 쉽다 |

## 2. 레포 · 코드 구조

**한 레포, 세 폴더**: `backend/`(Gradle) · `frontend/`(pnpm) · `infra/`(compose · Caddy · 운영 스크립트). 기능 하나를 앞뒤로 고치면 커밋 하나로 끝난다. M1에서 Thymeleaf로 가면 `frontend/`만 빠진다.

**백엔드 패키지** — 기능별, 각 폴더 안에 controller · service · repository:

| 패키지 | 맡는 것 (REQUIREMENTS 2절) |
|---|---|
| `store` | 계정 · 매장 · 역할 · 초대 · "지금 매장" (F01 ~ F03) |
| `menu` | 메뉴 · 식자재 · 레시피 (F04 ~ F06) |
| `closing` | 마감 입력 · 남은 수량 행방 (F08) |
| `stock` | 입고 · 로트 · 원장 · 폐기 · 실사 · 유통기한 경고 (F09 ~ F12, F21) |
| `forecast` | 예측 · 생산 / 발주 권장 · 백테스트 (F13 ~ F18) |
| `report` | 손실 원화 · 폐기율 · 탄소 리포트 (F19 · F20) |
| `external` | 날씨 · 공휴일 · 주소 · 탄소 계수 수집과 원본 저장 (N01) |
| `common` | 시간(`Clock`) · 오류 응답 · 매장 컨텍스트 같은 공용 |

- **Spring Modulith는 검사 테스트만** 쓴다: 기능끼리 공개된 것만 부르는지 테스트가 지킨다. 모듈 이벤트는 쓰지 않는다 — 마감 저장 → 재고 차감은 한 트랜잭션이어야 하는데 이벤트는 커밋 뒤에 돈다
- **SQL이 강한 쿼리는 기능 패키지마다 SQL 전용 클래스 하나**(`StockQueries` 등)에 JdbcClient로 모으고, 클래스마다 Testcontainers 테스트를 붙인다 — 문자열 SQL의 오타는 실행해야 드러난다
- **시간**: 현재 시각을 직접 부르지 않고 `Clock`을 주입받는다. 영업일은 KST `LocalDate`, 시각은 `Instant`/`timestamptz`. 테스트에서 자정 · 날짜 경계를 만든다

## 3. 요청 흐름

```text
[개발]  브라우저 ─ 프런트 개발 서버 ─(/api 프록시)─ Spring (localhost) ─ PostgreSQL (compose)
[운영]  브라우저 ─ Caddy (HTTPS, zwfnb.sagming.com) ─┬─ 프런트 빌드 파일
                                                    └─ /api ─ Spring ─ PostgreSQL
```

- 개발 · 운영 모두 브라우저에는 한 주소로 보여서 CORS를 다루지 않는다
- 바깥에 여는 포트는 Caddy(80 · 443)뿐. Docker는 ufw를 우회하므로 Spring · PostgreSQL에 `ports`를 열지 않는다
- **오류 응답(안, M2에서 확정)**: RFC 9457 Problem Details(Spring 기본 지원). 검증 오류는 필드별 목록

## 4. 인증 · 권한 · 매장 격리

- **세션 쿠키 + CSRF**: Spring Security 필터 체인. CSRF 토큰은 쿠키(`XSRF-TOKEN`)로 내려 주고 요청 헤더로 받는다. 세션은 PostgreSQL(Spring Session JDBC) — 재시작해도 로그인 유지
- **역할**: 매장마다 점주 / 직원(`store_member`). 직원은 마감 입력 · 입고 · 폐기만
- **"지금 매장"**: 세션에 둔다. 매장을 고를 때 `store_member`로 권한을 확인한다. 업무 코드는 "지금 사용자 · 매장"을 **한 곳(매장 컨텍스트)에서만** 꺼내고 인증 방식을 모른다 → 모바일이 생기면 `/api/mobile/**`에 토큰 필터 체인만 더한다
- **세 겹 방어**: ① 앱이 매장으로 거른다 ② 복합 외래 키가 남의 매장 참조를 거부한다 ③ RLS가 행을 거른다. 규칙은 [DATA_MODEL 3절](DATA_MODEL.md#3-매장-격리-rls), 이유는 [0009](decisions/0009-rls.md)
- 트랜잭션 시작 때 매장 컨텍스트의 값을 DB에 `SET LOCAL`로 넘기는 연결 고리가 M2의 핵심 구현이다

## 5. 배치 · 예측 계산

- **자정 배치**(KST): 매장 목록을 돌며 **매장마다 트랜잭션 + `app.store_id`**. RLS를 건너뛰는 배치 전용 역할은 만들지 않는다
- **멱등성**: 같은 날 다시 돌려도 결과가 같다 — 예측은 실행 단위로 저장하고 같은 (매장, 대상일, 모델 버전)은 바꿔 쓴다(`ON CONFLICT`)
- **계산 분담** ([0010](decisions/0010-forecast-sql-java-split.md)):
  - **SQL(윈도 함수) = 과거에서 특징 뽑기**: 메뉴 × 날짜마다 요일 가중 WMA, 기준선(어제 `LAG(1)` · 지난주 같은 요일 `LAG(7)`), 최근 변동폭, 품절일 표시. 휴무일은 `business_day`로 거른다
  - **Java = 보정**: 날씨 · 공휴일 배율, 콜드스타트(같은 분류 평균), 생산 · 발주 권장
  - 둘 사이는 "특징 한 줄" 레코드로 주고받고, 양쪽 테스트를 따로 둔다
  - (선택) 날씨 민감도: `regr_slope` · `corr`로 메뉴별 "기온 1도당 판매 변화"를 SQL로 추정해 보정 배율의 근거로
- **백테스트**: 지난 날마다 "그날까지의 데이터만 보고" 예측을 다시 만든다. Java 반복(날마다 쿼리) vs SQL 윈도 함수 한 번을 비교한다

## 6. 외부 데이터 연동

- 외부 데이터는 **보조 신호**: 실패 · 지연 · 키 만료에도 예측은 요일 가중 WMA만으로 돈다. 타임아웃 · 재시도 · 캐시, 결과에 "날씨 없이 계산함" 표시
- **받은 원본은 DB에 쌓는다**(`external_fetch_log`의 `jsonb` + 정리한 표). 백테스트를 다시 돌려도 같은 입력이어야 비교할 수 있다
- **매장 위치 변환**: 도로명주소 → 좌표(좌표계 확인, UTM-K면 WGS84로) → 기상청 격자(nx, ny, 활용가이드 공식을 Java로) · 가장 가까운 ASOS 지점 · 지역 코드. 매장 등록 때 한 번 계산해 매장에 저장한다
- 감시: 마지막 수집 성공 시각을 헬스에 넣는다(7절)

## 7. 운영

PlayLedger · cbt-journal에서 검증된 틀을 가져온다 — [0012](decisions/0012-ops-reuse-playledger.md). 서버 세팅 · 실제로 친 명령은 첫 배포(M2 뒤) 때 `SERVER.md`에 적는다.

| 항목 | 방식 |
|---|---|
| 배포 | CI가 이미지를 GHCR에 커밋 해시 태그로 올리고 서버는 받기만(`task deploy`). 새 버전 헬스 실패 → 이전 이미지로 자동 복귀 |
| 서버 | 전부 컨테이너(Caddy 포함), 비밀값은 서버 `.env`(600) — 값이 보이게 열지 않는다 |
| 위치 · 크기 | 12월 AWS 이사 뒤(크레딧 결과로 서울 / 시드니). 크기는 아래 JVM 측정값을 보고 |
| JVM 메모리 | Spring Boot는 JVM만 300 ~ 500MB. `MaxRAMPercentage` · 컨테이너 메모리 제한 · 스왑을 잡고 실제 사용량을 잰다 |
| DB 계정 | Flyway = 테이블 소유자(`spring.flyway.user`), 앱 = 앱 역할(RLS 대상). 백업 · 복원도 둘을 챙긴다 |
| 헬스 | Actuator `/actuator/health`(DB · 디스크 · 마지막 예측 성공 · 마지막 외부 수집). 바깥에는 health만 연다 |
| 감시 | GitHub Actions `uptime` 30분마다 바깥에서 헬스 본문 · 인증서 · 디스크. **마지막 예측 성공이 26시간을 넘으면 실패** — 앱은 살아 있는데 배치만 죽은 경우 |
| 백업 | 매일 `pg_dump` → `age` 암호화 → 서버 안 14개 + Cloudflare R2(기존 계정, 새 버킷). 첫 배포 때 복원 연습 |
| 로그 | Spring Boot 기본 JSON 로그, 요청마다 추적 ID, Docker 로그 크기 제한. 로그 서버는 두지 않는다 |
| CI | 백엔드 `./gradlew test`(+ Modulith 검사, Testcontainers는 러너의 Docker), 프런트 pnpm 린트 · 테스트 · 빌드, main이면 이미지 빌드 |
| 나중 | 지표 수집(Prometheus · Grafana)은 메모리 때문에 L. Dependabot은 첫 배포 때 |

## 8. 개발 환경

| 기기 | 경로 | 상태 (확인한 날) |
|---|---|---|
| 노트북 | `C:\_dev\zero-waste-fnb` | JDK 25.0.5 · Java 팩 · Spring Boot 팩 · Gradle 확장 ✅. ⚠️ `oracle.oracle-java`는 `redhat.java`와 겹쳐 **사용 안 함**으로 끈다. ⚠️ Docker 엔진이 응답하지 않았다 — Docker Desktop을 켜야 한다. 로컬 PostgreSQL 18 서비스 있음 (2026-11-07) |
| 집 PC | `D:\_dev\zero-waste-fnb` | JDK Temurin 25.0.2(PATH, `JAVA_HOME` 비어 있음) · Java 팩 · Gradle · Tailwind 확장 ✅, Docker 29.8.2 엔진 동작 ✅, Node 24.15 · pnpm 12.15. ⚠️ Spring Boot Extension Pack 설치 필요(사용자가 설치한다고 함), Angular Language Service는 프런트가 정해지면 (2026-11-07) |
| 회사 PC | — | 처음 클론할 때 같은 항목(JDK 25 · VS Code 확장 · Docker 엔진)을 본다 |

- 로컬 DB는 compose의 PostgreSQL을 쓴다. 기기에 깔린 PostgreSQL 18 서비스와 포트가 겹치지 않게 compose 쪽 포트를 바꾼다(M0)
- 비밀값은 `.env`에만(`.gitignore` 등록), 견본은 `.env.example`
