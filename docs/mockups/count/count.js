/* 실사 (F12) 시안 공용 — Count.mobile.html · Count.desktop.html.
 * shared.js · _shared/stock-data.js 뒤에 읽는다. 점주만(DESIGN 8.4). 값은 전부 지어낸 예시다.
 *
 * state (?state=)
 *   count   세는 중 — 기준 "어제 마감 뒤(오늘 영업 시작 전)", 15개 중 7개 셈 (기본)
 *   diff    많이 다른 줄 — 밀가루를 139kg로 침(0 하나 더) → "다시 세어 볼까요?"
 *   before  영업 중에 열었음 — 오늘 마감 전이라 기준을 고르게 함
 *   first   처음 재고 넣기 — 로트가 하나도 없는 매장, 센 양이 기본 단가로 첫 로트가 됨
 *   saved   저장한 뒤 — 조정 줄 · 부족 정리 · 차이 금액
 */
(function () {
  const STATES = [['count', '세는 중'], ['diff', '많이 다름'], ['before', '영업 중에 엶'], ['first', '처음 재고'], ['saved', '저장 뒤']];
  const state = ZW.params.get('state') || 'count';
  const variant = (ZW.params.get('v') || 'A').toUpperCase();
  const { won } = ZW;
  const S = STK;

  // 보관 위치 (B 시안) — 식자재에 "보관 위치" 칸을 더하는 안. 세는 사람이 걷는 순서
  const LOC = { milk: '냉장고', butter: '냉장고', egg: '냉장고', ham: '냉장고', slice: '냉장고', ricotta: '냉장고', lettuce: '냉장고', tomato: '냉장고', beef: '냉동고', flour: '상온 선반', sugar: '상온 선반', salt: '상온 선반', rice: '상온 선반', bean: '상온 선반', bread: '상온 선반' };
  const LOCS = ['냉장고', '냉동고', '상온 선반'];

  // 센 양 (기본 단위). undefined = 아직 안 셈
  const COUNTED = { milk: 19600, butter: 650, egg: 35, flour: 13900, lettuce: 5100, bean: 1300, tomato: 700 };
  if (state === 'diff') COUNTED.flour = 139000;
  if (state === 'before') Object.keys(COUNTED).forEach((k) => { if (k !== 'milk' && k !== 'egg') delete COUNTED[k]; });
  const FIRST = { flour: 18000, butter: 1500, milk: 8000, egg: 45, sugar: 2500 }; // 처음 재고 — 일부만 셈

  const book = (id) => (state === 'first' ? 0 : S.stockOf(id).liveQty);
  const counted = (id) => (state === 'first' ? FIRST[id] : COUNTED[id]);
  const perOf = (id) => {
    // 차이 금액: 모자람은 차감 순서(유통기한 빠른 로트)의 단가, 남음은 가장 최근 로트 단가 — 여기서는 단순히 첫 로트 단가(없으면 기본)
    const l = S.lotsOf(id).find((x) => S.expInfo(x.exp).kind !== 'over');
    return l && l.price !== null ? l.price / l.qty0 : S.basePer(S.ingById[id]);
  };
  function rowInfo(id) {
    const b = book(id), c = counted(id), i = S.ingById[id];
    if (c === undefined) return { id, i, b, c, done: false };
    const d = c - b;
    const big = b > 0 && Math.abs(d) / b > 0.5 && Math.abs(d) > 0; // 장부와 절반 넘게 다르면 다시 세기 권함
    const v = perOf(id) === null ? null : Math.round(d * perOf(id));
    return { id, i, b, c, d, done: true, big, v };
  }
  const ROWS = S.ING.map((i) => rowInfo(i.id));
  const done = ROWS.filter((r) => r.done);
  const diffWon = done.reduce((s, r) => s + (r.v || 0), 0);

  const fmtD = (r) => (r.d === 0 ? '같아요' : `${r.d > 0 ? '+' : '−'}${S.fmtQty(Math.abs(r.d), r.i.unit)}`);
  const unitOf = (i, q) => S.inputQty(q, i.unit);

  // 기준 — 실사는 "그날 마감 뒤"의 재고다 (사전 검증: 영업 중에 세면 그날 마감이 아침 사용분을 또 뺀다)
  function basisBar() {
    if (state === 'first') return '';
    const before = state === 'before';
    return `<div class="basis${before ? ' warn' : ''}">
      <div class="small"><b>언제 기준으로 셀까요?</b></div>
      <div class="seg sm"><button type="button" aria-pressed="${!before}">어제 마감 뒤 · 영업 전</button><button type="button" aria-pressed="false">오늘 마감 뒤</button></div>
      <div class="small">${before
        ? '지금은 <b>영업 중</b>이에요(오늘 마감 전). 지금 세면 오늘 아침에 사용한 양이 빠진 채로 세지는데, 오늘 마감이 그 양을 또 빼서 재고가 실제보다 적어져요. <b>영업 전에 셌으면 "어제 마감 뒤"</b>, 아니면 오늘 마감을 입력한 뒤에 세어 주세요.'
        : `${S.fmtDate(S.CLOSED_UNTIL)} 마감까지 뺀 재고와 비교해요 — 오늘 영업 전에 센 양이어야 맞아요`}</div></div>`;
  }

  // 한 줄 (휴대폰)
  function row(r, opts = {}) {
    const st = S.stockOf(r.id);
    const q = r.done ? unitOf(r.i, r.c) : unitOf(r.i, null);
    const exp = state !== 'first' && st.expired.length ? `<div class="expq small"><span class="exp-over">만료 로트 ${S.fmtQty(st.expired.reduce((s, l) => s + l.left, 0), r.i.unit)} 따로</span> — 아직 있으면 세지 말고 <button class="link" type="button" data-toast="재료 폐기(원인 · 로트 · 양 채움)로 가요">폐기로 기록</button></div>` : '';
    const short = st.short && state !== 'first' ? `<div class="small loss-t">부족 ${S.fmtQty(st.short, r.i.unit)} — 세면 정리돼요</div>` : '';
    return `<div class="crow${r.done ? ' done' : ''}${r.big ? ' big' : ''}">
      <div class="ctop"><span class="grow"><b>${r.i.name}</b>${opts.loc ? '' : ''}
        <br><span class="small muted">${state === 'first' ? '처음 넣는 재고' : `장부 ${S.fmtQty(r.b, r.i.unit) || '0' + r.i.unit}`}</span></span>
        <span class="cin"><span class="inp q${r.big ? ' bad' : ''}"><input class="num" inputmode="decimal" value="${q.v}" placeholder="센 양"></span><span class="u">${q.u}</span></span></div>
      ${r.done && state !== 'first' ? `<div class="cdiff"><span class="dq d-${r.d === 0 ? 'same' : r.d < 0 ? 'minus' : 'plus'}">${fmtD(r)}</span>${r.v ? `<span class="small muted num">${r.v > 0 ? '+' : '−'}${won(Math.abs(r.v))}</span>` : ''}</div>` : ''}
      ${!r.done && state !== 'first' ? `<button type="button" class="same" data-toast="장부와 같은 양(${S.fmtQty(r.b, r.i.unit)})으로 채웠어요">장부와 같아요</button>` : ''}
      ${r.big ? `<div class="field-err">장부(${S.fmtQty(r.b, r.i.unit)})와 많이 달라요 — 0을 하나 더 쳤나요? 맞으면 그대로 저장돼요</div>` : ''}
      ${short}${exp}
      ${state === 'first' && r.done ? `<div class="small muted">기본 단가 ${S.fmtPer(S.basePer(r.i), r.i.unit) || '없음'}로 첫 로트가 돼요 · 유통기한 <button class="link" type="button" data-toast="날짜를 고르거나 비워 둬요 — 비우면 '유통기한 없음'">넣기</button></div>` : ''}
    </div>`;
  }

  // 목록: A = 확인할 것(부족 · 만료 · 며칠치 적은 것) 먼저, 그 뒤 식자재 순 / B = 보관 위치별
  function rowsA() {
    const pri = (r) => { const st = S.stockOf(r.id); return st.short ? 0 : st.expired.length ? 1 : 2; };
    const list = state === 'first' ? ROWS : [...ROWS].sort((a, b) => pri(a) - pri(b));
    const head = list.filter((r) => pri(r) < 2), rest = list.filter((r) => pri(r) === 2);
    return `${head.length && state !== 'first' ? `<div class="cat">먼저 셀 것 <span>부족 · 만료가 있는 재료</span></div>${head.map((r) => row(r)).join('')}` : ''}
      <div class="cat">${state === 'first' ? '식자재 전체' : '나머지'} <span>${(state === 'first' ? list : rest).length}</span></div>${(state === 'first' ? list : rest).map((r) => row(r)).join('')}`;
  }
  function rowsB() {
    return LOCS.map((loc) => {
      const rs = ROWS.filter((r) => LOC[r.id] === loc);
      const n = rs.filter((r) => r.done).length;
      return `<div class="cat">${loc} <span>${n}/${rs.length}${n === rs.length ? ' ✓' : ''}</span></div>${rs.map((r) => row(r)).join('')}`;
    }).join('') + '<p class="small muted">보관 위치는 식자재 설정에서 정해요(새 칸) — 냉장고 앞에서 위에서부터 세면 돼요</p>';
  }

  function barInner() {
    const big = done.filter((r) => r.big).length;
    const adj = done.filter((r) => r.d !== 0).length;
    if (state === 'first') {
      const v = done.reduce((s, r) => s + (S.basePer(r.i) || 0) * r.c, 0);
      return `<div class="loss-line"><span class="small muted">${ROWS.length}개 중 ${done.length}개 셈 · 안 센 재료는 재고 없이 시작</span><span class="num"><b>${won(v)}</b></span></div>
        <button class="primary" type="button" data-go="saved">처음 재고 저장 (${done.length}개)</button>`;
    }
    return `${big ? `<div class="field-err" style="margin:0 0 6px">많이 다른 줄 ${big}개 — 확인해 주세요(저장은 돼요)</div>` : ''}
      <div class="loss-line"><span class="small muted">${ROWS.length}개 중 ${done.length}개 셈 · 조정 ${adj}개</span><span class="num d-${diffWon < 0 ? 'minus' : 'plus'}"><b>${diffWon < 0 ? '−' : '+'}${won(Math.abs(diffWon))}</b></span></div>
      <button class="primary" type="button" ${state === 'before' ? 'disabled' : ''} data-go="saved">${state === 'before' ? '언제 기준인지 고르면 저장돼요' : `실사 저장 — 센 ${done.length}개만 맞춰요`}</button>`;
  }

  function saved() {
    const adj = done.filter((r) => r.d !== 0);
    return `<div class="cdone"><div class="okmark">✓</div><h2>재고를 센 양으로 맞췄어요</h2>
      <p class="small muted" style="margin:0">${S.fmtDate(S.CLOSED_UNTIL)} 마감 뒤 기준 · ${S.PEOPLE.owner} · 센 ${done.length}개 중 ${adj.length}개 조정 · 안 센 ${ROWS.length - done.length}개는 그대로</p>
      <div class="adjlist">${adj.map((r) => `<div class="row-between"><span><b>${r.i.name}</b> <span class="small muted">${S.fmtQty(r.b, r.i.unit) || '0'} → ${S.fmtQty(r.c, r.i.unit)}</span></span><span class="num dq d-${r.d < 0 ? 'minus' : 'plus'}">${fmtD(r)}</span></div>`).join('')}</div>
      <div class="banner info" style="margin:0"><b>버터 부족 350g이 정리됐어요</b>장부 0 → 센 650g. 남는 양은 가장 최근 로트(11/6 입고)에 더했어요.</div>
      <div class="lossbox"><span>실사 차이 <span class="small">모자람 − 남음 · 로트 단가</span></span><b class="num">${diffWon < 0 ? '−' : '+'}${won(Math.abs(diffWon))}</b></div>
      <p class="small muted" style="margin:0">실사 차이는 오늘 손실에 넣지 않아요 — 언제 생긴 차이인지 모르니까요. 재고 화면 원장에 "실사 조정"으로 남고, 차이 추이는 나중에 리포트(F12a)에서.</p>
      <div class="actions"><button class="primary" type="button">재고 보기</button></div></div>`;
  }

  function wire(root) {
    const go = (s) => { const p = new URLSearchParams(location.search); p.set('state', s); location.search = p.toString(); };
    root.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
    root.querySelectorAll('[data-toast]').forEach((b) => b.onclick = () => ZW.toast(b.dataset.toast));
    root.querySelectorAll('.seg button').forEach((b) => b.onclick = () => { b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); });
  }

  window.CNT = { STATES, state, variant, ROWS, done, diffWon, LOC, LOCS, basisBar, row, rowsA, rowsB, barInner, saved, fmtD, wire };
})();
