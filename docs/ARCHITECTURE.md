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
| Lombok | 쓴다 (2026-11-07) — 국내 실무 코드와 모양을 맞춘다. 규칙은 2절 끝 | Java `record`가 있어 DTO에는 안 쓴다 |
| 테스트 | JUnit 5 + Testcontainers(진짜 PostgreSQL) | H2 같은 가짜 DB는 RLS · 윈도 함수 · `ON CONFLICT`가 다르게 돈다 |
| API 문서 | springdoc-openapi | 엔드포인트 목록의 원본. Spring REST Docs는 정확하지만 손이 많이 간다 |
| 배치 | 앱 안 `@Scheduled(cron = …, zone = "Asia/Seoul")` | Spring Batch는 대형 배치용이라 과하다 |
| 프런트 | Angular SPA + TypeScript(signals) + Tailwind 4 + spartan/ui, 패키지 관리자 **pnpm**. SSR 없음 | [0013](decisions/0013-frontend-angular.md) |
| 움직임 | Angular 내장 `animate.enter` / `animate.leave` + GSAP(소개 · 리포트만, 지연 로딩) | [0014](decisions/0014-motion-gsap.md) |
| 차트 | Apache ECharts + ngx-echarts, 쓰는 부품만 등록 · SVG 렌더러 · 차트 화면만 지연 로딩 | [0015](decisions/0015-charts-echarts.md) |
| 운영 | 컨테이너 + Caddy, 이미지 GHCR, 백업 R2 — PlayLedger 틀 재사용 | [0012](decisions/0012-ops-reuse-playledger.md) |
| 주소 | `zwfnb.sagming.com` (Cloudflare DNS만 · 회색 구름, HTTPS는 Caddy) | 레포 이름과 이어지고 휴대폰으로 치기 쉽다 |

## 2. 레포 · 코드 구조

**한 레포, 세 폴더**: `backend/`(Gradle) · `frontend/`(pnpm) · `infra/`(compose · Caddy · 운영 스크립트). 기능 하나를 앞뒤로 고치면 커밋 하나로 끝난다.

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
- **Lombok 규칙**: 요청 · 응답 · "특징 한 줄" 같은 값 객체는 `record`(Lombok 안 씀). JPA 엔티티는 `@Getter` + `@NoArgsConstructor(access = PROTECTED)`까지만 — `@Data` · `@Setter` · `@EqualsAndHashCode` · 연관관계를 포함한 `@ToString`은 쓰지 않는다(양방향 연관에서 `toString` 무한 순환, 지연 로딩 프록시와 equals 충돌, 아무 데서나 값이 바뀜). 서비스 생성자 주입은 `@RequiredArgsConstructor`. `lombok.config`에 `lombok.addLombokGeneratedAnnotation = true`
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

새 기기는 8.1의 순서대로 세팅하고, 확인한 값을 8.3 표에 남긴다. **회사 PC는 8.2 체크리스트**(8.1에 회사 사정 — 권한 · 네트워크 · 회사 git 계정 — 을 더해 처음부터 편 것). 순서는 노트북에서 실제로 해 본 것이다(2026-11-08, [archive/DEVLOG_M0](archive/DEVLOG_M0.md) 같은 날 블록).

### 8.1 새 기기 세팅 순서 (Windows)

**① 설치할 것** — 버전은 그 기기에서 확인해 8.3에 적는다

| 도구 | 확인 명령 | 비고 |
|---|---|---|
| JDK 25 (Temurin 권장) | `java -version` | `build.gradle` toolchain이 25를 요구한다 |
| Docker Desktop | `docker version` → `Server:` 부분이 나와야 함 | 앱을 켜야 엔진이 뜬다. `Client:`만 나오고 `failed to connect ... dockerDesktopLinuxEngine`이면 앱이 꺼진 것 |
| Git | `git --version` | |
| Node.js 24 LTS · pnpm | `node -v` · `pnpm -v` | 프런트(Angular 22). 처음 받으면 `frontend/`에서 `pnpm install` |
| GitHub CLI | `gh --version` | `winget install --id GitHub.cli` → 터미널 새로 열기 → `gh auth login`(GitHub.com · HTTPS · Git 인증 Yes · 웹 브라우저) → `gh auth status` |

