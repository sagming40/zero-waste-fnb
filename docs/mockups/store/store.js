/* 첫 매장 등록 · 매장 고르기 · 시작 체크리스트 시안 공용 (Store.mobile.html · Store.desktop.html).
 * shared.js · auth.js 뒤에 읽는다. 주소 · 매장 · 사람 이름은 전부 지어낸 값이다.
 *
 * state (?state=)
 *   new      첫 매장 등록 — 빈 칸 (기본)
 *   search   주소 검색 결과
 *   zero     검색 결과 0건
 *   fail     주소 검색 서비스가 응답하지 않음
 *   confirm  주소를 고른 뒤 확인 (B는 3단계)
 *   pick     매장 고르기 (매장이 둘 이상)
 *   none     속한 매장이 하나도 없음 (직원에서 빠진 사람 등)
 *   start    등록 직후 — 시작 체크리스트 (메뉴가 0개인 매장의 "오늘")
 */
(function () {
  const STATES = [
    ['new', '빈 칸'], ['search', '검색 결과'], ['zero', '0건'], ['fail', '검색 실패'], ['confirm', '확인'],
    ['pick', '매장 고르기'], ['none', '매장 없음'], ['start', '시작 체크리스트'],
  ];
  const state = ZW.params.get('state') || 'new';
  const variant = (ZW.params.get('v') || 'C').toUpperCase();
  const QUERY = '모래내로 12';
  const RESULTS = [
    { road: '서울 서대문구 모래내로 12', jibun: '남가좌동 291-3', zip: '03706' },
    { road: '서울 서대문구 모래내로 12-1', jibun: '남가좌동 291-7', zip: '03706' },
    { road: '서울 마포구 모래내로1길 12', jibun: '성산동 117-4', zip: '03952' },
  ];
  const PICKED = RESULTS[0];
  const STORES = [
    { name: '모래내 베이커리 & 델리', addr: '서대문구 모래내로 12', role: '점주', last: true, closed: '어제 마감함' },
    { name: '연희 샐러드 랩', addr: '서대문구 연희로 8', role: '점주', closed: '오늘 마감 전' },
    { name: '망원 도시락', addr: '마포구 망원로 31', role: '직원', closed: '' },
  ];
  const esc = (s) => s.replace(/&/g, '&amp;');
  const ICON = {
    pin: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z"/></svg>',
  };

  // 공용 조각 -----------------------------------------------------------------
  const nameField = (v = '') => `<label class="fld" for="sname"><span class="lab">매장 이름 <span class="muted small">직원 · 화면 위쪽에 보여요</span></span>
      <span class="inp"><input id="sname" autocomplete="organization" placeholder="예: 모래내 베이커리" value="${esc(v)}"></span></label>`;
  const searchField = (v = '') => `<label class="fld" for="q"><span class="lab">매장 주소</span>
      <span class="inp"><span class="muted" style="display:grid;margin-right:6px">${ICON.search}</span>
      <input id="q" type="search" placeholder="도로명 + 건물번호 (예: 모래내로 12)" value="${esc(v)}"></span></label>`;
  const resultList = () => `<div class="results" role="listbox" aria-label="주소 검색 결과">
      <div class="small muted">${RESULTS.length}건 · 매장 건물을 골라 주세요</div>
      ${RESULTS.map((r, i) => `<button type="button" class="res" role="option" data-pick="${i}">
        <span class="pinic">${ICON.pin}</span><span><b>${r.road}</b><br><span class="small muted">지번 ${r.jibun} · ${r.zip}</span></span></button>`).join('')}
    </div>`;
  const zeroBox = () => `<div class="banner warn" role="status"><b>"모래내 12"로 찾은 주소가 없어요</b>도로명과 건물번호를 띄어 써 보세요. 예: 모래내로 12 · 건물 이름(○○빌딩)도 돼요.</div>`;
  const failBox = () => `<div class="banner err" role="alert"><b>지금 주소를 찾을 수 없어요</b>주소 검색 서비스가 응답하지 않아요. 잠시 뒤 다시 찾거나, 주소 없이 먼저 등록하고 매장 설정에서 넣을 수 있어요.</div>`;
  const pickedCard = (detail = true) => `<div class="picked"><span class="pinic">${ICON.pin}</span>
      <span style="flex:1"><b>${PICKED.road}</b><br><span class="small muted">지번 ${PICKED.jibun} · ${PICKED.zip}</span></span>
      <button type="button" class="link" data-go="search">바꾸기</button></div>
      ${detail ? `<label class="fld" for="detail"><span class="lab">상세 주소 <span class="muted small">선택</span></span>
      <span class="inp"><input id="detail" placeholder="예: 1층" value="1층"></span></label>` : ''}`;
  // 위치로 무엇을 하는지 밝힌다 — 사장님은 격자 · 지점 번호를 몰라도 된다
  const usesBox = () => `<div class="uses"><span class="muted" style="display:grid">${ICON.cloud}</span>
      <span class="small">이 위치로 <b>날씨 · 공휴일</b>을 가져와 내일 권장 수량에 사용해요. 가까운 관측소: <b>서울</b> · 약 4km</span></div>`;
  const noAddrNote = () => `<div class="uses warn-soft"><span class="small">주소 없이 등록하면 마감 · 손실은 그대로 사용할 수 있고, <b>날씨 신호만</b> 제외돼요. 매장 설정에서 언제든 넣을 수 있어요.</span></div>`;

  const steps = (n) => `<ol class="steps" aria-label="3단계 중 ${n}단계">${['이름', '주소', '확인'].map((t, i) =>
      `<li class="${i + 1 < n ? 'done' : i + 1 === n ? 'cur' : ''}"><span>${i + 1 < n ? ICON.check : i + 1}</span>${t}</li>`).join('')}</ol>`;

  // 화면 본문 ----------------------------------------------------------------
  function register(s, v) {
    const head = `<h2 class="h">첫 매장을 등록해요</h2><p class="small muted lead">매장 이름과 주소만 있으면 돼요. 메뉴는 다음에 넣어요.</p>`;
    if (v === 'B') {
      // 1·2·3 단계 — 한 화면에 한 가지만
      if (s === 'new') return `${steps(1)}<h2 class="h">매장 이름이 뭐예요?</h2>${nameField()}<button class="primary" type="button" data-go="search">다음</button>`;
      if (s === 'confirm') return `${steps(3)}<h2 class="h">이대로 등록할까요?</h2>
        <div class="sum"><div class="k">매장 이름</div><div><b>모래내 베이커리 &amp; 델리</b></div>
        <div class="k">주소</div><div>${PICKED.road}, 1층</div></div>${usesBox()}
        <button class="primary" type="submit">매장 등록하기</button><button class="ghost wide" type="button" data-go="search">이전</button>`;
      const mid = s === 'search' ? resultList() : s === 'zero' ? zeroBox() : s === 'fail' ? failBox() : '';
      return `${steps(2)}<h2 class="h">매장은 어디예요?</h2>${searchField(s === 'zero' ? '모래내 12' : QUERY)}${mid}
        ${s === 'fail' ? `<button class="ghost wide" type="button">다시 찾기</button><button class="link center" type="button" data-noaddr>주소 없이 먼저 등록</button>${noAddrNote()}` : ''}
        <button class="ghost wide" type="button" data-go="new">이전</button>`;
    }
    const filled = s !== 'new';
    if (v === 'C') {
      // C = A의 한 화면 흐름 + B의 말투 · 진행감. 칸마다 질문형 제목, 위에 처음 시작 진행 막대(가입 → 매장 → 메뉴 → 첫 마감)
      // 이름을 넣어야 주소 칸이 또렷해진다(흐려 있다가 켜짐) — 한 번에 한 가지에 눈이 가게, 누르는 횟수는 A와 같다
      const addrOn = filled;
      let addr;
      if (s === 'confirm') addr = pickedCard() + usesBox();
      else addr = searchField(s === 'new' ? '' : s === 'zero' ? '모래내 12' : QUERY) + (s === 'search' ? resultList() : s === 'zero' ? zeroBox() : s === 'fail' ? failBox() + noAddrNote() : '');
      return `<div class="journey-bar" aria-label="처음 시작 4단계 중 2단계"><i class="ok"></i><i class="on"></i><i></i><i></i></div>
        <div class="small muted" style="margin-top:-6px">2 / 4 · 매장 등록</div>
        <section class="q"><h2 class="h">매장 이름이 뭐예요?</h2>${nameField(filled ? '모래내 베이커리 & 델리' : '').replace(/<span class="lab">.*?<\/span><\/span>/, '<span class="lab sr">매장 이름</span>')}</section>
        <section class="q${addrOn ? '' : ' dim'}"><h2 class="h">매장은 어디예요?</h2>${addr.replace('<span class="lab">매장 주소</span>', '<span class="lab sr">매장 주소</span>')}</section>
        <button class="primary" type="submit" ${s === 'confirm' || s === 'fail' ? '' : 'disabled'}>${s === 'fail' ? '주소 없이 등록하기' : '매장 등록하기'}</button>`;
    }
    // A 한 화면: 위에서 아래로 이름 → 주소 → 등록
    let addr;
    if (s === 'confirm') addr = pickedCard() + usesBox();
    else addr = searchField(s === 'new' ? '' : s === 'zero' ? '모래내 12' : QUERY) + (s === 'search' ? resultList() : s === 'zero' ? zeroBox() : s === 'fail' ? failBox() + noAddrNote() : '');
    return `${head}${nameField(filled ? '모래내 베이커리 & 델리' : '')}${addr}
      <button class="primary" type="submit" ${s === 'confirm' || s === 'fail' ? '' : 'disabled'}>${s === 'fail' ? '주소 없이 등록하기' : '매장 등록하기'}</button>
      ${s === 'confirm' || s === 'fail' ? '' : '<p class="small muted center" style="margin:-6px 0 0">주소를 고르면 등록할 수 있어요</p>'}`;
  }

  function pick() {
    return `<h2 class="h">어느 매장을 열까요?</h2><p class="small muted lead">마지막에 연 매장이 맨 위에 있어요</p>
      <div class="stores">${STORES.map((x, i) => `<button type="button" class="storecard${x.last ? ' last' : ''}" data-open="${i}">
        <span class="sic">${x.name[0]}</span>
        <span style="flex:1;text-align:left"><b>${esc(x.name)}</b><br><span class="small muted">${x.addr}${x.closed ? ' · ' + x.closed : ''}</span></span>
        <span class="pill${x.role === '직원' ? ' staff' : ''}">${x.role}</span></button>`).join('')}</div>
      <button class="ghost wide" type="button" data-go="new">+ 새 매장 등록</button>
      <p class="small muted center" style="margin:0">매장은 앱 안에서도 바꿀 수 있어요 (데스크톱 왼쪽 위 · 휴대폰 더보기)</p>`;
  }

  function none() {
    return `<div class="empty" style="padding:24px 0 8px"><div class="big" aria-hidden="true">🏪</div>
      <h2 style="margin:8px 0 4px;font-size:18px;color:var(--text)">아직 속한 매장이 없어요</h2>
      <p class="small" style="margin:0">직원으로 일한다면 사장님께 초대 링크를 받아 열어 주세요.<br>내 매장이라면 직접 등록할 수 있어요.</p></div>
      <button class="primary" type="button" data-go="new">내 매장 등록하기</button>
      <button class="link center" type="button">로그아웃</button>`;
  }

  // 등록 직후 · 메뉴가 0개인 매장의 "오늘". 순서: 메뉴 → 식자재(기본 단가) → 레시피 → 첫 마감
  function start() {
    const T = [
      { t: '매장 등록', d: '모래내 베이커리 & 델리 · 서대문구 모래내로 12', done: true },
      { t: '메뉴 넣기', d: '판매하는 메뉴와 가격, 당일 생산품인지', cta: '메뉴 넣기' },
      { t: '식자재 넣기', d: '기본 단위와 기본 단가 — 손실 금액을 계산하는 데 사용해요' },
      { t: '레시피 잇기', d: '메뉴 하나에 들어가는 재료와 양' },
      { t: '첫 마감 입력', d: '오늘 문 닫을 때 만든 · 남은 수량' },
    ];
    const done = T.filter((x) => x.done).length;
    return `<div class="welcome"><div class="small muted">모래내 베이커리 &amp; 델리</div>
        <h2 class="h" style="margin-top:2px">시작 준비 <span class="num">${done}/${T.length}</span></h2>
        <div class="bar"><i style="width:${done / T.length * 100}%"></i></div></div>
      <ol class="todo">${T.map((x, i) => `<li class="${x.done ? 'done' : i === done ? 'cur' : ''}">
        <span class="dot">${x.done ? ICON.check : i + 1}</span>
        <span style="flex:1"><b>${esc(x.t)}</b><br><span class="small muted">${esc(x.d)}</span>
        ${i === done ? `<br><button class="primary inline" type="button">${x.cta}</button>` : ''}</span></li>`).join('')}</ol>
      <div class="uses"><span class="small">레시피 없이도 마감은 입력할 수 있어요. 다만 <b>손실 금액</b>은 레시피와 단가가 있어야 나와요.</span></div>
      <button class="link center" type="button">직원 초대는 나중에 — 매장 · 직원에서</button>`;
  }

  function body(s, v) {
    if (s === 'pick') return pick();
    if (s === 'none') return none();
    if (s === 'start') return start();
    return register(s, v);
  }

  function wire(root) {
    const go = (s) => { const p = new URLSearchParams(location.search); p.set('state', s); location.search = p.toString(); };
    root.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
    root.querySelectorAll('[data-pick]').forEach((b) => b.onclick = () => go('confirm'));
    root.querySelectorAll('[data-noaddr]').forEach((b) => b.onclick = () => ZW.toast('주소 없이 등록 → 시작 체크리스트'));
    root.querySelectorAll('[data-open]').forEach((b) => b.onclick = () => ZW.toast(STORES[b.dataset.open].role === '직원' ? '직원 → 마감 화면' : '점주 → 오늘'));
    const q = root.querySelector('#q');
    if (q) q.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(q.value.trim() ? 'search' : 'zero'); } };
    const f = root.querySelector('form');
    if (f) f.onsubmit = (e) => { e.preventDefault(); go('start'); };
  }

  window.STORE = { STATES, state, variant, body, wire };
})();
