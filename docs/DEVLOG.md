# 개발 일지

> **겪은 일 · 막힌 일 · 배운 것을 적는 문서다** — 최신이 위.
> 진행 상황은 [PLAN](PLAN.md), 결정의 이유는 [decisions/](decisions/README.md). 딥 태스크를 겪은 날은 블록 제목에 `🧩n`을 붙인다.

## 현재 상태

- **지금 단계**: M0 재정비 + 뼈대 — 재설계 · 문서 재정비 끝
- **다음에 할 일**: M0 닫기 점검(README "시작하기"를 노트북에서 처음부터 따라가기 포함)
- **개발 DB 켜기**: `docker compose -f infra/compose.local.yaml up -d`, 앱은 `backend/`에서 `.\gradlew bootRun --args="--spring.profiles.active=local"`
- **기기별로 할 일**
  - 집 PC: ARCHITECTURE 8.1의 ② PowerShell UTF-8 · ③ 확장 정리(Spring Boot 팩, Oracle 확인, 설정 두 개) · GitHub CLI
  - 회사 PC: 처음 클론 + ARCHITECTURE 8.1을 처음부터

---

## 2026-11-08 (2) · M0 닫기 점검 (노트북)

**1. 문서 ↔ 코드 대조** (PLAN M0 · ARCHITECTURE 2 · 8절 · decisions 0002 ~ 0005)

| 항목 | 결과 | 근거 |
|---|---|---|
| M0 의존성(Web · JPA · PostgreSQL · Flyway · Actuator · Validation · Testcontainers · Modulith test만 · Lombok) | 구현됨 | `backend/build.gradle` |
| Boot 4.1.2 · Java 25 toolchain · Gradle 9.8.2 · `com.sagming.zwfnb` | 구현됨 | `build.gradle`, wrapper |
| 옛 코드 삭제 + 태그 `v0-express` | 구현됨 | `git ls-files` |
| `.gitattributes` 줄바꿈, `gradlew` 실행 권한 | 구현됨 | 인덱스 모드 `100755` |
| `bin/` · `build/` · `.gradle` 무시 | 구현됨 | `git check-ignore` → `backend/.gitignore` |
| Testcontainers `postgres:18` 고정 | 구현됨 | `TestcontainersConfiguration` |
| compose 5433 · 공용 `application.yml`(DB 정보 없음 · OSIV 끔 · `ddl-auto: validate`) · `application-local.yml` | 구현됨 | 설정 파일 |
| Modulith 검사 테스트(0005) | 구현됨 | `ModularityTests`, 위반 실습 빨간불 |
| CI | 구현됨 | Actions 최근 3회 success |
| `lombok.config`(ARCHITECTURE 2절) | 일부러 미룸 → M2 | Lombok을 쓰는 코드가 아직 없다. PLAN M2에 "첫 엔티티 전에" |
| Flyway V1 · DB 계정 둘 · 프런트 뼈대 | 일부러 미룸 | PLAN에 M2 · M1로 이미 있음 |

**2. 전체 검증**
- `./gradlew clean build --warning-mode all` → BUILD SUCCESSFUL 51s, **전체 2건 통과 2**, 폐기 경고 0, `zwfnb-0.0.1-SNAPSHOT.jar` 56MB
- README "시작하기"를 노트북에서 그대로: compose `ps` → `healthy`(5433) → `bootRun`(local) `Started ZwfnbApplication in 8.819 seconds`, PostgreSQL 18.6, Flyway가 노트북 DB에 `flyway_schema_history`를 처음 만듦(0 migrations, "No migrations found" WARN은 V1 전이라 정상), actuator 엔드포인트 1개 → `curl.exe /actuator/health` → `{"groups":["liveness","readiness"],"status":"UP"}`

**3. 문서끼리** — CLAUDE.md 문서 지도의 "실행 방법(M0 뒤)", PLAN 진행 현황 "뼈대 남음"을 고침

**4. 안전 점검** — 레포의 비밀번호는 개발 DB `zwfnb` 두 곳뿐(compose · `application-local.yml`, ARCHITECTURE 8.2대로 내 PC 전용). git 역사 전체에 `ghp_` · `gho_` · `AKIA` · 개인 키 없음. 의존성 경고는 Gradle 기본 도구가 없어 Dependabot(첫 배포)으로. 남의 데이터 · 비로그인 테스트는 M2(인증 · RLS)부터

