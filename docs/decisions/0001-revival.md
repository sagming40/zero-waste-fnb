# 0001 · 레포 재정비: Express v0를 버리고 처음부터 다시 설계한다

- **상태**: 채택
- **날짜**: 2026-11-07

## 맥락

2026-07-12 하루에 커밋 5개를 남기고 멈춘 레포다. 구현된 것은 Express 5 + pg의 `GET /api/health` · `GET /api/inventory` · `POST /api/sales`(트랜잭션을 일부러 안 건 before 버전), `schema.sql`(테이블 7개), Python 더미 시드뿐이다. 프런트 · 예측 · 인증(`userId = 1` 고정) · 입력 검증 · 테스트가 없다. 개발 경험이 거의 없을 때 짠 설계라, 끝까지 따라가 보니 구멍이 많았다([DATA_MODEL 6절](../DATA_MODEL.md#6-v0-스키마에서-고친-것), [REQUIREMENTS 1.2](../REQUIREMENTS.md#12-v0-개요에서-고친-것)).

취업 일정에 쫓기지 않는 자기계발 프로젝트로 바뀌었다.

## 결정

- 스택만 바꾸는 게 아니라 **프런트 · 백엔드 · DB · 서버 · 배포 · 운영 · 코드 구현 전부를 처음부터 탄탄하게** 다시 설계한다. 시간이 걸려도 완성도를 우선한다
- 옛 코드(`backend/` · `seed/` · `schema.sql`)는 태그 `v0-express`로 남기고 M0에서 지운다
- 옛 문서(루트 `BE_트러블슈팅.md` · `FE_메모_모음.md` · 옛 README)는 `docs/archive/`로 옮기고 고치지 않는다
- 새 문서는 전역 문서 체계를 따른다. 재설계 중 쓰던 `docs/BRAINSTORM.md`는 내용을 REQUIREMENTS · ARCHITECTURE · DATA_MODEL · PLAN · decisions에 녹이고 지웠다(git 기록에 있다, [archive/README](../archive/README.md))

**이어 가는 것**: 문제 정의 · 핵심 기능, 테이블 설계의 뼈대, 더미 데이터 규칙(정기 · 예외 휴무, 요일 가중치, 말차라떼 콜드스타트, 고정 시드), 딥 태스크 5개(+ 새로 3개), 커밋 컨벤션.
**버리는 것**: Express 코드 전부, Python 파이프라인 계획(가중 이동 평균은 pandas 없이 SQL · Java로 충분), CRA · React 계획.

## 검토한 대안

- **v0 코드를 고쳐 쓰기** — 버릴 코드가 200줄 남짓이라 고치는 비용이 새로 고르는 비용보다 크다. 설계 구멍이 스키마부터라 고쳐 쓰면 결국 다시 짠다

## 감수할 것

- Spring · JPA · 프런트가 전부 처음이라 일정이 길다. 그래서 이 레포는 **타이핑 학습 모드가 기본**이고(CLAUDE.md), M2 ~ M5를 묶음마다 혼자 써 볼 수 있는 앱이 되게 끊었다([PLAN](../PLAN.md))
- 문서 고치는 시간이 구현보다 길어지는 함정 — CLAUDE.md "문서 함정 막기"로 막는다
