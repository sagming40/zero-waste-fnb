# ZeroWaste F&B — 프로젝트 지침

> **이 레포에서 Claude가 따를 규칙이다** — 전역 지침(`~/.claude/CLAUDE.md`)을 바탕으로, 이 프로젝트만의 세부와 **전역과 다르게 하는 것**을 적는다.
> 무엇을 만드는지는 [README](README.md), 지금 고민 중인 스택 · 설계는 [docs/BRAINSTORM.md](docs/BRAINSTORM.md).

## 지금 상태 (2026-11-07)

- **재설계 중.** 옛 Express + React 계획을 버리고 스택을 새로 고르는 중이다. 정한 것 · 열린 질문은 [docs/BRAINSTORM.md](docs/BRAINSTORM.md)에 있다.
- 확정: Java 25 + Spring Boot 4.x(Gradle) · VS Code · PostgreSQL 18 · Flyway · Spring Security(세션 + CSRF) · JUnit 5 + Testcontainers · springdoc · `@Scheduled`. 데이터 모델과 같이 정할 것: DB 접근 기술. M1에서 정할 것: 프런트(후보 Angular + Tailwind + spartan/ui).
- 정한 범위: 베이커리 카페 + 델리 메뉴, 돈 · 탄소 두 축, 여러 매장 · 역할, M2 ~ M5 네 묶음, M2 뒤 첫 배포(BRAINSTORM 6 · 10 · 11절).
- 취업 일정에 쫓기는 프로젝트가 아니다 — 자기계발용이라 범위를 넓혀 깊게 배워도 된다(2026-11-07).
- `backend/`(Express) · `seed/`(Python) · `schema.sql`은 **옛 버전**이다. 고치거나 기능을 더하지 않는다. M0에서 태그 `v0-express`로 남기고 지운다.
- 다음에 할 일: 데이터 모델 설계(BRAINSTORM 7절 체크리스트) → M0(재정비 + 뼈대).

## 작업 방식 — 전역 작업 방식과 다르게

> **이유**: 이 레포는 Spring · Angular · JPA · Tailwind · spartan **전부 처음 쓰는 스택**이다. 내가 직접 쳐 봐야 손에 남는다. 그래서 전역 기본값(자동)을 뒤집어 **타이핑 학습 모드를 기본값**으로 한다 (2026-11-07 사용자 지시).

**기본: 타이핑 학습 모드**
- Claude는 **코드 · 설정 파일에 쓰지 않는다.** 한 줄짜리 수정도 마찬가지다. 대상: `src/` · `build.gradle` · `application.yml` · `package.json` · `angular.json` · 마이그레이션 SQL · compose 파일 · 스크립트.
- 비유를 곁들인 주석을 단 코드를 **채팅으로 보여 준다.** 내가 치고 "코드 검수!"라고 하면 오타 · 버그를 리뷰한다.
- 수정 지시는 **"파일 위치 + 지금 코드 + 바꿀 코드"** 형식으로 한다.
- 명령(Gradle · npm · git · docker)도 내가 친다. Claude는 명령과 "왜 필요한지"를 보여 준다.
- **커밋 · push는 Claude가 한다** (2026-11-07 사용자 지시 — 나는 코드 타이핑에만 집중한다). 내가 친 코드는 "코드 검수!"가 통과한 뒤, 문서는 고친 뒤 Claude가 [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md) 형식으로 커밋하고 push한다. 검수에서 버그가 남아 있으면 커밋하지 않는다.
  - **문서는 결정마다 커밋하지 않는다** (2026-11-07 사용자 지시). 브레인스토밍 · 설계 중에는 로컬 파일만 고쳐 두고, 내가 "정리하자" · "푸시해"라고 하거나 한 묶음이 끝났을 때 한 커밋으로 묶어 push한다. 다른 기기로 옮기기 전에 안 올린 변경이 있으면 Claude가 먼저 알려 준다.
- **Claude가 직접 해도 되는 것**
  - 읽기 전용 확인 명령: `git status` · `git diff` · `git log`, `./gradlew test` · `build`, `npm test` · `ng build`, 화면 띄워 보기. 내가 친 결과를 관찰값으로 확인하는 용도다.
  - `git add` · `git commit` · `git push` · `git tag`(위 커밋 규칙대로).
  - 문서 쓰기: `docs/` 아래 문서와 이 파일. 문서는 학습 대상이 아니다. 단 내가 "이건 내가 쓸게"라고 하면 그렇게 한다.
- 새 도구 · 개념이 처음 나오면 **설명부터** 한다. 이 레포에서는 거의 모든 단계가 처음이다 — 짧게, 일상 비유를 섞고, 이 프로젝트 어디에 쓰는지까지 말한다.
- 한 번에 보여 주는 코드 양은 내가 칠 수 있을 만큼(파일 하나 · 함수 몇 개)으로 끊는다. 다음 조각은 앞 조각 검수가 끝난 뒤에 보여 준다.

**자동 모드: 내가 요청할 때만**
- 내가 "이건 네가 해" · "자동으로" · "바로 해줘"처럼 말한 작업만 Claude가 코드를 쓰고, 실행 · 검증하고, 커밋 · push까지 한다(전역 작업 방식의 자동 절차 · 사전 검증 · 보고를 그대로 따른다).
- 허락은 **그 작업에만** 적용된다. 끝나면 타이핑 학습 모드로 돌아온다.
- 자동 작업 중이라도 새 의존성 설치는 전역 규칙대로 한다(미리 목록을 보여 주고 내가 친다. 미리 못 본 것만 Claude가 설치하고 보고).

**그대로 따르는 것**: 전역의 구현 전 사전 검증, 관찰값 검증, 마일스톤 닫기 전 점검. 타이핑 학습 모드에서는 이걸 **Claude가 코드를 보여 주기 전에** 머릿속으로 돌리고, 찾은 구멍은 보여 줄 때 같이 말한다.

## 문서 지도

전역 문서 체계를 따른다. 재정비(M0) 전이라 지금은 옛 문서와 새 문서가 섞여 있다.

| 파일 | 상태 |
|---|---|
| [README.md](README.md) | 옛 스택 기준. M0에서 새 스택으로 고친다 |
| [docs/BRAINSTORM.md](docs/BRAINSTORM.md) | **지금 원본.** 스택 · 설계 고민. 굳으면 decisions · PLAN으로 옮기고 archive로 보낸다 |
| [BE_트러블슈팅.md](BE_트러블슈팅.md) | 옛 문서. 딥 태스크 목록은 BRAINSTORM 4절로 옮겼다. 어떻게 살릴지는 BRAINSTORM 7절 |
| [FE_메모_모음.md](FE_메모_모음.md) | 옛 문서. 내용 없음 |
| [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md) | **유효.** 커밋 메시지는 이 형식을 따른다 |
| `docs/PLAN.md` · `DEVLOG.md` · `decisions/` | M0에서 만든다 |

## 환경

- 경로: 노트북 `C:\_dev\zero-waste-fnb`, 집 PC `D:\_dev\zero-waste-fnb`(2026-11-07). 회사 PC는 처음 클론할 때 여기 적는다.
- 기기별 설치 상태(JDK · VS Code 확장 · Docker)는 [BRAINSTORM 8절](docs/BRAINSTORM.md#8-기기별-환경).
- 비밀값은 `.env`에만 둔다(`.gitignore` 등록됨). 견본은 `.env.example`.
