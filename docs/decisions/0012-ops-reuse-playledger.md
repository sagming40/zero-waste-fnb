# 0012 · 운영은 PlayLedger · cbt-journal의 틀을 가져온다

- **상태**: 채택
- **날짜**: 2026-11-07

## 맥락

같은 사용자가 운영 중인 서버가 둘이다(cbt-journal 2026-10-31, PlayLedger 2026-11-04). 배포 · 되돌림 · 백업 · 감시가 이미 검증돼 있다. 첫 배포는 M2 뒤, 12월 AWS 이사 뒤라 처음부터 AWS에 올린다.

## 결정

**가져오는 것**: CI가 이미지를 GHCR에 커밋 해시로 올리고 서버는 받기만(`task deploy`), 헬스 실패 시 자동 되돌림(cbt-journal SERVER 4.19), 전부 컨테이너 + Caddy, 매일 `pg_dump` → `age` → 서버 14개 + Cloudflare R2(PlayLedger decisions 0013), GitHub Actions `uptime` 바깥 감시, 서버 `.env`(600), 첫 배포 때 복원 연습.

**새로 정한 것**: JVM 메모리를 재고 잡기, 마지막 예측 성공 시각을 헬스에 넣어 26시간 넘으면 감시 실패, Actuator는 health만 공개, DB 계정 둘(Flyway 소유자 · 앱 역할), JSON 로그 + 추적 ID, `Clock` 주입, CI에서 Testcontainers. 자세히는 [ARCHITECTURE 7절](../ARCHITECTURE.md#7-운영).

## 검토한 대안

- **처음부터 새로 설계** — 검증된 틀을 버릴 이유가 없다. 새로 생기는 문제(JVM · 배치 감시 · RLS 계정)에 시간을 쓴다
- **서버에서 직접 빌드** — 작은 서버에서 Gradle 빌드는 메모리가 모자란다
- **Prometheus · Grafana** — 메모리 때문에 L

## 감수할 것

- 서버 크기 · 리전은 아직 모른다 — JVM 측정값과 AWS 크레딧 결과를 보고 정한다
