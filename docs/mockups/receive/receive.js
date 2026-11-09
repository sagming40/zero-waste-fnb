/* 입고 (F10) 시안 공용 — Receive.mobile.html · Receive.desktop.html.
 * shared.js · _shared/stock-data.js 뒤에 읽는다. 값은 전부 지어낸 예시다.
 *
 * state (?state=)
 *   new      빈 입고 — 오늘 처음 연 화면
 *   entry    입력 중 — 4줄, 마지막 줄(리코타 치즈)을 고치는 중 (기본)
 *   error    고칠 곳 — 양이 빈 줄 + 이미 지난 유통기한
 *   search   없는 재료를 찾음 — 점주는 그 자리에서 새 식자재, 직원은 안내만
 *   saved    저장한 뒤
 *   history  입고 기록 — 점주에게는 "단가 확인 필요"
 *   fill     점주가 직원이 넣은 입고에 단가 채우기 (직원이면 history로)
 * role (?role=)  owner 점주 · staff 직원 — 직원 화면에는 금액이 없다 (DESIGN 8.4, 2026-11-09 사용자 결정: 단가는 점주가 나중에)
 */
(function () {
  const STATES = [
    ['new', '빈 입고'], ['entry', '입력 중'], ['error', '고칠 곳'], ['search', '없는 재료'],
    ['saved', '저장 뒤'], ['history', '입고 기록'], ['fill', '단가 채우기'],
  ];
  const role = ZW.params.get('role') === 'staff' ? 'staff' : 'owner';
  let state = ZW.params.get('state') || 'entry';
  if (state === 'fill' && role === 'staff') state = 'history';
  const variant = (ZW.params.get('v') || 'A').toUpperCase();
  const owner = role === 'owner';
  const { won } = ZW;
  const S = STK;

  const ICON = {
    x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
    cal: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
  };

  // 지금 입력 중인 입고 (오늘, 점주가 아침 납품을 넣는 중). price null = 비어 있음
  function entryLines() {
    const L = [
      { ing: 'bean', qty: 2000, exp: S.addDays(S.TODAY, 90), price: 56000 },
      { ing: 'butter', qty: 2000, exp: S.addDays(S.TODAY, 60), price: 32000 },
      { ing: 'tomato', qty: 1500, exp: S.addDays(S.TODAY, 5), price: 9000 },
      { ing: 'ricotta', qty: 1000, exp: S.addDays(S.TODAY, 10), price: null, editing: true },
    ];
    if (state === 'error') {
      L[1].qty = null; L[1].editing = true; L[3].editing = false; L[3].price = 18000;
      L[2].exp = '2026-11-05'; // 이미 지난 날 — 막지는 않고 묻는다
    }
    if (state === 'search') { L[3].editing = false; L[3].price = 18000; }
    if (state === 'saved') { L[3].editing = false; L[3].price = 18000; L[3].saveBase = true; }
    return L;
  }
  const lines = state === 'new' ? [] : entryLines();
  const FILL = S.RECEIPTS.find((r) => r.id === 'r1107');
  const fillLines = () => FILL.lines.map(([ing, qty, exp, price], k) => ({ ing, qty, exp, price: k === 0 ? 16800 : price, need: price === null && k !== 0, filled: k === 0 }));

  const qtyBad = (l) => l.qty === null || l.qty === 0;
  const errCount = (L) => L.filter(qtyBad).length;
  function sum(L) {
    let total = 0, empty = 0;
    L.forEach((l) => { if (l.price === null) empty++; else total += l.price; });
    return { total, empty, n: L.length };
  }

  // 조각 ----------------------------------------------------------------------
  function unitSeg(i, u) {
    const big = S.BIG[i.unit];
    if (!big) return `<span class="unit1">${i.unit}</span>`;
    return `<div class="seg sm unitseg">${[big, i.unit].map((x) => `<button type="button" aria-pressed="${x === u}">${x}</button>`).join('')}</div>`;
  }
  const expText = (exp) => { const e = S.expInfo(exp); return `<span class="exp-${e.kind}">${e.kind === 'none' ? e.text : `${S.fmtShort(exp)} · ${e.text}`}</span>`; };
  function vsHtml(i, price, qty) {
    const v = S.vsBase(i, price, qty);
    if (!v) return '';
    return `<span class="vs vs-${v.kind}">${v.kind === 'up' ? '▲ ' : v.kind === 'down' ? '▼ ' : ''}${v.text}</span>`;
  }

  // 한 줄 — 펼친 카드 (고치는 중)
  function lineEdit(l, idx, opts = {}) {
    const i = S.ingById[l.ing], q = S.inputQty(l.qty, i.unit);
    const e = S.expInfo(l.exp);
    const like = i.shelf ? S.addDays(S.TODAY, i.shelf) : null;
    const per = S.fmtPer(S.perUnit(l.price, l.qty), i.unit);
    const priceRow = !owner ? '' : `<div class="fld"><span class="lab">금액 <span class="muted small">이 줄 전부 · 명세서 금액 그대로</span></span>
        <span class="inp${l.need ? ' need' : ''}"><input class="num" inputmode="numeric" value="${l.price === null ? '' : l.price.toLocaleString('ko-KR')}" placeholder="${l.need ? '단가를 넣어 주세요' : '비워 둬도 돼요'}"><span class="muted">원</span></span>
        <span class="small muted">${l.price !== null
          ? (per ? `= ${per} · ${vsHtml(i, l.price, l.qty)}` : '양을 넣으면 1단위당 값이 나와요')
          : i.pack ? `비워 두면 기본 단가(${S.fmtPer(S.basePer(i), i.unit)})로 계산해요. 나중에 입고 기록에서 넣어도 돼요`
            : '<span class="warn-t">이 재료는 기본 단가도 없어요 — 비워 두면 손실 금액에서 제외돼요</span>'}</span>
        ${!i.pack ? `<label class="check small"><input type="checkbox" ${l.price !== null || l.saveBase ? 'checked' : ''}> 이 값을 기본 단가로도 저장</label>` : ''}
      </div>`;
    return `<div class="lcard edit${qtyBad(l) ? ' bad' : ''}${l.need ? ' needc' : ''}" data-line="${idx}">
      ${opts.noHead ? '' : `<div class="lh"><b>${i.name}</b><span class="muted small">기본 단위 ${i.unit}</span>${opts.noRemove ? '' : `<button type="button" class="iconbtn sm" aria-label="${i.name} 줄 빼기">${ICON.x}</button>`}</div>`}
      <div class="fld"><span class="lab">양</span>
        <div class="qrow"><span class="inp q${qtyBad(l) ? ' bad' : ''}"><input class="num" inputmode="decimal" value="${q.v}" placeholder="0"></span>${unitSeg(i, q.u)}
          <span class="small muted">${l.qty ? (q.u !== i.unit ? `= ${l.qty.toLocaleString('ko-KR')}${i.unit}` : '') : ''}</span></div>
        ${qtyBad(l) ? '<span class="field-err">양을 넣어 주세요</span>' : ''}</div>
      <div class="fld"><span class="lab">유통기한</span>
        <div class="qrow"><button type="button" class="datebtn${e.kind === 'over' ? ' warnb' : ''}">${ICON.cal} ${l.exp ? S.fmtDate(l.exp) : '없음'}</button><span class="small exp-${e.kind}">${l.exp ? e.text : ''}</span></div>
        <div class="chips">${like ? `<button type="button" class="chip" aria-pressed="${l.exp === like}">지난번처럼 ${i.shelf}일</button>` : ''}
          <button type="button" class="chip" aria-pressed="${l.exp === S.addDays(S.TODAY, 3)}">+3일</button><button type="button" class="chip" aria-pressed="${l.exp === S.addDays(S.TODAY, 7)}">+7일</button>
          <button type="button" class="chip" aria-pressed="${l.exp === null}">없음</button></div>
        ${e.kind === 'over' ? '<span class="small warn-t">이미 지난 날짜예요 — 맞나요? 저장은 돼요(받자마자 폐기할 것이면 재료 폐기로)</span>' : ''}
        ${l.exp === null ? '<span class="small muted">유통기한 없는 재료(소금 · 설탕)는 차감할 때 맨 뒤, 임박 경고에서 제외돼요</span>' : ''}
      </div>
      ${priceRow}
    </div>`;
  }
  // 한 줄 — 접힌 요약 (누르면 펼침)
  function lineSum(l, idx) {
    const i = S.ingById[l.ing];
    const right = !owner ? '' : l.price === null ? (i.pack ? '<span class="tag">기본 단가로</span>' : '<span class="tag warn">단가 없음</span>')
      : `<b class="num">${won(l.price)}</b>`;
    return `<button type="button" class="lcard sum${qtyBad(l) ? ' bad' : ''}" data-edit="${idx}">
      <span class="grow"><b>${i.name}</b> <span class="num">${l.qty ? S.fmtQty(l.qty, i.unit) : '<span class="loss-t">양 없음</span>'}</span>
        <br><span class="small muted">${expText(l.exp)}</span>${owner && l.price !== null && /up|down/.test((S.vsBase(i, l.price, l.qty) || {}).kind) ? ` <span class="small muted">·</span> <span class="small">${vsHtml(i, l.price, l.qty)}</span>` : ''}</span>
      <span class="r">${right}</span></button>`;
  }

  // 재료 찾기 — 없는 재료면 점주는 그 자리에서 새 식자재, 직원은 안내 (식자재는 점주만 만든다, DESIGN 8.4)
  const FREQ = ['milk', 'lettuce', 'bread', 'egg', 'tomato', 'ham'];
  function addBox(big) {
    if (state === 'search') {
      return `<div class="adding"><span class="inp"><span class="muted ic">${ICON.search}</span><input value="바질" aria-label="재료 찾기"></span>
        <div class="small muted" style="padding:6px 2px">"바질"과 맞는 식자재가 없어요</div>
        ${owner ? `<div class="newing">
          <div class="small"><b>새 식자재 "바질"</b> <span class="muted">— 메뉴 · 레시피의 식자재에도 생겨요</span></div>
          <div class="seg sm"><button type="button" aria-pressed="true">g</button><button type="button">ml</button><button type="button">개</button></div>
          <div class="small muted">탄소 분류 · 기본 단가는 나중에 메뉴 · 레시피에서 채워요</div>
          <button class="primary inline" type="button">만들고 이 입고에 더하기</button></div>`
        : `<div class="newing staffnote small">식자재는 사장님만 만들 수 있어요. 사장님께 "바질"을 알려 주세요 — 오늘 받은 바질은 사장님이 식자재를 만든 뒤 입고 기록에서 더할 수 있어요.</div>`}
      </div>`;
    }
    return `<div class="adding${big ? ' big' : ''}"><span class="inp"><span class="muted ic">${ICON.search}</span><input placeholder="재료 이름으로 찾기" aria-label="재료 찾기"></span>
      <div class="freq"><span class="small muted">자주 들어오는 재료</span><div class="chips">${FREQ.map((id) => `<button type="button" class="chip">+ ${S.ingById[id].name}</button>`).join('')}</div></div></div>`;
  }

  // 입고 기록 --------------------------------------------------------------------
  const who = (k) => `${S.PEOPLE[k]}${k === 'owner' ? ' (점주)' : ''}`;
  function receiptCard(r, sel) {
    const miss = S.missingPrice(r);
    const names = r.lines.map(([id, q]) => `${S.ingById[id].name} ${S.fmtQty(q, S.ingById[id].unit)}`).join(' · ');
    const right = owner
      ? `${miss ? `<span class="tag warn">단가 확인 ${miss}줄</span>` : ''}${miss === r.lines.length ? '<span class="small muted">금액 없음</span>' : `<b class="num">${won(S.receiptTotal(r))}${miss ? ' + ?' : ''}</b>`}`
      : `<span class="small muted">${r.lines.length}줄</span>`;
    return `<button type="button" class="rcard${sel ? ' sel' : ''}${owner && miss ? ' need' : ''}" data-receipt="${r.id}">
      <span class="grow"><b>${S.fmtDate(r.date)}</b> <span class="small muted">${r.time} · ${who(r.by)}</span>
        <br><span class="small">${names}</span>${r.filledBy ? `<br><span class="small muted">단가: ${S.PEOPLE[r.filledBy]}이 나중에 넣음</span>` : ''}</span>
      <span class="r">${right}</span></button>`;
  }
  function historyList(selId) {
    const need = S.RECEIPTS.reduce((s, r) => s + S.missingPrice(r), 0);
    return `${owner && need ? `<div class="banner warn" style="margin:12px 0 0"><b>단가 확인 필요 ${need}줄</b>직원이 넣었거나 비워 둔 줄이에요. 넣기 전까지는 기본 단가로 계산해요.</div>` : ''}
      ${!owner ? '<div class="banner info" style="margin:12px 0 0">금액은 사장님만 봐요. 양 · 유통기한이 틀렸으면 그 입고를 눌러 고쳐요.</div>' : ''}
      <div class="rlist">${S.RECEIPTS.map((r) => receiptCard(r, r.id === selId)).join('')}</div>
      <p class="small muted center">최근 2주 · 그 전 기록 더 보기</p>`;
  }

  // 점주가 단가 채우기 (직원이 넣은 11월 7일 입고)
  function fillView(forDesktopTable) {
    const L = fillLines();
    const used = FILL.usedBy.map((d) => S.fmtDate(d)).join(' · ');
    const head = `<div class="banner info" style="margin:0"><b>${S.PEOPLE[FILL.by]} 님이 ${FILL.time}에 넣은 입고예요</b>단가가 빈 줄은 넣기 전까지 기본 단가로 계산했어요.</div>
      <div class="banner warn" style="margin:0"><b>${used} 마감에서 이 입고의 재료를 사용했어요</b>단가를 넣으면 그날 손실을 입고 단가로 다시 계산해요 — 오늘 손실 · 이번 주 숫자가 조금 바뀔 수 있어요.</div>`;
    if (forDesktopTable) return { head, L };
    // 점주가 할 일은 금액뿐 — 금액 칸만 펼치고, 단가가 이미 있는 줄은 접는다. 양 · 유통기한은 줄을 눌러 펼쳐 고친다
    const priceCard = (l, k) => {
      const i = S.ingById[l.ing];
      const per = S.fmtPer(S.perUnit(l.price, l.qty), i.unit);
      return `<div class="lcard edit${l.need ? ' needc' : ''}" data-line="${k}">
        <div class="lh"><b>${i.name}</b> <span class="num">${S.fmtQty(l.qty, i.unit)}</span><span class="small muted">${expText(l.exp)}</span></div>
        <div class="fld"><span class="lab">금액 <span class="muted small">명세서 금액 그대로</span></span>
          <span class="inp${l.need ? ' need' : ''}"><input class="num" inputmode="numeric" value="${l.price === null ? '' : l.price.toLocaleString('ko-KR')}" placeholder="단가를 넣어 주세요"><span class="muted">원</span></span>
          <span class="small muted">${l.price !== null ? `= ${per} · ${vsHtml(i, l.price, l.qty)}` : `지금은 기본 단가(${S.fmtPer(S.basePer(i), i.unit)})로 계산 중이에요`}</span></div></div>`;
    };
    return `<div class="form">${head}${L.map((l, k) => (l.need || l.filled ? priceCard(l, k) : lineSum(l, k))).join('')}
      <p class="small muted" style="margin:0">줄을 누르면 양 · 유통기한도 고칠 수 있어요. 양을 고치면 재고 원장에 고침 줄이 더해지고, 이미 사용한 양보다 적게 고칠 수는 없어요.</p>
      <button class="primary" type="button">단가 저장</button></div>`;
  }

  // 저장한 뒤
  function savedView() {
    const L = lines, t = sum(L);
    return `<div class="done">
      <div class="okmark">${ICON.check}</div>
      <h2>입고 ${L.length}줄을 재고에 더했어요</h2>
      <p class="small muted" style="margin:0">${S.fmtDate(S.TODAY)} · ${S.PEOPLE[role]}${owner ? ` · 합계 <b class="num">${won(t.total)}</b>` : ''}</p>
      <div class="donelist">${L.map((l) => { const i = S.ingById[l.ing]; return `<div class="row-between"><span>${i.name} <span class="num">${S.fmtQty(l.qty, i.unit)}</span></span><span class="small muted">${expText(l.exp)}</span></div>`; }).join('')}</div>
      ${owner ? '<p class="small muted" style="margin:0">리코타 치즈 1kg당 18,000원을 기본 단가로도 저장했어요</p>'
        : '<div class="banner info" style="margin:0">단가는 사장님 화면에 "단가 확인 필요"로 보여요. 사장님이 넣기 전까지는 기본 단가로 계산해요.</div>'}
      <div class="actions">${owner ? '<button class="primary" type="button" data-go="new">입고 하나 더</button><button class="ghost wide" type="button">재고 보기</button>'
        : '<button class="primary" type="button" data-go="new">입고 하나 더</button><button class="ghost wide" type="button">마감 입력으로</button>'}</div></div>`;
  }

  // 휴대폰 B — 재료 목록에서 고르기. 자주 들어오는 재료가 위
  function pickList() {
    const order = [...new Set([...lines.map((l) => l.ing), ...FREQ, ...S.ING.map((i) => i.id)])];
    const inLines = Object.fromEntries(lines.map((l, k) => [l.ing, k]));
    const rows = order.map((id) => {
      const i = S.ingById[id], k = inLines[id];
      if (k === undefined) {
        return `<button type="button" class="pick"><span class="box"></span><span class="grow"><b>${i.name}</b> <span class="muted small">${i.unit}</span>
          <br><span class="small muted">${i.shelf ? `지난번 유통기한 ${i.shelf}일` : '유통기한 없음'}</span></span></button>`;
      }
      const l = lines[k];
      return `<div class="pickon"><button type="button" class="pick on" data-edit="${k}"><span class="box">${ICON.check}</span><span class="grow"><b>${i.name}</b> <span class="num">${l.qty ? S.fmtQty(l.qty, i.unit) : '<span class="loss-t">양 없음</span>'}</span></span></button>
        ${l.editing ? lineEdit(l, k, { noHead: true }) :`<div class="pickmeta small">${expText(l.exp)}${owner ? ` · ${l.price === null ? '단가 비어 있음' : won(l.price)}` : ''}</div>`}</div>`;
    }).join('');
    return `<div class="picktools"><span class="inp"><span class="muted ic">${ICON.search}</span><input placeholder="재료 찾기" value="${state === 'search' ? '바질' : ''}"></span>
      <button type="button" class="ghost">지난 입고 재료 고르기</button></div>
      ${state === 'search' ? addBox() : ''}
      <div class="colhead small muted"><span>자주 들어오는 재료부터 · ${lines.length}개 고름</span></div>
      <div class="picks">${rows}</div>`;
  }

  // 아래 고정 바 (휴대폰) · 옆 요약 (데스크톱)
  function barInner(L) {
    const t = sum(L), err = errCount(L);
    const head = owner
      ? `<div class="loss-line"><span class="small muted">${t.n}줄${t.empty ? ` · 단가 빈 줄 ${t.empty}` : ''}</span><span class="amt-n num">${won(t.total)}${t.empty ? ' + ?' : ''}</span></div>`
      : `<div class="loss-line"><span class="small muted">${t.n}줄 · 단가는 사장님이 넣어요</span></div>`;
    return `${err ? `<div class="field-err" style="margin:0 0 6px">고칠 곳 ${err}개 — 고쳐야 저장돼요</div>` : ''}${head}
      <button class="primary" type="button" ${err || !t.n ? 'disabled' : ''} data-go="saved">입고 저장${t.n ? ` (${t.n}줄)` : ''}</button>`;
  }

  // 빈 입고
  function emptyNew() {
    return `<div class="empty" style="padding:28px 8px 8px"><div class="big" aria-hidden="true">📦</div>
      <h2 style="margin:6px 0 4px;font-size:18px;color:var(--text)">오늘 들어온 재료를 넣어요</h2>
      <p class="small" style="margin:0">명세서 한 장 = 입고 한 번. 재료마다 양 · 유통기한${owner ? ' · 금액' : ''}을 넣으면 재고에 더해져요.</p></div>`;
  }

  function wire(root) {
    const go = (s, extra) => { const p = new URLSearchParams(location.search); p.set('state', s); if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, v)); location.search = p.toString(); };
    root.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
    root.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => go(b.dataset.tab === 'history' ? 'history' : 'entry'));
    root.querySelectorAll('[data-receipt]').forEach((b) => b.onclick = () => (owner && b.dataset.receipt === 'r1107' ? go('fill') : ZW.toast(owner ? '예시는 11월 7일 입고(단가 확인 2줄)만 열려요' : '예시에서는 열리지 않아요 — 양 · 유통기한을 고치는 화면')));
    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => ZW.toast('누르면 이 줄이 펼쳐지고 고치던 줄은 접혀요'));
    root.querySelectorAll('.chip[aria-pressed]').forEach((b) => b.onclick = () => { b.parentElement.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); });
    root.querySelectorAll('.unitseg button').forEach((b) => b.onclick = () => { b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); });
  }

  window.RCV = { STATES, state, variant, role, owner, ICON, lines, entryLines, fillLines, FILL, sum, errCount, qtyBad,
    lineEdit, lineSum, addBox, historyList, receiptCard, fillView, savedView, pickList, barInner, emptyNew, expText, vsHtml, unitSeg, wire };
})();
