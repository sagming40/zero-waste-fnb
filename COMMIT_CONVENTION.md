# 📝 Commit Message Convention — ZeroWaste F&B

이 프로젝트는 [Conventional Commits](https://www.conventionalcommits.org/) 형식을 기반으로 하되,
**딥 태스크(🧩)는 트러블슈팅 형식으로 꼼꼼하게, 일반 태스크는 간결하게** 작성한다.

커밋 로그 자체가 "이 프로젝트를 어떻게 만들었는지" 보여주는 자료다.
**딥 태스크의 원본은 커밋 메시지**다 — 따로 트러블슈팅 문서를 두지 않고, 겪은 과정은 `docs/DEVLOG.md` 블록(제목에 `🧩n`)에, 결과 한 줄은 README "딥 태스크" 표에 남긴다(CLAUDE.md "문서 함정 막기").
커밋 끝에는 Claude가 커밋할 때 붙는 `Co-Authored-By` 줄이 들어갈 수 있다.

---

## 형식

```
<type>: <summary>

<description — 필요할 때만>
```

- **summary**: 한 줄, 명령형, 50자 이내
- **description**: 왜/어떻게를 설명. 일반 커밋은 생략 또는 1~2줄, 🧩 딥 태스크는 아래 트러블슈팅 형식 사용

---

## type 종류

| type | 의미 |
| --- | --- |
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `perf` | 성능 개선 (🧩 N+1→JOIN, 인덱스 등 딥 태스크가 여기 해당) |
| `refactor` | 동작은 그대로, 구조만 개선 |
| `docs` | 문서만 변경 (README, 워크플로우, 지침 등) |
| `chore` | 환경설정, 초기 세팅, 빌드 관련 |
| `test` | 테스트 코드 |

---

## 케이스별 작성법

### ① 일반 커밋 — 왜 했는지 한두 줄이면 충분

```
feat: 마감 입력 API 구현

business_day와 daily_menu_sale을 저장하는 POST /api/closings 추가.
```

### ② 🧩 딥 태스크 커밋 — 트러블슈팅 형식 (문제→분석→해결→수치)

여기가 이 프로젝트에서 가장 힘을 주는 자리. summary 앞에 `🧩n`을 붙여 `git log --grep 🧩`로 모아 볼 수 있게 한다. 수치는 추정이 아니라 잰 값만 쓴다.

```
perf: 🧩1 탄소 리포트 N+1 → fetch join

- 문제: 폐기 기록마다 레시피 · 재료를 따로 불러오는 N+1이 생겼다
- 분석: SQL 로그로 리포트 한 번에 쿼리 41회, EXPLAIN ANALYZE로 Seq Scan 확인
- 해결: fetch join + (store_id, business_date) 인덱스
- 결과: 응답 320ms → 45ms, 쿼리 41회 → 2회
```

(위 숫자는 형식을 보여 주는 예시다.)

🧩 딥 태스크 대상 — 목록 · 단계는 [docs/PLAN.md 4절](docs/PLAN.md#4-딥-태스크):
1. N+1 → JOIN · 인덱스
2. 트랜잭션 (마감 다시 입력 = 통째로 바꿈)
3. 배치 멱등성 (`ON CONFLICT`)
4. 엣지 케이스 (휴무일 · 콜드스타트 · 품절일)
5. 배포 (JVM 메모리 · DB 계정 둘)
6. 행 수준 보안(RLS)
7. 윈도 함수 특징 · 백테스트
8. 외부 API 장애

---

## 터미널에서 Summary + Description 나눠 쓰는 법

`-m`을 두 번 쓰면 첫 번째가 Summary, 두 번째가 빈 줄 하나 띄우고 Description으로 들어간다.

```bash
git commit -m "타입: 요약" -m "
- 상세 설명 1
- 상세 설명 2
"
```

GitHub Desktop을 쓰는 경우, Summary 칸과 Description 칸이 UI에 따로 있어 더 편하게 작성 가능하다.

---

## 예시 (재설계 뒤 실제 커밋 `82018a9`, 2026-11-07)

```
chore: 개발용 PostgreSQL compose와 application.yml 설정

- infra/compose.local.yaml: postgres:18, 5433→5432(5432는 PC의 PostgreSQL 서비스),
  볼륨은 /var/lib/postgresql(18부터 바뀐 위치), pg_isready healthcheck, name: zwfnb
- application.properties → application.yml (공용: OSIV 끔, ddl-auto=validate, DB 정보 없음)
- application-local.yml: 개발 DB 접속 + Hibernate SQL 로그 (프로필 local)
- 검증: compose ps healthy, 컨테이너 안 PostgreSQL 18.6, bootRun(local) 1.76s 기동 ·
  Flyway 0 migrations, GET /actuator/health → {"status":"UP"},
  ./gradlew test 1건 통과(프로필 없이 — Testcontainers @ServiceConnection)
```

- 무엇을 바꿨는지는 파일 단위로, **왜**는 괄호로 짧게
- 마지막 줄 `검증:`에는 실제로 본 값(테스트 건수 · 응답 · 걸린 시간)만 쓴다. 확인 못 한 것은 "미확인"이라고 쓴다
- v0(Express) 시절 예시는 태그 `v0-express`의 이 파일에 남아 있다