*(계획에 없던 작업)* `.vscode/extensions.json` — 다른 기기에서 레포를 열면 두 팩을 추천하고 Oracle 확장은 원치 않음으로(ARCHITECTURE 8.1 ③)

---

## 2026-11-08 (1) · Modulith 검사 테스트 (노트북)

**한 일**
- `ModularityTests`: `ApplicationModules.of(ZwfnbApplication.class).verify()`. 스프링 컨텍스트 · Docker 없이 돈다. 기능 폴더가 없어 모듈 0개로 통과(1건, 3.12s) — `f130c17`
- **일부러 위반해서 빨간불 확인**(커밋 안 함): `menu.MenuPeek`가 `store.internal.StoreSecret`을 부르게 하자 `BUILD FAILED`, 모듈 2개(`store` · `menu`)를 찾고 `Module 'menu' depends on non-exposed type com.sagming.zwfnb.store.internal.StoreSecret within module 'store'!`. 컴파일은 통과한다 — 막는 건 이 테스트뿐. 실습 파일을 지우고 다시 통과(5s)
- **CI**: `.github/workflows/ci.yml` — push(main) · PR마다 ubuntu-latest + Temurin 25 + setup-gradle에서 `./gradlew test`, 실패 때만 리포트 artifact. 첫 실행(`6fde811`) 초록불, 작업 1m 26s 중 `gradlew test` 1m 3s(Testcontainers 포함), artifact 단계는 skipped. 러너 JDK 25.0.5
- **테스트 건수 출력**: Gradle은 통과한 테스트를 로그에 찍지 않아 첫 CI에선 건수를 못 봤다. `testLogging`(passed · skipped · failed) + `addTestListener`로 합계 한 줄 — `9b346e8`. CI 로그: `ModularityTests PASSED` · `ZwfnbApplicationTests PASSED` · **전체 2건, 통과 2**
  - 처음 쓴 `afterSuite { }` · `exceptionFormat 'full'`은 `--warning-mode all`에서 Gradle 10 폐기 경고 → `addTestListener` · `exceptionFormat = 'full'`
  - 로그 설정만 바꾸면 테스트는 up-to-date로 다시 안 돈다 → `--rerun`
  - build.gradle 주석의 🧑‍🏫(ZWJ `0x200D`로 붙인 이모지)를 Groovy 파서가 거부 — build.gradle엔 이모지를 쓰지 않는다
  - PowerShell에서 한글 합계가 `寃곌낵`로 깨짐: Gradle은 UTF-8, 콘솔은 CP949(949). 리눅스 CI는 정상. PowerShell 프로필에 `[Console]::OutputEncoding` · `InputEncoding` · `$OutputEncoding`을 BOM 없는 UTF-8로 → `chcp` 65001, 한글 합계 정상
  - VS Code Gradle 확장이 `TestListener`를 "unable to resolve class"(힌트)로 표시 — 확장의 정적 분석이 Gradle 기본 import(`org.gradle.api.tasks.testing.*`)를 모르는 것. 실제 빌드 · CI는 통과
- 노트북에 GitHub CLI 설치(winget, 2.103.3) + `gh auth login`(HTTPS, git 인증 연동)
- 노트북 VS Code: 오른쪽 아래 Java 알림이 계속 떠서 Java · Spring 확장 12개를 지우고 두 팩만 다시 설치(Oracle 언어 서버는 빼서 Red Hat 하나만), `Java: Clean Java Language Server Workspace` → `Java: Ready` · Problems 0, Gradle 확장의 `TestListener` 힌트도 사라짐. 팩을 지우면 부품도 같이 지워진다. 동기화 "Always"는 설정 `java.configuration.updateBuildConfiguration: automatic`
- 노트북 Docker Desktop 4.97.0(엔진 29.9.2)을 켜고 `./gradlew test --rerun` → **전체 2건, 통과 2**(41s). CI와 같은 결과
- 검수에서 잡은 것: `upload-artifact@4`(v 빠짐) — GitHub는 시작 전에 `uses:` 액션을 전부 받아서, 실패 때만 도는 단계라도 매번 작업이 시작도 못 한다

