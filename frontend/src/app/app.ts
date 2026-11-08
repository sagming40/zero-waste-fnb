import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// 서버 상태가 가질 수 있는 값 네 가지 — 이 밖의 값은 타입이 막아 준다
type Health = 'idle' | 'loading' | 'up' | 'down';

@Component({
  selector: 'app-root',          // index.html의 <app-root> 자리에 이 화면이 들어간다
  templateUrl: './app.html',     // 화면 모양은 이 파일에
})
export class App {
  // 전화기(HttpClient)를 받아 온다 — 직접 만들지 않고 받아 쓰는 것(DI)
  private readonly http = inject(HttpClient);

  // 알림 상자: 처음엔 '아직 확인 안 함'. 값이 바뀌면 이걸 읽는 화면 부분만 다시 그려진다
  protected readonly health = signal<Health>('idle');

  // 버튼을 누르면 불린다
  protected checkHealth(): void {
    this.health.set('loading');

    // /actuator/health → 개발 서버 안내 데스크(프록시) → Spring 8080
    this.http.get<{ status: string }>('/actuator/health').subscribe({
      next: (res) => this.health.set(res.status === 'UP' ? 'up' : 'down'), // 답이 오면
      error: () => this.health.set('down'),  // 서버가 꺼졌거나 DOWN(503)이면 오류로 온다
    });
  }
}