Gradle은 설치하지 않는다 — 레포의 wrapper(`gradlew`)가 받아 온다.

**② PowerShell 한글 깨짐 막기** — Windows 콘솔 기본값은 CP949(`chcp` → 949)이고 Gradle · Spring은 UTF-8로 내보내서 한글이 `寃곌낵`처럼 깨진다. `code $PROFILE`(없으면 `if (!(Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }` 먼저)로 프로필을 열어 **맨 아래**에 붙인다. conda가 써 둔 `#region conda initialize` 블록은 건드리지 않는다.

```powershell
# 콘솔 글자를 UTF-8로 (BOM 없음 ─ BOM이 붙으면 다른 프로그램에 넘기는 글 맨 앞에 보이지 않는 글자가 낀다)
$utf8 = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = $utf8   # 화면에 찍는 글자
[Console]::InputEncoding  = $utf8   # 키보드로 넣는 글자
$OutputEncoding           = $utf8   # PowerShell → 다른 프로그램(git 등)으로 넘기는 글자
```

터미널을 새로 열고 `chcp` → `65001`, `[Console]::InputEncoding.WebName` · `$OutputEncoding.WebName` → 둘 다 `utf-8`이면 된다. 프로필은 레포 밖이라 기기마다 한 번씩 한다.

- **프로필 파일은 "UTF-8 with BOM"으로 저장한다.** Windows PowerShell 5.1은 BOM 없는 파일을 CP949로 읽어서, 한글 주석이 깨지며 줄바꿈까지 먹는다 — 첫 줄(`OutputEncoding`)만 적용되고 아래 두 줄이 주석에 삼켜진다(회사 PC 2026-11-09). 오류가 안 나서 모르고 지나가기 쉽다. VS Code 오른쪽 아래 `UTF-8` → Save with Encoding → UTF-8 with BOM. 위 주석의 "BOM 없음"은 콘솔로 내보내는 글자 얘기고, 프로필 파일 자체와는 다르다

**③ VS Code 확장** — Java 언어 서버는 **Red Hat(`redhat.java`) 하나만**. Oracle 것(`oracle.oracle-java`)이 같이 있으면 같은 오류가 두 번 뜨고 알림이 계속 뜬다. Java 팩 · Spring 확장은 전부 Red Hat 쪽에 붙어 돈다.

- 처음 까는 기기: 팩 두 개만 깐다. 필요한 확장(redhat.java · 디버그 · 테스트 · Maven · Gradle · 프로젝트 보기 / Spring Boot 도구 · Initializr · 대시보드)은 팩이 끌어온다

  ```powershell
  code --install-extension vscjava.vscode-java-pack
  code --install-extension vmware.vscode-boot-dev-pack
  ```

- 이미 깔려 있는데 꼬였으면(알림이 계속 뜸, Oracle 확장이 있음): **VS Code를 다 닫고** 바깥 PowerShell에서 전부 지운 뒤 위 두 줄로 다시 깐다. 팩을 지우면 팩이 끌어온 확장도 같이 지워지므로 뒤쪽 줄은 `is not installed`가 떠도 정상이다

  ```powershell
  $exts = @(
    'vmware.vscode-boot-dev-pack', 'vscjava.vscode-java-pack',
    'vmware.vscode-spring-boot', 'vscjava.vscode-spring-boot-dashboard', 'vscjava.vscode-spring-initializr',
    'vscjava.vscode-java-debug', 'vscjava.vscode-java-test', 'vscjava.vscode-java-dependency',
    'vscjava.vscode-maven', 'vscjava.vscode-gradle',
    'oracle.oracle-java', 'redhat.java'
  )
  foreach ($e in $exts) { code --uninstall-extension $e }
  code --list-extensions | Select-String "java|spring|gradle|maven|oracle"   # 아무것도 안 나오면 다 지워진 것
  ```

