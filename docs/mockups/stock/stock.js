/* 재고 (F11 현재 재고 · 원장, F21 유통기한 임박) 시안 공용 — Stock.mobile.html · Stock.desktop.html.
 * shared.js · _shared/stock-data.js 뒤에 읽는다. 점주만 보는 화면(DESIGN 8.4). 값은 전부 지어낸 예시다.
 *
 * state (?state=)
 *   list     재고 목록 (기본) — 확인할 것(만료 · 임박 · 부족 · 단가) + 전체
 *   detail   재료 상세 — 우유: 로트 3개(차감 순서) · 원장
 *   expired  만료 로트가 있는 재료 — 방울토마토: 만료 로트는 차감하지 않고 "재료 폐기로 기록"
 *   short    기록보다 더 사용한 재료 — 버터: 0에서 멈추고 부족 줄, 입고 · 실사로 맞추기
 *   bulk     만료 · 임박 로트 한 번에 폐기 — 체크 목록(만료만 미리 체크), 원인 "유통기한 만료" · 로트 전부 (DESIGN 14.2 · 15.1)
 *   empty    재고 기록이 하나도 없음 — M2부터 쓰던 매장의 첫 재고는 실사로
 */
(function () {
  const STATES = [['list', '재고 목록'], ['detail', '재료 상세'], ['expired', '만료 로트'], ['short', '부족'], ['bulk', '한 번에 폐기'], ['empty', '처음']];
  const state = ZW.params.get('state') || 'list';
  const variant = (ZW.params.get('v') || 'A').toUpperCase();
  const { won } = ZW;
  const S = STK;
  const DETAIL = { detail: 'milk', expired: 'tomato', short: 'butter' };
  const detailIng = DETAIL[state] || null;

  const ICON = {
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  };

  const st = (id) => S.STOCK.find((x) => x.ing === id);
  const I = (id) => S.ingById[id];
  const daysText = (s) => (s.days === null ? '' : s.liveQty === 0 ? '바닥났어요' : s.days < 1 ? '하루 안에 바닥' : `약 ${Math.floor(s.days)}일치`);
  const expSpan = (exp) => { const e = S.expInfo(exp); return `<span class="exp-${e.kind}">${e.kind === 'none' ? e.text : `${S.fmtShort(exp)} · ${e.text}`}</span>`; };
  const valueText = (s) => (s.qty === 0 ? '—' : s.unknown && !s.value ? '단가 없음' : `${won(s.value)}${s.unknown ? ' + ?' : ''}`);

  // 맨 위 한 줄 — 오늘 마감 전이면 재고는 어제 마감까지만 차감돼 있다 (사전 검증: 아침에 재고를 보고 "왜 안 줄었지?"가 생긴다)
  const closedNote = () => `<div class="snote">${S.fmtDate(S.CLOSED_UNTIL)} 마감까지 사용량을 뺐어요 · 오늘 들어온 입고는 더했어요 · 오늘 마감하면 다시 계산돼요</div>`;

  // 확인할 것 ------------------------------------------------------------------
  function alerts() {
    const expired = S.STOCK.flatMap((s) => s.expired.map((l) => ({ s, l })));
    const soon = S.STOCK.flatMap((s) => s.soon.map((l) => ({ s, l }))).sort((a, b) => a.l.exp.localeCompare(b.l.exp));
    const short = S.STOCK.filter((s) => s.short);
    const noPrice = S.LOTS.filter((l) => l.left > 0 && l.price === null).length;
    return { expired, soon, short, noPrice, n: expired.length + soon.length + short.length + (noPrice ? 1 : 0) };
  }
  function alertCards() {
    const a = alerts();
    const card = (kind, title, body, act, ing) => `<div class="acard a-${kind}"${ing ? ` data-ing="${ing}"` : ''}><div class="grow"><b>${title}</b><div class="small">${body}</div></div>${act || ''}</div>`;
    return `<div class="alerts">
      ${a.expired.length + a.soon.length ? `<button type="button" class="bulkbtn" data-go="bulk">만료 · 임박 로트 한 번에 폐기 <span class="small">${a.expired.length + a.soon.length}개 →</span></button>` : ''}
      ${a.expired.map(({ s, l }) => card('over', `만료 · ${I(s.ing).name} ${S.fmtQty(l.left, I(s.ing).unit)}`, `${S.fmtDate(l.exp)}까지였어요 — 차감하지 않고 따로 두고 있어요`, `<button class="mini-btn loss" type="button" data-toast="재료 폐기 화면이 원인 '유통기한 만료' · 이 로트 · 300g으로 채워져 열려요">재료 폐기로</button>`, s.ing)).join('')}
      ${a.soon.map(({ s, l }) => card('soon', `${S.expInfo(l.exp).text} · ${I(s.ing).name} ${S.fmtQty(l.left, I(s.ing).unit)}`, `${S.fmtShort(l.date)} 입고분 — 다음 마감에서 먼저 사용해요`, '', s.ing)).join('')}
      ${a.short.map((s) => card('short', `부족 · ${I(s.ing).name} 기록보다 ${S.fmtQty(s.short, I(s.ing).unit)} 더 사용`, '입고를 빠뜨렸거나 레시피 양이 실제와 달라요', `<button class="mini-btn" type="button" data-go="short">맞추기</button>`, s.ing)).join('')}
      ${a.noPrice ? card('price', `단가 확인 · 로트 ${a.noPrice}개`, '직원이 넣은 입고예요 — 지금은 기본 단가로 계산 중', '<button class="mini-btn" type="button" data-toast="입고 → 입고 기록 탭으로 가요">입고 기록</button>') : ''}
    </div>`;
  }

  // 목록 (휴대폰 A · 데스크톱 A) -------------------------------------------------
  function row(s, sel) {
    const i = I(s.ing);
    const sub = s.short ? `<span class="loss-t">기록보다 ${S.fmtQty(s.short, i.unit)} 더 사용</span>`
      : s.expired.length ? `<span class="exp-over">만료 ${S.fmtQty(s.expired.reduce((x, l) => x + l.left, 0), i.unit)} 따로 둠</span>`
      : s.first ? expSpan(s.first.exp) : '<span class="exp-none">유통기한 없음</span>';
    return `<button type="button" class="srow${sel ? ' sel' : ''}" data-ing="${s.ing}">
      <span class="grow"><b>${i.name}</b><br><span class="small">${sub}</span></span>
      <span class="r"><b class="num">${s.qty ? S.fmtQty(s.liveQty, i.unit) : '0'}</b><br><span class="small muted">${daysText(s)}</span></span></button>`;
  }
  function list(sel) {
    const live = S.STOCK.filter((s) => s.qty || s.short);
    const total = S.STOCK.reduce((x, s) => x + s.value, 0);
    const unk = S.STOCK.filter((s) => s.unknown).length;
    return `${closedNote()}
      <div class="sum-line"><span class="small muted">재고 금액 <span class="muted">(만료 제외 · 남은 양 × 입고 단가, 없으면 기본 단가)</span></span><b class="num">${won(total)}${unk ? ' + ?' : ''}</b></div>
      <div class="colhead small muted"><span>확인할 것 ${alerts().n}</span></div>${alertCards()}
      <div class="colhead small muted"><span>전체 ${live.length} · 식자재 순</span><span>재고 · 며칠치</span></div>
      <div class="slist">${live.map((s) => row(s, s.ing === sel)).join('')}</div>
      <p class="small muted center">며칠치 = 만료 안 된 재고 ÷ 최근 7 영업일 하루 평균 사용량</p>`;
  }

  // 로트 타임라인 (휴대폰 B · 데스크톱 B) ------------------------------------------
  function timeline() {
    const lots = S.LOTS.filter((l) => l.left > 0);
    const G = [
      ['over', '지남 — 차감하지 않아요', (e) => e.kind === 'over'],
      ['soon', '오늘 · 내일', (e) => e.kind === 'soon'],
      ['week', '이번 주 (7일 안)', (e) => e.kind === 'ok' && e.d <= 7],
      ['later', '그 뒤', (e) => e.kind === 'ok' && e.d > 7],
      ['none', '유통기한 없음', (e) => e.kind === 'none'],
    ];
    const short = S.STOCK.filter((s) => s.short);
    return `${closedNote()}
      ${short.map((s) => `<div class="acard a-short" data-ing="${s.ing}"><div class="grow"><b>부족 · ${I(s.ing).name} 기록보다 ${S.fmtQty(s.short, I(s.ing).unit)} 더 사용</b><div class="small">재고 0 — 입고를 빠뜨렸거나 레시피 양이 실제와 달라요</div></div><button class="mini-btn" type="button" data-go="short">맞추기</button></div>`).join('')}
      ${G.map(([k, t, f]) => {
        const ls = lots.filter((l) => f(S.expInfo(l.exp))).sort((a, b) => (a.exp || '').localeCompare(b.exp || ''));
        if (!ls.length) return '';
        return `<div class="tgroup t-${k}"><div class="cat">${t}<span>${ls.length}</span></div>
          ${ls.map((l) => { const i = I(l.ing); return `<button type="button" class="lotrow" data-ing="${l.ing}"><span class="grow"><b>${i.name}</b> <span class="num">${S.fmtQty(l.left, i.unit)}</span><span class="small muted"> / ${S.fmtQty(l.qty0, i.unit)}</span>
            <br><span class="small muted">${S.fmtShort(l.date)} 입고${l.price === null ? ' · <span class="warn-t">단가 비어 있음</span>' : ''}</span></span>
            <span class="small">${l.exp ? expSpan(l.exp) : ''}</span></button>`; }).join('')}</div>`;
      }).join('')}`;
  }

  // 재료 상세 ------------------------------------------------------------------
  function bar(l) { return `<span class="lbar"><span style="width:${Math.round((l.left / l.qty0) * 100)}%"></span></span>`; }
  function detail(id) {
    const s = st(id), i = I(id);
    const live = s.lots.filter((l) => S.expInfo(l.exp).kind !== 'over');
    const lotRow = (l, k) => {
      const per = l.price !== null ? S.fmtPer(l.price / l.qty0, i.unit) : null;
      return `<div class="lot${k === 0 ? ' next' : ''}"><span class="ord" title="${k === 0 ? '다음 마감에서 먼저 사용' : ''}">${k + 1}</span><div class="grow">
        <div class="row-between"><b class="num">${S.fmtQty(l.left, i.unit)} <span class="small muted">/ ${S.fmtQty(l.qty0, i.unit)}</span></b><span class="small">${expSpan(l.exp)}</span></div>${bar(l)}
        <div class="small muted">${S.fmtDate(l.date)} 입고 · ${per ? per : `<span class="warn-t">단가 비어 있음 — 기본 단가(${S.fmtPer(S.basePer(i), i.unit) || '없음'})로 계산</span>`}</div></div></div>`;
    };
    const exp = s.expired.map((l) => `<div class="lot over"><span class="ord">!</span><div class="grow">
        <div class="row-between"><b class="num">${S.fmtQty(l.left, i.unit)} <span class="small muted">/ ${S.fmtQty(l.qty0, i.unit)}</span></b><span class="small">${expSpan(l.exp)}</span></div>
        <div class="small">유통기한이 지나 <b>차감하지 않고 따로 두고 있어요.</b> 실제로 폐기했으면 기록해야 손실에 들어가요.</div>
        <button class="primary inline danger" type="button" data-toast="재료 폐기: 원인 '유통기한 만료' · ${S.fmtShort(l.date)} 입고 로트 · ${S.fmtQty(l.left, i.unit)}이 채워져 열려요">재료 폐기로 기록 (${S.fmtQty(l.left, i.unit)})</button>
        <button class="link" type="button" data-toast="아직 사용할 수 있으면 유통기한을 고쳐요(입고 고침 — 원장에 남아요)">아직 사용할 수 있어요</button></div></div>`).join('');
    const short = s.short ? `<div class="banner err" style="margin:0"><b>기록보다 ${S.fmtQty(s.short, i.unit)} 더 사용했어요</b>${S.fmtDate('2026-11-07')} 마감에서 1,350g이 필요했는데 1,000g만 남아 있었어요. 재고는 0에서 멈추고 모자란 양은 "부족"으로 남겨요.
        <div class="small" style="margin-top:6px;color:var(--text)">왜 그럴까요? ① 입고를 빠뜨림 ② 레시피의 버터 양이 실제보다 적음 ③ 입고 양을 잘못 침</div>
        <div class="btns"><button class="mini-btn" type="button" data-toast="입고 화면 — 날짜를 11월 6~7일로 바꿔 빠뜨린 입고를 넣으면 부족이 그만큼 줄어요">빠뜨린 입고 넣기</button><button class="mini-btn" type="button" data-toast="실사 — 지금 선반에 있는 버터 양을 세서 넣어요">실사로 맞추기</button><button class="mini-btn" type="button" data-toast="메뉴 · 레시피 — 버터를 사용하는 메뉴 2개">레시피 보기</button></div></div>` : '';
    const ledger = (S.LEDGER[id] || []).map(([d, t, k, q, bal, memo]) => `<div class="lg k-${k}">
        <span class="lgd small muted">${S.fmtShort(d)}${t ? ` ${t}` : ''}</span>
        <span class="grow"><b>${S.KIND[k]}</b> <span class="small muted">${memo}</span></span>
        <span class="num q">${k === 'short' ? `<span class="loss-t">${S.fmtQty(q, i.unit)} 모자람</span>` : `${q > 0 ? '+' : '−'}${S.fmtQty(Math.abs(q), i.unit)}`}</span>
        <span class="num bal small muted">${S.fmtQty(bal, i.unit) || '0'}</span></div>`).join('');
    return `<div class="det">
      <div class="dtop"><div><div class="small muted">지금 재고 ${s.expired.length ? '(만료 제외)' : ''}</div><div class="bigq num">${s.liveQty ? S.fmtQty(s.liveQty, i.unit) : '0' + i.unit}</div>
        <div class="small muted">${S.AVG[id] ? `하루 평균 ${S.fmtQty(S.AVG[id], i.unit)} 사용 · ${daysText(s)}` : ''}</div></div>
        <div class="r"><div class="small muted">재고 금액</div><b class="num">${s.liveQty ? valueText(s) : '—'}</b>${s.noPrice ? `<div class="small warn-t">단가 빈 로트 ${s.noPrice}개</div>` : ''}${s.expValue ? `<div class="small loss-t">만료 ${won(s.expValue)} 따로</div>` : ''}</div></div>
      ${short}
      ${exp ? `<div class="sec">만료 — 따로 둠</div>${exp}` : ''}
      ${live.length ? `<div class="sec">로트 <span class="muted small">— 위에서부터 차감해요(유통기한 빠른 순)</span></div>${live.map(lotRow).join('')}` : s.short ? '' : '<div class="small muted">남은 로트가 없어요</div>'}
      <div class="sec">원장 <span class="muted small">— 최근 기록, 고치지 않고 더하기만 해요</span></div>
      <div class="ledger"><div class="lg head small muted"><span class="lgd">날짜</span><span class="grow">무엇</span><span class="q">양</span><span class="bal">남은 양</span></div>${ledger || '<div class="small muted" style="padding:8px">기록 없음</div>'}</div>
      <div class="dacts"><button class="ghost" type="button" data-toast="입고 화면으로">입고</button><button class="ghost" type="button" data-toast="실사 화면 — 이 재료만 세기">이 재료만 실사</button><button class="ghost" type="button" data-toast="재료 폐기 화면으로">재료 폐기</button></div>
    </div>`;
  }

  // 만료 · 임박 로트 한 번에 폐기 — 냉장고 정리. 만료만 미리 체크, 임박은 사장님이 보고 고른다
  function bulk() {
    const lots = S.LOTS.filter((l) => l.left > 0 && /over|soon/.test(S.expInfo(l.exp).kind)).sort((x, y) => x.exp.localeCompare(y.exp));
    const on = (l) => S.expInfo(l.exp).kind === 'over' || l.ing === 'lettuce';
    const lv = (l) => Math.round(S.lotValue(l) || 0);
    const total = lots.filter(on).reduce((s, l) => s + lv(l), 0);
    return `<div class="bulk">
      <p class="small muted" style="margin:0">원인은 <b>유통기한 만료</b>, 양은 로트 전부로 기록해요. 일부만 폐기했으면 양을 고쳐요. 만료 로트는 미리 골라 뒀어요.</p>
      ${lots.map((l) => { const i = I(l.ing), e = S.expInfo(l.exp), q = S.inputQty(l.left, i.unit);
        return `<div class="bline${on(l) ? ' on' : ''}"><span class="box">${on(l) ? '✓' : ''}</span>
          <span class="grow"><b>${i.name}</b> <span class="small exp-${e.kind}">${S.fmtShort(l.exp)} · ${e.text}</span><br><span class="small muted">${S.fmtShort(l.date)} 입고 로트</span></span>
          <span class="bq"><input class="num" value="${q.v}"><span class="small muted">${q.u}</span></span>
          <b class="num loss-t bw">${on(l) ? won(lv(l)) : ''}</b></div>`; }).join('')}
      <div class="lossbox"><span>폐기 손실 <span class="small">${lots.filter(on).length}개 로트 · 오늘 손실의 "재료"로</span></span><b class="num">${won(total)}</b></div>
      <button class="primary" type="button" data-toast="재료 폐기 ${lots.filter(on).length}건을 기록했어요 — 재고에서 빠지고 오늘 손실에 더해져요">${lots.filter(on).length}개 로트 폐기 기록</button>
      <p class="small muted" style="margin:0">하나만 자세히 넣으려면 그 카드의 "재료 폐기로"(원인 · 메모를 바꿀 수 있어요)</p></div>`;
  }

  function empty() {
    return `<div class="empty" style="padding:40px 8px 12px"><div class="big" aria-hidden="true">📦</div>
      <h2 style="margin:6px 0 4px;font-size:18px;color:var(--text)">아직 재고 기록이 없어요</h2>
      <p class="small" style="margin:0">지금 선반 · 냉장고에 있는 재료부터 한 번에 넣어요. 그다음부터는 입고하면 더해지고 마감하면 레시피만큼 빠져요.</p>
      <div class="actions" style="max-width:320px;margin:16px auto 0"><button class="primary" type="button" data-toast="실사 화면 — 식자재 전체 목록에 지금 양을 넣어요. 처음 넣은 양은 기본 단가로 로트가 돼요">처음 재고 넣기 (실사)</button>
      <button class="ghost wide" type="button" data-toast="입고 화면으로">오늘 들어온 재료 입고</button></div></div>
      <div class="uses small"><b>왜 입고가 아니라 실사로?</b> 입고는 "오늘 들어온 것"이라 이미 있던 재료를 넣으면 입고 기록 · 단가 비교가 섞여요. 처음 재고는 실사로 넣고 기본 단가로 계산해요.</div>
      <div class="uses small" style="margin-top:8px">재고를 안 넣어도 마감은 돼요. 재고가 0인 재료는 마감 때 차감하지 않고 "부족"에도 올리지 않아요(재고를 한 번도 넣지 않은 재료).</div>`;
  }

  function wire(root) {
    const go = (s) => { const p = new URLSearchParams(location.search); p.set('state', s); location.search = p.toString(); };
    root.querySelectorAll('[data-go]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); go(b.dataset.go); });
    root.querySelectorAll('[data-toast]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); ZW.toast(b.dataset.toast); });
    root.querySelectorAll('[data-ing]').forEach((b) => b.onclick = () => {
      const k = Object.entries(DETAIL).find(([, v]) => v === b.dataset.ing);
      if (k) go(k[0]); else ZW.toast('예시에서는 우유 · 방울토마토 · 버터만 열려요');
    });
    root.querySelectorAll('.bline .box').forEach((b) => b.onclick = () => { const r = b.parentElement; r.classList.toggle('on'); b.textContent = r.classList.contains('on') ? '✓' : ''; });
    root.querySelectorAll('[data-filter]').forEach((b) => b.onclick = () => { b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); });
  }

  window.SKV = { STATES, state, variant, detailIng, ICON, alerts, alertCards, list, timeline, detail, bulk, empty, closedNote, st, I, daysText, expSpan, valueText, wire };
})();
