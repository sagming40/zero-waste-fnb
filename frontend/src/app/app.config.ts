import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// app 전체에 설치하는 "기본 설비" 목록 ─ 여기에 적혀 있는 것들만 components 에서 DI(주입)하여 사용할 수 있다
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),  // 잡히지 않은 오류를 한 곳으로 모으는 경보기
    provideRouter(routes),                 // 주소 ↔ 화면 연결표
    provideHttpClient(),        // server에 전화를 거는 전화기 ─ 기본이 fetch. M2에서 withInterceptors를 여기에
  ],
};