- 깐 뒤 VS Code에서 레포를 열고
  1. `Ctrl + Shift + P` → `Java: Clean Java Language Server Workspace` → Restart and delete (옛 분석 캐시가 꼬여 있으면 다시 깔아도 알림이 남는다)
  2. 오른쪽 아래 `Java: Ready`, Problems 0 확인
  3. 설정(`Ctrl + ,`) → `update build configuration` → **`automatic`** (build.gradle을 고칠 때마다 "동기화할래?"를 묻지 않고 다시 읽는다. 지금 한 번만 다시 읽히려면 `Java: Reload Projects`, `Shift + Alt + U`)
  4. "Null annotation types have been detected" 알림 → **Enable** (Spring 7의 JSpecify `@Nullable`을 읽어 null 위험을 편집기에서 노란 줄로. 빌드 · CI와는 상관없고, 설정은 git에 안 들어가는 `.vscode/`에 저장된다)
- `build.gradle`(Groovy)에는 이모지를 쓰지 않는다 — 🧑‍🏫처럼 보이지 않는 접착 문자(ZWJ)로 붙인 이모지를 Gradle 확장 파서가 거부한다

**④ 확인** — README "시작하기"를 그대로 따라간다: 개발 DB `healthy` → `bootRun`(local) → `/actuator/health` `UP` → `backend/`에서 `.\gradlew test --rerun` → 마지막 줄 `전체 n건, 통과 n`(CI와 같은 건수) → `frontend/`에서 `pnpm install` · `pnpm test --watch=false` → `pnpm start` 화면의 "서버 상태 확인"이 정상 (UP).

### 8.2 회사 PC 처음 세팅 — 체크리스트

8.1을 회사 PC 사정에 맞춰 처음부터 끝까지 순서대로 편 것이다. 회사 PC는 관리자 권한 · 설치 정책 · 회사 네트워크(프록시 · 보안 검사) · 회사 계정이 이미 깔린 git 때문에 집 · 노트북에서 안 겪은 문제가 난다. 줄마다 확인하고, 막히면 증상을 DEVLOG에 남긴다. 전역 원칙대로 회사 PC에는 **개인 계정 열쇠(복구 코드 · 패스키 · 비밀번호 관리자 확장)를 두지 않는다**.

**0. 시작 전에 (5분)**
- [ ] 다른 기기에 안 올린 변경이 없는지 — 그 기기에서 `git status`가 깨끗하고 `git log origin/main..`이 비어 있어야 한다
- [ ] 개인 레포를 회사 PC에 받아도 되는지 회사 정책 확인(이미 cbt-journal · PlayLedger를 회사 PC에서 쓰고 있으면 같은 기준)
- [ ] **Docker Desktop 라이선스**: 직원 250명 이상 또는 매출 1,000만 달러 이상인 회사 기기에서는 유료 구독이 필요하다. 회사가 구독이 없으면 무료 대안 **Rancher Desktop**(엔진 dockerd 선택) — Testcontainers도 그 위에서 돈다. 어느 쪽을 깔았는지 8.3에 적는다

**1. 설치** — 회사 소프트웨어 센터가 있으면 거기서, 없으면 `winget`(관리자 권한이 필요할 수 있다). 하나 깔 때마다 **터미널을 새로 열고** 확인 명령을 친다(새 PATH는 새 창만 안다)

| 순서 | 도구 | 설치 | 확인 |
|---|---|---|---|
| 1 | Git | `winget install --id Git.Git` | `git --version` |
| 2 | VS Code | `winget install --id Microsoft.VisualStudioCode` | `code --version` |
| 3 | JDK 25 | `winget install --id EclipseAdoptium.Temurin.25.JDK` | `java -version` → 25 |
| 4 | Docker Desktop (또는 Rancher Desktop) | `winget install --id Docker.DockerDesktop` → **재부팅** · WSL2 설치 안내를 따른다 → 앱을 켠다 | `docker version`에 `Server:`가 나온다 |
| 5 | Node.js **24 LTS** | nodejs.org에서 v24 Windows Installer(.msi) — 다른 기기와 같은 24줄로 맞춘다. 26 LTS도 Angular 22가 지원하지만 기기마다 다르면 원인 찾기가 어렵다 | `node -v` → v24.x(24.15 이상) |
| 6 | pnpm 12 | `npm install -g pnpm@12.15.0` — `frontend/package.json`의 `packageManager`와 같은 버전 | `pnpm -v` → 12.15.0 |
| 7 | GitHub CLI | `winget install --id GitHub.cli` | `gh --version` |