**막힌 것**
- 실습 파일을 `com/sagming/store/internal`(zwfnb 빠진 폴더)에 만들었는데 **Gradle 빌드는 통과**했다. 원인: `javac`는 `package` 선언으로 클래스 위치를 정하고 폴더가 틀려도 컴파일한다. VS Code(Java 확장)만 "declared package does not match the expected package"로 잡았다. 배운 것: 폴더 · 패키지 불일치는 빌드가 안 잡아 주니 Problems 창을 본다(설정 오타 때와 같은 교훈)

---

## 2026-11-07 (3) · M0 시작: 옛 코드 정리와 Spring 뼈대 (집 PC)

**한 일**
- 태그 `v0-express`(→ `93e31dc`, 옛 코드의 마지막 커밋)를 달고 `backend/`(Express) · `seed/` · `schema.sql` 삭제
- 루트 `.gitignore`를 레포 전체 규칙만으로(빌드 폴더는 각 폴더가), `.gitattributes`로 줄바꿈 통일(기본 LF, Windows 스크립트 CRLF). 옛 `.env.example` 삭제
- VS Code Spring Initializr로 `backend/` 생성: Boot 4.1.2 · Java 25 · Gradle 9.8.2 · `com.sagming.zwfnb`, Lombok 포함
- Initializr가 Modulith를 통째로(core · jpa · observability · runtime · actuator) 넣어서 `starter-test`만 남김, Testcontainers 이미지를 `postgres:latest` → `postgres:18`
- **첫 테스트**: `./gradlew test` → `ZwfnbApplicationTests` 1건 통과(실패 0, 8.07s). `postgres:18` 컨테이너 1.28s 기동, Flyway "0 migrations" 검증, 앱 조립 7.57s
- `gradlew`에 실행 권한(+x)을 git에 기록 — Windows에서 add하면 빠져서 Linux CI가 `Permission denied`로 죽는다
- 개발 DB: `infra/compose.local.yaml`(PostgreSQL 18.6, 5433) healthy. 설정은 공용 `application.yml`(DB 정보 없음 — 빠지면 안 뜨게) + `application-local.yml`. `bootRun`(local) 1.76s 기동, `GET /actuator/health` → `{"status":"UP"}`, 테스트 다시 1건 통과(5.23s)

**막힌 것**
- **`Rename-Item zwfnb backend`가 "다른 프로세스가 사용 중"으로 실패** — 원인: VS Code Java 확장이 새 `build.gradle`을 보자마자 프로젝트를 자동으로 가져오면서 Java 언어 서버 4개 + Gradle 데몬 2개가 폴더를 붙잡았다. 해결: VS Code 창 닫기 → `gradlew --stop`(1 Daemon stopped) → 이름 바꾸기 성공. 배운 것: **Initializr로 만들 땐 처음부터 최종 폴더 이름으로 만들거나, VS Code가 가져오기 전에 이름을 바꾼다**
- Initializr 질문에 "Package Name"이 Artifact 다음에 따로 나온다(확장 버전에 따라). Packaging인 줄 알고 `Jar`를 넣어 "Invalid Package Name"
- 새 PowerShell 창은 홈 폴더에서 열려서 `.\zwfnb\gradlew.bat`이 안 잡혔다 — 레포 폴더로 `cd` 먼저
- `spring.applicaton`(i 빠짐) 오타 — Spring은 모르는 설정 이름을 **오류 없이 무시**한다. VS Code Spring 확장의 `YAML_UNKNOWN_PROPERTY` 경고로 잡았고, 고친 뒤 로그에 `[zwfnb]`가 찍히는 걸로 확인. 배운 것: 설정 파일은 Problems 창을 꼭 본다
- `bootRun`이 `80% EXECUTING`에서 안 끝난다 — 정상. 서버를 켜 두는 작업이라 `Ctrl + C`까지 계속 "실행 중"
- 사전 검증에서 발견: PostgreSQL 18 이미지는 볼륨을 `/var/lib/postgresql`에 묶는다(17까지 `.../data`, cbt-journal에서 겪은 함정)

**이번 세션 커밋**: `0974dbe`(옛 코드 삭제) · `8d226c9`(.gitignore · .gitattributes) · `06d6e64`(Spring 뼈대), 문서 `27e7ed9` · 이 블록 커밋

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
