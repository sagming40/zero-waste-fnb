# 개발 일지

> **겪은 일 · 막힌 일 · 배운 것을 적는 문서다** — 최신이 위.
> 진행 상황은 [PLAN](PLAN.md), 결정의 이유는 [decisions/](decisions/README.md). 딥 태스크를 겪은 날은 블록 제목에 `🧩n`을 붙인다.

## 현재 상태

- **지금 단계**: M1 화면 설계 — M0 ✅ 2026-11-08
- **다음에 할 일**: 마감 입력 화면부터 목업 시안 그리기 → 프런트 결정(Angular vs Thymeleaf + htmx)
- **개발 DB 켜기**: `docker compose -f infra/compose.local.yaml up -d`, 앱은 `backend/`에서 `.\gradlew bootRun --args="--spring.profiles.active=local"` (README "시작하기")
- **기기별로 할 일**
  - 집 PC: ARCHITECTURE 8.1의 ② PowerShell UTF-8 · ③ 확장 정리(Spring Boot 팩, Oracle 확인, 설정 두 개) · GitHub CLI
  - 회사 PC: 처음 클론 + ARCHITECTURE 8.1을 처음부터

---

## 지난 단계

- **M0 재정비 + 뼈대** (2026-11-07 ~ 11-08) — 재설계(decisions 0001 ~ 0012) · 문서 재정비, Spring Boot 4.1.2 뼈대, compose PostgreSQL 18, Modulith 검사 · CI, 테스트 2건 · health UP. 자세히는 [archive/DEVLOG_M0.md](archive/DEVLOG_M0.md)