- `pnpm -v`가 "**이 시스템에서 스크립트를 실행할 수 없으므로**"로 막히면 PowerShell 실행 정책이다: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. 회사 정책(GPO)이 이것도 막으면 `pnpm.cmd`로 부르거나 Git Bash에서 친다. 같은 이유로 ②의 프로필도 안 읽힌다

**2. GitHub 로그인 — 개인 계정**
- [ ] `gh auth status`부터. 회사 계정으로 이미 로그인돼 있으면 **덮어쓰지 말고 개인 계정을 더한다**: `gh auth login`(GitHub.com · HTTPS · Git 인증 Yes · 웹 브라우저) → 브라우저에서 **sagming40**으로 승인
- [ ] 두 계정이면 `gh auth switch`로 이 레포 작업 때 sagming40을 고른다. `gh auth status`의 Active account 확인
- [ ] 브라우저 로그인은 회사 Chrome 프로필이 아니라 개인용 창(시크릿 창이나 별도 프로필)에서 하고, 승인 뒤 GitHub에서 로그아웃한다

**3. 클론 + 이 레포만 개인 이름으로**
```powershell
New-Item -ItemType Directory -Force C:\_dev
cd C:\_dev
git clone https://github.com/sagming40/zero-waste-fnb.git
cd zero-waste-fnb
git config user.name  "sagming40"
git config user.email "<GitHub 계정 이메일 또는 noreply 주소>"
git config user.email    # 회사 메일이 아니어야 한다
```
- **왜**: 회사 PC는 전역 git 이름 · 메일이 회사 것으로 잡혀 있기 쉽다. `--global` 없이 치면 이 레포에만 적용된다. 확인 안 하고 커밋하면 회사 메일이 공개 레포 기록에 영원히 남는다
- 경로는 다른 회사 PC 레포와 같은 `C:\_dev\`

**4. 회사 네트워크 확인** — 세 군데에서 받아 와야 한다. 하나씩 먼저 찔러 본다

| 무엇 | 확인 | 막히면 |
|---|---|---|
| Gradle · Maven Central | `backend/`에서 `.\gradlew --version` 뒤 `.\gradlew build -x test` | `PKIX path building failed` · `unable to find valid certification path` = 회사가 HTTPS를 중간에서 검사한다. 회사 루트 인증서를 JDK 신뢰 목록에 넣어야 한다(IT에 인증서 파일 요청) |
| npm 레지스트리 | `frontend/`에서 `pnpm install` | `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` = 같은 원인. 회사 인증서 파일을 `NODE_EXTRA_CA_CERTS` 환경 변수로 |
| Docker Hub | `docker pull postgres:18` | 회사 프록시면 Docker Desktop → Settings → Resources → Proxies |

- 프록시 주소 · 인증서 위치는 회사 값이라 레포에 적지 않는다. 겪은 증상과 푼 방법만 DEVLOG에

**5. 포트 비어 있는지** — 5433(개발 DB) · 8080(Spring) · 4200(Angular)
```powershell
Get-NetTCPConnection -State Listen | Where-Object LocalPort -in 5433,8080,4200
```
아무것도 안 나와야 한다. 회사 프로그램이 쓰고 있으면 무엇이 쓰는지 DEVLOG에 적고 바꿀 포트를 같이 정한다

**6. 8.1의 ② ③** — PowerShell UTF-8 프로필(위 1의 실행 정책을 먼저), VS Code 확장(팩 두 개) · 설정 두 개. 회사 VS Code에 이미 Oracle Java 확장이 있으면 8.1 ③의 "꼬였으면" 절차로 정리한다. Claude Code 확장 · 데스크톱 앱은 회사 정책을 보고

**7. 8.1의 ④ 끝까지 따라가기** — README "시작하기" 1 ~ 4
- [ ] 개발 DB `healthy`
- [ ] `bootRun` → `/actuator/health` `UP`
- [ ] `.\gradlew test --rerun` → `전체 n건, 통과 n`(CI와 같은 건수)
- [ ] `frontend/`: `pnpm install` → `pnpm test --watch=false` 통과 → `pnpm start` → "서버 상태 확인" 정상 (UP)
- [ ] 목업: `start docs\mockups\Map.html`

**8. 결과 남기기** — 8.3 회사 PC 줄에 버전 · 경로 · 고른 Docker 종류 · 막힌 것을 적고, CLAUDE.md "환경"의 경로 줄에 회사 PC 경로를 더한다

**회사를 옮기거나 PC를 반납할 때**
- `gh auth logout --user sagming40`, GitHub → Settings → Applications에서 그 기기의 GitHub CLI 승인 취소
- `C:\_dev\zero-waste-fnb` 삭제(먼저 `git status`로 안 올린 것 확인), `docker compose -f infra/compose.local.yaml down -v`로 개발 DB 볼륨 삭제
- 8.3에서 회사 PC 줄을 "반납"으로

### 8.3 기기별 상태

| 기기 | 경로 | 상태 (확인한 날) |
|---|---|---|
| 노트북 | `C:\_dev\zero-waste-fnb` | 8.1 전부 ✅ (2026-11-08): JDK 25.0.5, Docker Desktop 4.97.0 · 엔진 29.9.2, GitHub CLI 2.103.3, 프로필 UTF-8(`chcp` 65001), 확장 다시 설치(`redhat.java` 1.58.0 · Java 팩 0.31.2 · Spring Boot 팩 0.2.2, Oracle 없음), `./gradlew test` 2건 통과. 로컬 PostgreSQL 18 서비스 있음 |
| 집 PC | `D:\_dev\zero-waste-fnb` | JDK Temurin 25.0.2(PATH, `JAVA_HOME` 비어 있음) · Java 팩 · Gradle · Tailwind 확장 ✅, Docker 29.8.2 엔진 동작 ✅, Node 24.15 · pnpm 12.15 (2026-11-07). 8.1 ② ③ ✅ (2026-11-08): GitHub CLI 2.103.3(`gh auth status` sagming40), 프로필 UTF-8(`chcp` 65001), `redhat.java` 1.58.0 · Java 팩 0.31.2 · Spring Boot 팩 0.2.2, Oracle 없음, 설정 두 개(automatic · Null 분석) |
| 회사 PC | `C:\_dev\zero-waste-fnb` | 8.2 전부 ✅ (2026-11-09): JDK Temurin 25.0.5, **Docker Desktop** 4.96.3 · 엔진 29.9.2(회사 라이선스 확인은 아직), Node 24.22.0 · pnpm 12.15.0(winget), GitHub CLI 2.103.3(`gh auth status` sagming40), git 이 레포 메일 = 개인 Gmail(회사 메일 아님), 프로필 UTF-8(**BOM 붙여 다시 저장** — 8.1 ②), `redhat.java` 1.58.0 · Java 팩 0.31.2 · Spring Boot 팩, Oracle 없음. 회사 네트워크: Gradle · npm · Docker Hub 다 인증서 문제 없음(npm은 느림 경고만). 포트 5433만 사용 중(개발 DB). `bootRun` → 화면 "정상 (UP)", `./gradlew test` 2건 통과, `pnpm test` 4건 통과. 파이썬 없음 → 목업 미리보기는 `mockups-node` |

- 로컬 DB는 compose의 PostgreSQL을 쓴다. 기기에 깔린 PostgreSQL 18 서비스와 포트가 겹치지 않게 compose 쪽 포트를 5433으로 연다
- 비밀값은 `.env`에만(`.gitignore` 등록). 개발용 DB 비밀번호는 내 PC 전용 값이라 compose · 설정 파일에 그냥 둔다. 견본 `.env.example`은 첫 진짜 비밀값(M2 도로명주소 키) 때 만든다
- 줄바꿈은 루트 `.gitattributes`가 정한다(기본 LF, Windows 스크립트만 CRLF) — PC마다 다른 `core.autocrlf`보다 먼저다
