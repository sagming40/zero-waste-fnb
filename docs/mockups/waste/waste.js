/* 재료 폐기 (F09) 시안 공용 — Waste.mobile.html · Waste.desktop.html.
 * shared.js · _shared/stock-data.js 뒤에 읽는다. 값은 전부 지어낸 예시다.
 * 오늘 재료 폐기 합계는 오늘 손실 시안(loss/)의 "재료 폐기 ₩4,200"과 맞췄다(쌀 800 + 양상추 1,600 + 방울토마토 1,800).
 *
 * state (?state=)
 *   new     빈 화면 — 오늘 기록 2건
 *   entry   입력 중 — 재고 화면 "재료 폐기로"에서 옴: 방울토마토 만료 로트 300g (기본)
 *   split   한 로트로 모자라 두 로트에 나눠 뺌 — 양상추 손질 600g
 *   menu    만든 메뉴 폐기 — 크루아상 12개 조리 실수 → 레시피로 펼쳐 재료를 뺌, 버터는 부족
 *   error   원인 안 고름 + 양 없음
 *   saved   저장한 뒤 — 오늘 재료 폐기 ₩4,200
 * role (?role=) owner · staff — 직원 화면에는 금액이 없다 (DESIGN 8.4)
 */
(function () {
  const STATES = [['new', '빈 화면'], ['entry', '입력 중 (만료)'], ['split', '두 로트에 나눔'], ['menu', '만든 메뉴'], ['error', '고칠 곳'], ['saved', '저장 뒤']];
  const role = ZW.params.get('role') === 'staff' ? 'staff' : 'owner';
  const owner = role === 'owner';
  const state = ZW.params.get('state') || 'entry';
  const variant = (ZW.params.get('v') || 'A').toUpperCase();
  const { won } = ZW;
  const S = STK;

  const CAUSES = [
    { k: 'expired', t: '유통기한 만료' }, { k: 'mistake', t: '조리 실수' }, { k: 'trim', t: '손질' }, { k: 'other', t: '기타' },
  ];
  const cause = (k) => (CAUSES.find((c) => c.k === k) || {}).t;
  const ICON = {
    x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  };

  // 로트 단가(없으면 기본 단가)로 금액 — 원가 합계에서만 반올림
  const lotPer = (l) => (l.price !== null ? l.price / l.qty0 : S.basePer(S.ingById[l.ing]));
  const lotById = (id) => S.LOTS.find((l) => l.id === id);
  const findLot = (ing, date) => S.LOTS.find((l) => l.ing === ing && l.date === date);

  // 오늘 이미 저장한 기록 (최신이 위). take: [[로트, 양]]
  const rice = findLot('rice', '2026-11-03'), let4 = findLot('lettuce', '2026-11-04'), tom1 = findLot('tomato', '2026-11-01');
  const R_RICE = { time: '10:30', by: 'staff', ing: 'rice', qty: 320, cause: 'mistake', memo: '밥이 탐', take: [[rice, 320]] };
  const R_LET = { time: '14:10', by: 'staff', ing: 'lettuce', qty: 400, cause: 'trim', memo: '', take: [[let4, 400]] };
  const R_TOM = { time: '15:40', by: 'owner', ing: 'tomato', qty: 300, cause: 'expired', memo: '', take: [[tom1, 300]] };
  const recWon = (r) => (r.menu ? r.won : Math.round(r.take.reduce((s, [l, q]) => s + lotPer(l) * q, 0)));
  const records = state === 'saved' ? [R_TOM, R_LET, R_RICE] : state === 'split' ? [R_RICE] : [R_LET, R_RICE];

  // 지금 입력 중인 것
  const CROISSANT = [['flour', 60], ['butter', 35], ['milk', 20], ['sugar', 8], ['egg', 0.2], ['salt', 1.2]]; // 1개 레시피 (settings 시안과 같은 값)
  function current() {
    if (state === 'new') return null;
    if (state === 'entry') return { kind: 'ing', ing: 'tomato', cause: 'expired', qty: 300, lots: [[tom1, 300]], from: 'stock' };
    if (state === 'split') return { kind: 'ing', ing: 'lettuce', cause: 'trim', qty: 600, lots: [[let4, 400], [findLot('lettuce', '2026-11-07'), 200]] };
    if (state === 'error') return { kind: 'ing', ing: 'milk', cause: null, qty: null, lots: [] };
    if (state === 'menu') return { kind: 'menu', menu: 'croissant', cause: 'mistake', qty: 12, memo: '오븐 온도 — 한 판 탐' };
    return null;
  }
  const cur = current();

  // 조각 ----------------------------------------------------------------------
  const kindSeg = (k) => `<div class="seg"><button type="button" aria-pressed="${k !== 'menu'}" data-go="entry">재료</button><button type="button" aria-pressed="${k === 'menu'}" data-go="menu">만든 메뉴</button></div>`;
  const causeChips = (c, bad) => `<div class="chips${bad ? ' badc' : ''}">${CAUSES.map((x) => `<button type="button" class="chip" aria-pressed="${x.k === c}">${x.t}</button>`).join('')}</div>
    ${bad ? '<span class="field-err">원인을 골라 주세요</span>' : ''}`;

  function lotPicker(c) {
    const i = S.ingById[c.ing];
    const lots = S.LOTS.filter((l) => l.ing === c.ing && l.left > 0)
      .sort((a, b) => (a.exp || '9').localeCompare(b.exp || '9'));
    if (!lots.length) return '<div class="small muted">재고 기록이 없는 재료예요 — 재고는 그대로, 손실은 기본 단가로 계산해요</div>';
    const takeOf = (l) => (c.lots.find(([x]) => x === l) || [])[1] || 0;
    return `<div class="lots">${lots.map((l, k) => {
      const t = takeOf(l), e = S.expInfo(l.exp);
      return `<div class="lotpick${t ? ' on' : ''}"><span class="box">${t ? ICON.check : ''}</span>
        <span class="grow"><b>${S.fmtShort(l.date)} 입고</b> <span class="small exp-${e.kind}">${l.exp ? `${S.fmtShort(l.exp)} · ${e.text}` : e.text}</span>
          <br><span class="small muted">남은 ${S.fmtQty(l.left, i.unit)}${e.kind === 'over' ? ' · 따로 둔 만료 로트' : k === 0 || (lots[0] && S.expInfo(lots[0].exp).kind === 'over' && k === 1) ? ' · 다음에 먼저 사용할 로트' : ''}</span></span>
        <span class="num take">${t ? `− ${S.fmtQty(t, i.unit)}` : ''}</span></div>`;
    }).join('')}</div>
    <span class="small muted">${c.cause === 'expired' ? '만료 · 임박 로트가 위에 와요.' : '유통기한 빠른 로트부터 빼요.'} 한 로트로 모자라면 다음 로트에서 이어서 빼요 — 눌러서 바꿀 수 있어요</span>`;
  }

  function lossLine(c) {
    if (!owner) return '';
    if (c.kind === 'menu') {
      const m = ZW.MENUS.find((x) => x.id === c.menu);
      return `<div class="lossbox"><span>손실 <span class="small muted">1개 원가 ${won(m.cost)} × ${c.qty}개</span></span><b class="num">${won(m.cost * c.qty)}</b></div>`;
    }
    if (!c.qty) return '<div class="lossbox muted"><span>손실</span><b>—</b></div>';
    const v = Math.round(c.lots.reduce((s, [l, q]) => s + lotPer(l) * q, 0));
    const parts = c.lots.map(([l, q]) => `${S.fmtQty(q, S.ingById[c.ing].unit)} × ${S.fmtPer(lotPer(l), S.ingById[c.ing].unit)}`).join(' + ');
    return `<div class="lossbox"><span>손실 <span class="small muted">${parts} · 입고 단가</span></span><b class="num">${won(v)}</b></div>`;
  }

  // 한 건 폼 (휴대폰 A · 데스크톱 A 왼쪽)
  function form(c) {
    if (!c) {
      return `<div class="wform">${kindSeg('ing')}
        <span class="inp"><span class="muted ic">${ICON.search}</span><input placeholder="폐기한 재료 찾기" aria-label="재료 찾기"></span>
        <div class="freq"><span class="small muted">따로 둔 만료 · 임박 로트</span><div class="chips">
          <button type="button" class="chip warnchip" data-go="entry">방울토마토 300g · 만료</button><button type="button" class="chip">양상추 400g · 오늘까지</button>
          <button type="button" class="chip">소고기 600g · 오늘까지</button><button type="button" class="chip">식빵 2개 · 내일까지</button></div></div></div>`;
    }
    if (c.kind === 'menu') {
      const m = ZW.MENUS.find((x) => x.id === c.menu);
      const butter = S.stockOf('butter');
      return `<div class="wform">${kindSeg('menu')}
        <div class="banner info" style="margin:0"><b>마감의 "만든 수량"에 넣지 않은 것만</b>탄 한 판처럼 진열하지 못한 것. 팔려고 내놨다가 남은 건 마감에서 "남은 수량 → 폐기"로 넣어요 — 두 곳에 넣으면 두 번 세져요.</div>
        <div class="pickedrow"><b>${m.name}</b><span class="small muted">${m.cat} · 레시피 ${CROISSANT.length}가지</span><button class="iconbtn sm" aria-label="바꾸기">${ICON.x}</button></div>
        <div class="fld"><span class="lab">원인</span>${causeChips(c.cause)}</div>
        <div class="fld"><span class="lab">몇 개</span><div class="qrow"><div class="stepper"><button type="button">−</button><span class="v num">${c.qty}</span><button type="button">+</button></div><span class="small muted">개</span></div></div>
        <div class="fld"><span class="lab">레시피로 빼는 재료 <span class="muted small">${c.qty}개분</span></span>
          <div class="expand">${CROISSANT.map(([id, q]) => { const i = S.ingById[id], need = q * c.qty, s = S.stockOf(id); const short = id === 'butter' ? need : 0;
            return `<div class="erow"><span class="grow">${i.name}</span><span class="num">${S.fmtQty(Math.round(need * 10) / 10, i.unit)}</span>${short ? `<span class="tag loss">재고 0 · 부족 ${S.fmtQty(need, i.unit)}</span>` : `<span class="small muted">재고 ${S.fmtQty(s.liveQty, i.unit)}</span>`}</div>`; }).join('')}</div>
          <span class="small muted">버터는 재고가 ${butter.liveQty ? '모자라' : '0이라'} 빼지 못한 양이 부족에 더해져요(재고 화면에서 맞춰요)</span></div>
        <label class="fld"><span class="lab">메모 <span class="muted small">선택</span></span><span class="inp"><input value="${c.memo || ''}"></span></label>
        ${lossLine(c)}</div>`;
    }
    const i = S.ingById[c.ing], q = S.inputQty(c.qty, i.unit), st = S.stockOf(c.ing);
    const big = S.BIG[i.unit];
    return `<div class="wform">${kindSeg('ing')}
      ${c.from ? '<div class="banner info" style="margin:0">재고 화면 "재료 폐기로"에서 왔어요 — 원인 · 로트 · 양을 채워 뒀어요</div>' : ''}
      <div class="pickedrow"><b>${i.name}</b><span class="small muted">재고 ${S.fmtQty(st.liveQty, i.unit)}${st.expired.length ? ` · 만료 ${S.fmtQty(st.expired.reduce((s, l) => s + l.left, 0), i.unit)} 따로` : ''}</span><button class="iconbtn sm" aria-label="재료 바꾸기">${ICON.x}</button></div>
      <div class="fld"><span class="lab">원인</span>${causeChips(c.cause, state === 'error')}</div>
      <div class="fld"><span class="lab">양</span>
        <div class="qrow"><span class="inp q${state === 'error' ? ' bad' : ''}"><input class="num" inputmode="decimal" value="${q.v}" placeholder="0"></span>
          ${big ? `<div class="seg sm unitseg">${[big, i.unit].map((x) => `<button type="button" aria-pressed="${x === q.u}">${x}</button>`).join('')}</div>` : `<span class="unit1">${i.unit}</span>`}
          ${c.from ? '<button type="button" class="chip" aria-pressed="true">로트 전부</button>' : ''}</div>
        ${state === 'error' ? '<span class="field-err">양을 넣어 주세요</span>' : ''}</div>
      <div class="fld"><span class="lab">어느 로트에서</span>${lotPicker(c)}</div>
      <label class="fld"><span class="lab">메모 <span class="muted small">선택 · 기타면 필수</span></span><span class="inp"><input placeholder="예: 바닥에 떨어뜨림"></span></label>
      ${lossLine(c)}</div>`;
  }

  // 오늘 기록
  function recordRow(r) {
    const i = S.ingById[r.ing];
    return `<div class="wrec"><span class="grow"><b>${i.name}</b> <span class="num">${S.fmtQty(r.qty, i.unit)}</span> <span class="tag c-${r.cause}">${cause(r.cause)}</span>
      <br><span class="small muted">${r.time} · ${S.PEOPLE[r.by]}${r.memo ? ` · ${r.memo}` : ''} · ${r.take.map(([l]) => `${S.fmtShort(l.date)} 입고 로트`).join(', ')}</span></span>
      ${owner ? `<b class="num loss-t">${won(recWon(r))}</b>` : ''}</div>`;
  }
  function todayList() {
    const total = records.reduce((s, r) => s + recWon(r), 0);
    return `<div class="colhead small muted"><span>오늘 재료 폐기 ${records.length}건</span>${owner ? `<span>합계 <b class="loss-t num">${won(total)}</b></span>` : ''}</div>
      <div class="wrecs">${records.map(recordRow).join('')}</div>
      <p class="small muted" style="margin:6px 2px 0">${owner ? '오늘 손실에 "재료"로 더해져요. ' : ''}잘못 넣었으면 눌러서 고쳐요 — 지우지 않고 원장에 고침 줄이 남아요</p>`;
  }

  // 여러 줄 (휴대폰 B · 데스크톱 B)
  function batchLines() {
    if (state === 'new') return [];
    const L = [
      { ing: 'tomato', qty: 300, cause: 'expired', lots: [[tom1, 300]] },
      { ing: 'lettuce', qty: 600, cause: 'trim', lots: [[let4, 400], [findLot('lettuce', '2026-11-07'), 200]] },
      { ing: 'beef', qty: 600, cause: 'expired', lots: [[findLot('beef', '2026-11-05'), 600]] },
    ];
    if (state === 'error') { L.push({ ing: 'milk', qty: null, cause: null, lots: [] }); }
    if (state === 'menu') L.push({ menu: 'croissant', qty: 12, cause: 'mistake' });
    return L;
  }
  const lineWon = (l) => (l.menu ? ZW.MENUS.find((m) => m.id === l.menu).cost * l.qty : l.qty ? Math.round(l.lots.reduce((s, [x, q]) => s + lotPer(x) * q, 0)) : 0);

  // 여러 줄 — 접힌 줄 · 펼친 줄
  function lineSum(l, k) {
    if (l.menu) {
      const m = ZW.MENUS.find((x) => x.id === l.menu);
      return `<button type="button" class="lcard sum" data-edit="${k}"><span class="grow"><b>${m.name}</b> <span class="num">${l.qty}개</span> <span class="tag">만든 메뉴</span> <span class="tag c-${l.cause}">${cause(l.cause)}</span>
        <br><span class="small muted">레시피로 재료 ${CROISSANT.length}가지를 빼요 · 버터 부족</span></span>${owner ? `<b class="num loss-t">${won(lineWon(l))}</b>` : ''}</button>`;
    }
    const i = S.ingById[l.ing], bad = !l.qty || !l.cause;
    return `<button type="button" class="lcard sum${bad ? ' bad' : ''}" data-edit="${k}"><span class="grow"><b>${i.name}</b> <span class="num">${l.qty ? S.fmtQty(l.qty, i.unit) : '<span class="loss-t">양 없음</span>'}</span> ${l.cause ? `<span class="tag c-${l.cause}">${cause(l.cause)}</span>` : '<span class="tag loss">원인 없음</span>'}
      <br><span class="small muted">${l.lots.length ? l.lots.map(([x, q]) => `${S.fmtShort(x.date)} 로트 ${S.fmtQty(q, i.unit)}`).join(' + ') : '로트 —'}</span></span>${owner && l.qty ? `<b class="num loss-t">${won(lineWon(l))}</b>` : ''}</button>`;
  }
  function lineEdit(l) {
    const i = S.ingById[l.ing], q = S.inputQty(l.qty, i.unit), big = S.BIG[i.unit];
    return `<div class="lcard edit${!l.qty || !l.cause ? ' bad' : ''}"><div class="lh"><b>${i.name}</b><span class="small muted grow">재고 ${S.fmtQty(S.stockOf(l.ing).liveQty, i.unit)}</span><button class="iconbtn sm" aria-label="줄 빼기">${ICON.x}</button></div>
      <div class="fld"><span class="lab">원인</span>${causeChips(l.cause, !l.cause)}</div>
      <div class="fld"><span class="lab">양</span><div class="qrow"><span class="inp q${!l.qty ? ' bad' : ''}"><input class="num" value="${q.v}" placeholder="0"></span>${big ? `<div class="seg sm unitseg">${[big, i.unit].map((x) => `<button type="button" aria-pressed="${x === q.u}">${x}</button>`).join('')}</div>` : `<span class="unit1">${i.unit}</span>`}</div>
        ${!l.qty ? '<span class="field-err">양을 넣어 주세요</span>' : ''}</div>
      <div class="fld"><span class="lab">어느 로트에서</span>${lotPicker(l)}</div></div>`;
  }

  function saved() {
    return `<div class="done"><div class="okmark">${ICON.check}</div>
      <h2>방울토마토 300g을 폐기로 기록했어요</h2>
      <p class="small muted" style="margin:0">유통기한 만료 · 11/1 입고 로트 · 재고에서 따로 둔 만료 로트가 없어졌어요</p>
      ${owner ? `<div class="lossbox"><span>오늘 재료 폐기</span><b class="num">₩2,400 → ${won(records.reduce((s, r) => s + recWon(r), 0))}</b></div>
        <p class="small muted" style="margin:0">오늘 손실(마감 후 화면)에 "재료"로 더해져요</p>` : ''}
      <div class="actions"><button class="primary" type="button" data-go="new">하나 더 기록</button><button class="ghost wide" type="button">${owner ? '재고 보기' : '마감 입력으로'}</button></div></div>`;
  }

  function wire(root) {
    const go = (s) => { const p = new URLSearchParams(location.search); p.set('state', s); location.search = p.toString(); };
    root.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
    root.querySelectorAll('[data-toast]').forEach((b) => b.onclick = () => ZW.toast(b.dataset.toast));
    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => ZW.toast('누르면 이 줄이 펼쳐져요'));
    root.querySelectorAll('.chip[aria-pressed]').forEach((b) => b.onclick = () => { b.parentElement.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); });
    root.querySelectorAll('.lotpick').forEach((b) => b.onclick = () => b.classList.toggle('on'));
  }

  window.WST = { STATES, state, variant, role, owner, CAUSES, cause, ICON, cur, form, todayList, records, recWon, batchLines, lineWon, lineSum, lineEdit, lotPicker, lossLine, causeChips, saved, wire, CROISSANT };
})();
