import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App — 서버 상태 확인', () => {
  let http: HttpTestingController; // 가짜 전화 교환원

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      // 진짜 전화기를 깔고, 그 선을 가짜 교환원에 꽂는다 — 순서 중요: provideHttpClient 다음에 Testing
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  // 시험마다 끝에서: 받지 않은 전화가 남아 있으면 실패 (요청을 빠뜨리거나 두 번 건 실수를 잡는다)
  afterEach(() => http.verify());

  // 화면을 띄우고 버튼을 누르는 것까지 — 여러 시험이 같이 쓰는 준비 동작
  async function openAndClick() {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable(); // 처음 화면이 다 그려질 때까지
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector('button')!.click();
    return { fixture, el };
  }

  it('처음에는 "아직 확인 안 함"', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('아직 확인 안 함');
  });

  it('확인 중에는 버튼이 잠긴다', async () => {
    const { fixture, el } = await openAndClick();
    fixture.detectChanges(); // 답을 아직 안 줬으니 whenStable이 아니라 "지금 바로 그려"
    expect(el.querySelector('button')!.disabled).toBe(true);
    expect(el.textContent).toContain('확인 중');
    http.expectOne('/actuator/health').flush({ status: 'UP' }); // 남은 전화는 받아 준다 (verify 통과용)
  });

  it('UP이면 "정상 (UP)"', async () => {
    const { fixture, el } = await openAndClick();
    http.expectOne('/actuator/health').flush({ status: 'UP' }); // 교환원: "UP입니다"
    await fixture.whenStable();
    expect(el.textContent).toContain('정상 (UP)');
  });

  it('503(DOWN)이면 "연결 안 됨"', async () => {
    const { fixture, el } = await openAndClick();
    // 교환원: 503으로 대답 — Spring이 DB를 못 찾으면 실제로 이렇게 온다
    http.expectOne('/actuator/health').flush({ status: 'DOWN' }, { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();
    expect(el.textContent).toContain('연결 안 됨');
  });
});
