# ♻️ ZeroWaste F&B

> **베이커리 카페의 내일 생산량 · 발주량을 권장하고, 낭비된 돈과 탄소를 보여 주는 웹 앱**
> 점주와 직원이 매일 마감 때 판매 · 폐기를 기록하면, 날씨 · 공휴일을 반영해 내일 무엇을 몇 개 만들고 어떤 재료를 얼마나 살지 알려 줍니다.

<p align="left">
  <img src="https://img.shields.io/badge/Java-25-ED8B00?logo=openjdk&logoColor=white" alt="Java"/>
  <img src="https://img.shields.io/badge/Spring_Boot-4-6DB33F?logo=springboot&logoColor=white" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white" alt="Angular"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/status-redesign-orange" alt="Status"/>
  <a href="https://github.com/sagming40/zero-waste-fnb/actions/workflows/ci.yml"><img src="https://github.com/sagming40/zero-waste-fnb/actions/workflows/ci.yml/badge.svg" alt="CI"/></a>
</p>

> ⚠️ **재설계 중입니다.** 2026-07의 Express 버전(v0, 태그 `v0-express`)을 버리고 처음부터 다시 만들고 있습니다. 진행 상황은 [docs/PLAN.md](docs/PLAN.md).

---

## 📌 한눈에 보기

| 항목 | 내용 |
| :--- | :--- |
| **대상** | 베이커리 카페 + 델리 메뉴(샐러드 · 샌드위치 · 도시락) — 당일 만들어 당일 폐기하는 품목과 유통기한 짧은 재료 |
| **하는 일** | 마감 기록 → 내일 **생산 권장 · 발주 권장** → 폐기 손실(원) · 폐기율 · 탄소 감축량 |
| **지표** | 돈(매일) + 탄소(월간 · 누적). "낭비된 돈을 줄이면 탄소도 같이 줄어든다" |
| **기술** | Java 25 · Spring Boot 4 · PostgreSQL 18(RLS · 윈도 함수) · Flyway · Testcontainers / Angular 22 · TypeScript · Tailwind 4 · spartan/ui · ECharts(차트) · GSAP(연출) |
| **성격** | 프런트 · 백엔드 · DB · 서버 · 배포 · 운영까지 혼자 설계 · 구현하는 자기계발 프로젝트 |

## 🎯 문제 정의

- **🌍 환경**: UNEP『Food Waste Index Report 2024』에 따르면 음식물의 손실 · 폐기는 전 세계 온실가스 배출량의 **8 ~ 10%**를 차지합니다.
- **🏪 시장(국내)**: KDI『나라경제』(2025.09) · 국세청 통계 기준, 2024년 폐업 신고 사업자는 **100만 8,282명**으로 처음 100만 명을 넘었고 음식점업이 폐업률 상위 업종입니다. 2023년 소상공인 평균 영업이익률은 **5% 미만**입니다.
- **🧩 페인포인트**: 작은 가게는 생산 · 발주를 감으로 정해서, 남는 빵과 재료가 폐기되고 얼마나 낭비됐는지도 모릅니다.

> **가설**: 판매 기록 + 요일 가중 이동 평균 + 날씨 · 공휴일만으로도 "지난주 같은 요일만큼"보다 예측 오차를 줄일 수 있다 — **백테스트**로 확인합니다.
> 단, 실제 매장 데이터가 없어 데모 데이터로 검증합니다. 데모 데이터에 넣은 효과를 되찾는지(파이프라인이 맞게 도는지)까지만 확인한다는 한계가 있습니다.

## ✨ 핵심 기능 (MVP)

- **📝 마감 입력** — 영업 / 휴무, 메뉴별 판매 · 만든 수량 · 남은 수량 · 품절 여부, 남은 빵의 행방(폐기 · 할인 · 직원식 · 기부). 휴대폰으로
- **📦 재고** — 입고 로트(유통기한 · 단가) · 원장 · 유통기한 빠른 것부터 차감 · 실사 · 임박 경고
- **🧠 예측 · 권장** — 내일 판매 예측 → 생산 권장 · 발주 권장, 백테스트 리포트
- **🌦️ 공공 데이터** — 기상청 예보 · 과거 관측, 천문연 공휴일, 도로명주소. 끊겨도 예측은 돈다
- **📊 리포트** — 오늘 손실(원) · 폐기율, 월간 탄소 감축(재료별 계수)
- **🏪 여러 매장 · 역할** — 점주 · 직원, 남의 매장 데이터는 앱 · 외래 키 · RLS 세 겹으로 차단

