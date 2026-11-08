/* 매장 · 직원 시안 공용 (Members.mobile.html · Members.desktop.html). 점주만 본다.
 * shared.js 뒤에 읽는다. 매장 · 사람 이름 · 주소는 전부 지어낸 값이다.
 *
 * state (?state=)
 *   main     기본 — 직원 2 · 대기 중인 초대 1 (기본)
 *   invite   초대 링크를 막 만듦 — 복사 · 공유
 *   remove   직원 내보내기 확인
 *   address  주소 바꾸기 — 검색 결과에서 고름
 *   noaddr   주소 없이 등록한 매장 (날씨 신호 제외 중)
 *   alone    직원 0명 — 혼자 하는 매장
 */
(function () {
  const STATES = [
    ['main', '기본'], ['invite', '초대 링크 만듦'], ['remove', '내보내기 확인'], ['address', '주소 바꾸기'],
    ['noaddr', '주소 없음'], ['alone', '직원 없음'],
  ];
  const state = ZW.params.get('state') || 'main';
  const variant = (ZW.params.get('v') || 'A').toUpperCase();
  const STORE = { name: '모래내 베이커리 & 델리', addr: '서울 서대문구 모래내로 12, 1층', station: '서울', km: 4 };
  const OWNER = { name: '한도윤', email: 'doyun@example.com' };
  const STAFF = [
    { name: '서지우', email: 'jiwoo@example.com', since: '11월 3일', last: '어제 마감 입력' },
    { name: '김하늘', email: 'haneul@example.com', since: '11월 6일', last: '오늘 입고 입력' },
  ];
  const PENDING = [{ made: '11월 8일', until: '11월 15일(일)', by: '한도윤' }];
  const LINK = 'https://zwfnb.sagming.com/i/7Kq2-xW9p';
  const esc = (s) => s.replace(/&/g, '&amp;');
  const ICON = {
    copy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  };

  // 매장 정보 ------------------------------------------------------------------
  function storeCard() {
    const noaddr = state === 'noaddr';
    const addrBlock = state === 'address' ? `
      <span class="inp"><span class="muted" style="display:grid;margin-right:6px">${ICON.pin}</span><input value="연희로 8" aria-label="새 주소 찾기"></span>
      <div class="results">
        <button type="button" class="res"><span><b>서울 서대문구 연희로 8</b><br><span class="small muted">지번 연희동 92-1 · 03722</span></span></button>
        <button type="button" class="res"><span><b>서울 서대문구 연희로8길 3</b><br><span class="small muted">지번 연희동 96-12 · 03722</span></span></button>
      </div>
      <div class="uses small">주소를 바꾸면 <b>오늘부터</b> 새 위치의 날씨를 가져와요. 지난 날의 날씨 · 기록은 그대로예요.</div>
      <button type="button" class="ghost wide" data-go="main">취소</button>`
      : noaddr ? `<div class="uses warn-soft small"><b>주소가 없어요</b> — 마감 · 손실은 그대로 사용할 수 있고, 내일 권장에 쓰는 날씨 신호만 제외돼요.</div>
      <button type="button" class="primary" data-go="address">주소 넣기</button>`
      : `<div class="addr"><span class="pinic">${ICON.pin}</span><span class="grow">${STORE.addr}<br><span class="small muted">날씨 관측소 ${STORE.station} · 약 ${STORE.km}km</span></span>
        <button type="button" class="link" data-go="address">바꾸기</button></div>`;
    return `<section class="card">
      <h2>매장</h2>
      <label class="fld"><span class="lab">매장 이름</span><span class="inp"><input value="${esc(STORE.name)}"></span></label>
      <div class="fld"><span class="lab">주소</span>${addrBlock}</div>
    </section>`;
  }

  // 직원 -------------------------------------------------------------------------
  const avatar = (n, owner) => `<span class="av${owner ? ' own' : ''}">${n[0]}</span>`;
  function people() {
    const staff = state === 'alone' ? [] : STAFF;
    const pending = state === 'alone' ? [] : PENDING;
    return `<section class="card">
      <h2 class="row-between"><span>사람 <span class="muted small">${1 + staff.length}명</span></span>
        <button type="button" class="primary inline" data-go="invite">+ 직원 초대</button></h2>
      <div class="person">${avatar(OWNER.name, true)}<span class="grow"><b>${OWNER.name}</b> <span class="small muted">나</span><br><span class="small muted">${OWNER.email}</span></span><span class="pill">점주</span></div>
      ${staff.map((p, i) => `<div class="person">${avatar(p.name)}<span class="grow"><b>${p.name}</b><br><span class="small muted">${p.email} · ${p.since}부터 · ${p.last}</span></span>
        <span class="pill staff">직원</span><button type="button" class="ghost sm" data-go="remove" aria-label="${p.name} 내보내기">내보내기</button></div>`).join('')}
      ${staff.length ? '' : `<div class="uses small">아직 직원이 없어요. 혼자 하는 매장이면 그대로 사용해도 돼요. 직원은 <b>마감 · 입고 · 재료 폐기</b>만 입력하고 금액은 보지 않아요.</div>`}
      ${pending.length ? `<div class="sub small muted">대기 중인 초대 ${pending.length}</div>${pending.map((x) => `<div class="person pend"><span class="av ghostav">${ICON.link}</span>
        <span class="grow">초대 링크 <span class="small muted">· ${x.made} 만듦 · ${x.until}까지</span><br><span class="small muted">아직 아무도 사용하지 않았어요</span></span>
        <button type="button" class="link" data-cancel>취소</button></div>`).join('')}` : ''}
    </section>`;
  }

  // 초대 링크 — 한 사람 한 링크, 7일, 한 번 사용하면 끝
  function inviteBox() {
    return `<div class="invbox">
      <div class="small muted">직원 초대 링크 · 1명용 · 11월 16일(월)까지</div>
      <div class="linkline"><span class="num grow">${LINK}</span><button type="button" class="ghost sm" data-copy>${ICON.copy} 복사</button></div>
      <button type="button" class="primary" data-share>${ICON.share} 공유하기 (카카오톡 · 문자)</button>
      <ul class="small muted can">
        <li>링크를 연 사람이 가입 · 로그인하면 <b>직원</b>으로 들어와요</li>
        <li>한 번 사용하면 끝나요. 여러 명이면 사람마다 새 링크를 만들어요</li>
        <li>잘못 보냈으면 "대기 중인 초대"에서 취소해요</li>
      </ul></div>`;
  }
  function removeBox() {
    const p = STAFF[0];
    return `<div class="invbox">
      <h3 style="margin:0">${p.name} 님을 내보낼까요?</h3>
      <ul class="small can">
        <li><b>바로</b> 이 매장에 들어올 수 없어요 — 지금 열어 둔 화면도 다음 저장부터 막혀요</li>
        <li>계정은 남아요. 다른 매장 일은 그대로예요</li>
        <li>${p.name} 님이 입력한 지난 마감 · 입고 기록은 지우지 않아요(입력한 사람 이름도 남아요)</li>
        <li>다시 함께하려면 새 초대 링크를 보내요</li>
      </ul>
      <div class="btns"><button type="button" class="ghost" data-go="main">취소</button><button type="button" class="danger" data-removed>내보내기</button></div></div>`;
  }

  function wire(root) {
    const go = (s) => { const p = new URLSearchParams(location.search); p.set('state', s); location.search = p.toString(); };
    root.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
    root.querySelectorAll('[data-copy]').forEach((b) => b.onclick = () => ZW.toast('링크를 복사했어요'));
    root.querySelectorAll('[data-share]').forEach((b) => b.onclick = () => ZW.toast('휴대폰 공유 창(카카오톡 · 문자) — 데스크톱은 복사만'));
    root.querySelectorAll('[data-cancel]').forEach((b) => b.onclick = () => ZW.toast('초대를 취소했어요 — 그 링크는 더 이상 열리지 않아요'));
    root.querySelectorAll('[data-removed]').forEach((b) => b.onclick = () => ZW.toast('서지우 님을 내보냈어요'));
    root.querySelectorAll('.res').forEach((b) => b.onclick = () => ZW.toast('주소를 바꿨어요 — 오늘부터 새 위치의 날씨'));
  }

  window.MEM = { STATES, state, variant, STORE, storeCard, people, inviteBox, removeBox, wire };
})();
