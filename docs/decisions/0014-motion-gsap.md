# 0014 · 움직임은 Angular 내장 전환 + GSAP, 화려한 연출은 소개 · 리포트에만

- **상태**: 채택
- **날짜**: 2026-11-08

## 맥락

사용자가 Aceternity UI 같은 애니메이션 UI를 써 보고 싶어 했다(배움 목적). Aceternity · Magic UI는 React + Framer Motion 부품을 복사해 쓰는 방식이라 Angular([0013](0013-frontend-angular.md))에서는 그대로 못 쓴다. npm의 Angular 포팅(`aceternity-ui`)은 2024-07 뒤로 갱신이 없다. 한편 이 앱의 핵심은 매일 마감 때 빠르게 치는 업무 화면이다.

## 결정

- **기본 전환**: Angular 내장 `animate.enter` / `animate.leave` + CSS(Tailwind). 펼침 · 목록 들어오기 · 토스트 · 알림 띠. 옛 `@angular/animations` 패키지는 새로 쓰지 않는다
- **연출**: **GSAP**(2026-11 기준 3.15) — 숫자 카운트업 · 스크롤 연동(ScrollTrigger) · 글자 쪼개기(SplitText) · 타임라인. 처음 쓰는 화면에서 설치한다
- Aceternity류 효과는 **보고 Angular 디렉티브 · 컴포넌트로 직접 옮겨 만든다** — 복사보다 손에 남는다
- **구역**: 화려한 연출은 소개(랜딩) 페이지(F27) · 로그인 · 리포트 맨 위 숫자에만. 입력 화면(마감 · 재고 · 입고)은 값이 바뀔 때 짧은 전환까지
- `prefers-reduced-motion`이면 연출을 끈다

## 검토한 대안

- **Aceternity · Magic UI 그대로** — React 부품이라 Angular에서 못 쓴다. React를 섬처럼 끼워 넣으면 빌드 · 상태가 두 벌이 된다
- **Motion(프레임워크 무관판)** — GSAP보다 가볍다. 스크롤 연동 · 글자 효과 · 복잡한 타임라인 재료가 GSAP 쪽이 많아 Aceternity류를 옮기기엔 GSAP
- **`@angular/animations`** — Angular가 내장 `animate.enter` / `animate.leave`로 옮겨 가는 중이다
- **입력 화면에도 화려하게** — 칠 때마다 번쩍이면 방해되고 느려진다

## 감수할 것

- GSAP만큼 번들이 커진다 — 소개 · 리포트 화면에서만 불러오게(지연 로딩) 한다
- 효과를 직접 옮겨 만드는 시간이 든다 — 배움 목적이라 받아들인다
