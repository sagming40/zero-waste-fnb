# 📝 Commit Message Convention — ZeroWaste F&B

이 프로젝트는 [Conventional Commits](https://www.conventionalcommits.org/) 형식을 기반으로 하되,
**딥 태스크(🧩)는 트러블슈팅 형식으로 꼼꼼하게, 일반 태스크는 간결하게** 작성한다.

커밋 로그 자체가 "이 프로젝트를 어떻게 만들었는지" 보여주는 자료이므로,
`BE_트러블슈팅.md`에 남길 내용을 커밋 메시지에 먼저 녹이고, 나중에 문서로 옮겨 쓴다.

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
feat: 판매/폐기 저장 API 구현

daily_menu_sales와 daily_waste에 각각 저장하는 POST /api/sales 엔드포인트 추가.
```

### ② 🧩 딥 태스크 커밋 — 트러블슈팅 형식 (문제→분석→해결→수치)

여기가 이 프로젝트에서 가장 힘을 주는 자리. `BE_트러블슈팅.md`에도 그대로 옮겨 쓸 수 있게 작성한다.

```
perf: summary 조회 쿼리 N+1 → JOIN 리팩터

- 문제: 메뉴 개수만큼 재고를 개별 SELECT하는 N+1 패턴으로 구현되어 있었음
- 분석: EXPLAIN ANALYZE 결과 메뉴 13개 기준 쿼리 14회 발생, Seq Scan 위주
- 해결: daily_menu_sales × recipes_bom × ingredients 단일 JOIN으로 통합
- 결과: 응답시간 320ms → 45ms (약 7배 단축), 쿼리 호출 14회 → 1회
```

🧩 딥 태스크 대상 (워크플로우 v1.2 기준):
- 쿼리 최적화 (N+1 → JOIN, 복합 인덱스)
- 트랜잭션 (판매+폐기 동시 입력 원자성)
- 배치 멱등성 (UPSERT)
- 엣지 케이스 (휴무일 결측, 신규 메뉴 콜드스타트)
- 배포

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

## 예시 (이 프로젝트 첫 커밋)

```
chore: 프로젝트 초기 세팅 (DB 스키마, 더미 시딩 스크립트)

- users/menus/ingredients/recipes_bom/daily_menu_sales/daily_waste/predictions 7개 테이블 스키마 작성
- 베이커리&카페 컨셉, 6개월치 현실적 더미 데이터 생성 스크립트(seed_dummy.py) 추가
  (요일 가중치 + 랜덤 노이즈, 정기·예외 휴무 결측, 신메뉴 콜드스타트 케이스 포함)
- DB 접속정보는 .env로 분리, .gitignore로 커밋 제외 처리
```