전체 기능 목록은 [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

## 🧩 딥 태스크

이 프로젝트에서 일부러 깊게 파는 주제입니다. 끝낸 것부터 결과를 채웁니다.

| # | 주제 | 결과 |
| :--- | :--- | :--- |
| 1 | N+1 → JOIN · 인덱스 (`EXPLAIN ANALYZE` 전후) | — |
| 2 | 트랜잭션 (반쪽 저장 재현 → `@Transactional`) | — |
| 3 | 배치 멱등성 (`ON CONFLICT`) | — |
| 4 | 엣지 케이스 (휴무일 · 콜드스타트 · 품절일) | — |
| 5 | 배포 (JVM 메모리 · DB 계정 둘) | — |
| 6 | 행 수준 보안(RLS) | — |
| 7 | 윈도 함수 특징 · 백테스트 (Java 반복 vs SQL) | — |
| 8 | 외부 API 장애를 견디는 배치 | — |

## 📚 문서

| 문서 | 내용 |
| :--- | :--- |
| [PLAN](docs/PLAN.md) | 단계 · 완료 기준 · 진행 현황 |
| [REQUIREMENTS](docs/REQUIREMENTS.md) | 개요 · 기능 · 외부 데이터 · 한계 |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | 코드 구조 · 흐름 · 인증 · 운영 · 개발 환경 |
| [DATA_MODEL](docs/DATA_MODEL.md) | 테이블 · 관계 · 매장 격리 · 재고 규칙 |
| [DESIGN](docs/DESIGN.md) · [mockups/](docs/mockups/README.md) | 화면 규칙 · 색 · 움직임, 화면 시안 |
| [decisions/](docs/decisions/README.md) | 왜 이렇게 정했나 |
| [DEVLOG](docs/DEVLOG.md) | 개발 일지 |

## 🚀 시작하기

**준비물**: JDK 25, Docker(Windows · macOS는 Docker Desktop), 프런트는 Node.js 24 + pnpm. Gradle은 레포의 wrapper(`gradlew`)가 받아 오므로 따로 설치하지 않습니다.
명령은 PowerShell 기준이며 macOS · Linux는 `.\gradlew` 대신 `./gradlew`입니다. 새 기기 세팅 순서와 기기별 상태는 [ARCHITECTURE 8절](docs/ARCHITECTURE.md#8-개발-환경).

**1. 개발 DB 켜기** (레포 루트에서) — PostgreSQL 18이 `localhost:5433`에 뜹니다(5432는 PC에 설치된 PostgreSQL과 겹치지 않게 비워 둠).

```powershell
docker compose -f infra/compose.local.yaml up -d
docker compose -f infra/compose.local.yaml ps      # STATUS가 healthy면 준비 끝
```

끄기는 `down`(데이터는 볼륨에 남음), 데이터까지 지우려면 `down -v`.

**2. 앱 실행** (`backend/`에서) — 프로필 `local`이 위 DB에 붙습니다. 프로필 없이 켜면 DB 정보가 없어 일부러 뜨지 않습니다.

```powershell
.\gradlew bootRun --args="--spring.profiles.active=local"
```

다른 터미널에서 `curl.exe http://localhost:8080/actuator/health`(Windows PowerShell의 `curl`은 다른 명령의 별명이라 `.exe`를 붙입니다) → `{"status":"UP"}`. 서버를 켜 둔 동안 Gradle이 `EXECUTING`에 머무는 것은 정상이며 `Ctrl + C`로 끕니다.

**3. 테스트** (`backend/`에서) — Testcontainers가 테스트용 PostgreSQL 18을 따로 띄우므로 Docker 엔진만 켜져 있으면 되고, 1번의 개발 DB는 필요 없습니다.

```powershell
.\gradlew test             # 마지막 줄에 "TEST 결과: ... 전체 n건, 통과 n" 합계
.\gradlew test --rerun     # 코드를 안 바꿨어도 다시 돌리기
```

같은 테스트가 push · PR마다 [GitHub Actions](.github/workflows/ci.yml)에서 돕니다.

**4. 프런트** (`frontend/`에서) — 처음 한 번 `pnpm install`. 개발 서버는 `/api` · `/actuator`를 2번의 백엔드(8080)로 넘겨 줍니다([proxy.conf.json](frontend/proxy.conf.json)).

```powershell
pnpm install                # 처음 한 번
pnpm start                  # http://localhost:4200 → "서버 상태 확인" 버튼 → 정상 (UP)
pnpm test --watch=false     # Vitest, 한 번 돌고 끝
```

화면 시안은 서버 없이 `start docs\mockups\Closing.html`(레포 루트에서).

## 📖 참고문헌

1. UNEP. (2024). *Food Waste Index Report 2024: Think Eat Save — Tracking Progress to Halve Global Food Waste.* Nairobi.
2. KDI 한국개발연구원. (2025). 『나라경제』 2025년 9월호 — 자영업 폐업 분석(국세청 통계 기반).
3. 통계청 KOSIS 국가통계포털 — 서비스업조사 · 외식업체경영실태조사.
4. Poore, J., & Nemecek, T. (2018). Reducing food's environmental impacts through producers and consumers. *Science*, 360(6392). — 재료별 탄소 계수(Our World in Data 공개본)

> 참고문헌 2 · 3은 공개 전에 원 발행처에서 수치 · 연도를 다시 확인합니다.

## 👤 개발자

**사공민규** — 한국폴리텍II대학 인천캠퍼스 컴퓨터공학과(하이테크 과정)
