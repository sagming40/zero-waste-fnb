# 0002 · 백엔드는 Java 25 + Spring Boot 4, Gradle(Groovy) + VS Code

- **상태**: 채택
- **날짜**: 2026-11-07

## 맥락

이미 써 본 스택을 빼고 고른다: cbt-journal(Go + SvelteKit + PostgreSQL + Valkey), PlayLedger(Vue 3 + FastAPI + PostgreSQL), material-dict(React + FastAPI), cosmic-watch-explorer(React + Django), filmtong(Streamlit), 이 레포 v0(Express). 후보 목록의 출처는 `G:\내 드라이브\_private\.claude\신박한_풀스택_기술스택_조합_정리_v1.1.md`.

## 결정

**Java 25 (LTS) + Spring Boot 4.x**, 빌드는 **Gradle Groovy DSL**, 편집기는 **VS Code**(Microsoft Java 팩 + Spring Boot 팩).

- 써 본 적 없는 생태계이고, 국내 백엔드 수요가 제일 크다
- 이 프로젝트의 딥 태스크(N+1 · 트랜잭션 · 배치 멱등성)가 JPA · `@Transactional`의 대표 주제와 그대로 겹친다
- VS Code에서도 무료 확장으로 실행 · 디버그 · 테스트가 된다
- Kotlin DSL은 VS Code 편집 지원이 약해서 Groovy

## 검토한 대안

| 후보 | 판단 |
|---|---|
| Go + Templ · HTMX · Alpine.js | 아는 언어 위에서 화면만 새로 배워 완주 가능성이 제일 높다. 대신 새로 배우는 양이 적다 |
| Elixir Phoenix LiveView | 대시보드 + Oban 배치가 잘 맞고 제일 신선하다. 국내 취업 범용성이 낮다 |
| Rust Axum + SvelteKit | 계산할 게 이동 평균뿐이라 Rust의 장점을 살릴 데가 없다 |
| Kotlin + Spring | IntelliJ가 정석이다. VS Code의 JetBrains 공식 확장(유료)은 테스트 실행을 아직 지원하지 않고 Spring 전용 기능도 문서에 없다. 무료 `kotlin-lsp`는 pre-alpha. Spring에 익숙해진 뒤 언어만 바꿔 볼 수는 있다 |
| C# ASP.NET Core | C# 경험이 있어 쉽고 구조도 Spring과 닮았다. 국내 채용이 Spring보다 적다. 차선이었다 |
| Ruby on Rails 8 · Bun + Hono | Rails는 CRUD가 제일 빠르지만 취업 범용성이 낮다. Hono는 Express와 많이 겹친다 |

## 감수할 것

- JVM이 무겁다 — 1GB 서버에서 메모리를 재고 잡아야 한다(ARCHITECTURE 7절, 🧩5)
- IntelliJ 대비 VS Code의 Spring 지원이 약하다. 노트북의 `oracle.oracle-java` 확장은 `redhat.java`와 겹쳐 끈다
