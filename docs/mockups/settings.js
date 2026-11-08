/* 메뉴 · 식자재 · 레시피 시안 공용 (Settings.mobile.html · Settings.desktop.html).
 * shared.js 뒤에 읽는다. 값은 전부 지어낸 예시다.
 *
 * state (?state=)
 *   menus        메뉴 목록 (기본)
 *   menu         메뉴 상세 — 레시피 · 원가 · 원가율 (크루아상)
 *   price        메뉴 상세 — 단가 없는 재료가 섞임 (리코타 샐러드)
 *   newmenu      새 메뉴 — 레시피에서 없는 재료를 바로 만들기 (말차라떼)
 *   ingredients  식자재 목록
 *   ingredient   식자재 상세 — 레시피에 쓰여 단위 잠김 (버터)
 *   empty        메뉴 0개 (시작 체크리스트에서 들어옴)
 */
(function () {
  const STATES = [
    ['menus', '메뉴 목록'], ['menu', '메뉴 상세'], ['price', '단가 없음'], ['newmenu', '새 메뉴'],
    ['ingredients', '식자재 목록'], ['ingredient', '식자재 상세'], ['empty', '처음'],
  ];
  const state = ZW.params.get('state') || 'menus';
  const variant = (ZW.params.get('v') || 'A').toUpperCase();
  const { won } = ZW;

  // 탄소 분류 — decisions/0011 (Poore & Nemecek, OWID 약 40종) 중 일부. kg당 kgCO₂e, 전 세계 평균 "추정"
  const CARBON = {
    wheat: ['밀 · 호밀', 1.6], milk: ['우유', 3.2], cheese: ['치즈', 23.9], egg: ['달걀', 4.7], sugar: ['사탕수수 설탕', 3.2],
    coffee: ['커피', 28.5], pig: ['돼지고기', 12.3], beef: ['소고기', 99.5], rice: ['쌀', 4.5], veg: ['기타 채소', 0.5],
    tomato: ['토마토', 2.1], none: ['계산 제외 (소금 · 물 등)', 0],
  };
  // unit: 기본 단위. pack: [가격, 양] = "양 기본단위에 가격원" (기본 단가 입력 방식). each: 단위가 개일 때 1개 무게(g)
  const ING = [
    { id: 'flour', name: '밀가루(강력분)', unit: 'g', pack: [20000, 20000], c: 'wheat' },
    { id: 'butter', name: '버터', unit: 'g', pack: [15000, 1000], c: null },
    { id: 'milk', name: '우유', unit: 'ml', pack: [2800, 1000], c: 'milk' },
    { id: 'sugar', name: '설탕', unit: 'g', pack: [1500, 1000], c: 'sugar' },
    { id: 'egg', name: '달걀', unit: '개', pack: [7800, 30], c: 'egg', each: 60 },
    { id: 'salt', name: '소금', unit: 'g', pack: [2000, 1000], c: 'none' },
    { id: 'bean', name: '원두', unit: 'g', pack: [28000, 1000], c: 'coffee' },
    { id: 'ham', name: '햄', unit: 'g', pack: [12000, 1000], c: 'pig' },
    { id: 'slice', name: '슬라이스 치즈', unit: '개', pack: [9000, 50], c: 'cheese', each: 20 },
    { id: 'bread', name: '식빵', unit: '개', pack: [3500, 12], c: 'wheat', each: 30 },
    { id: 'ricotta', name: '리코타 치즈', unit: 'g', pack: null, c: 'cheese' },
    { id: 'lettuce', name: '양상추', unit: 'g', pack: [4000, 1000], c: 'veg' },
    { id: 'tomato', name: '방울토마토', unit: 'g', pack: [6000, 1000], c: 'tomato' },
    { id: 'beef', name: '소고기 불고기용', unit: 'g', pack: [25000, 1000], c: 'beef' },
    { id: 'rice', name: '쌀', unit: 'g', pack: [50000, 20000], c: 'rice' },
    { id: 'syrup', name: '복숭아 시럽', unit: 'ml', pack: [9000, 1000], c: 'sugar', stopped: true },
  ];
  const ingById = Object.fromEntries(ING.map((i) => [i.id, i]));
  const RECIPES = {
    croissant: [['flour', 60], ['butter', 35], ['milk', 20], ['sugar', 8], ['egg', 0.2], ['salt', 1.2]],
    saltbread: [['flour', 70], ['butter', 15], ['milk', 25], ['sugar', 5], ['salt', 2]],
    baguette: [['flour', 110], ['salt', 2]],
    americano: [['bean', 18]],
    latte: [['bean', 18], ['milk', 200]],
    vanilla: [['bean', 18], ['milk', 200], ['sugar', 15]],
    hamcheese: [['bread', 2], ['ham', 40], ['slice', 1], ['lettuce', 15]],
    eggmayo: [['bread', 2], ['egg', 1.5], ['lettuce', 10]],
    ricotta: [['ricotta', 60], ['lettuce', 80], ['tomato', 50]],
    bulgogi: [['beef', 120], ['rice', 200], ['lettuce', 20]],
  };
  const MENUS = ZW.MENUS.map((m) => ({ ...m, recipe: RECIPES[m.id] || [] }));
  MENUS.push({ id: 'oldscone', cat: '베이커리', name: '초코 스콘', fresh: true, price: 3800, recipe: [['flour', 60], ['butter', 20]], stopped: true });

  // 1기본단위당 단가 — 원 미만이 나온다(밀가루 1g = 1원, 버터 1g = 15원, 달걀 1개 = 260원). 돈 합계만 원으로 반올림
  const unitPrice = (i) => (i.pack ? i.pack[0] / i.pack[1] : null);
  const fmtQty = (q) => (Number.isInteger(q) ? q.toLocaleString('ko-KR') : String(q));
  const fmtUnitPrice = (i) => { const p = unitPrice(i); if (p === null) return null; return `1${i.unit}당 ${p < 10 ? p.toFixed(1).replace(/\.0$/, '') : Math.round(p).toLocaleString('ko-KR')}원`; };
  function costOf(m) {
    let sum = 0, missing = 0;
    m.recipe.forEach(([id, q]) => { const p = unitPrice(ingById[id]); if (p === null) missing++; else sum += p * q; });
    return { cost: Math.round(sum), missing, rate: m.price ? Math.round(sum) / m.price : 0 };
  }
  const usedBy = (ingId) => MENUS.filter((m) => !m.stopped && m.recipe.some(([id]) => id === ingId));

  const ICON = {
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  };

  // 목록 ---------------------------------------------------------------------
  const rateTag = (c) => c.missing ? `<span class="tag warn">단가 없는 재료 ${c.missing}</span>` : '';
  function menuRow(m, sel) {
    const c = costOf(m);
    const right = m.recipe.length
      ? `<span class="num"><b>${won(c.cost)}</b><span class="muted small"> · ${Math.round(c.rate * 100)}%</span></span>`
      : '<span class="tag">레시피 없음</span>';
    return `<button type="button" class="row${sel ? ' sel' : ''}${m.stopped ? ' off' : ''}" data-menu="${m.id}">
      <span class="grow"><b>${m.name}</b>${m.fresh ? '<span class="tag fresh">당일</span>' : ''}${m.stopped ? '<span class="tag">판매 중지</span>' : ''}
      <br><span class="small muted num">판매가 ${won(m.price)}</span> ${rateTag(c)}</span>${right}</button>`;
  }
  function menuList(sel) {
    const live = MENUS.filter((m) => !m.stopped), off = MENUS.filter((m) => m.stopped);
    const noRecipe = live.filter((m) => !m.recipe.length).length;
    return `${noRecipe ? `<div class="banner warn" style="margin:12px 0 0"><b>레시피 없는 메뉴 ${noRecipe}개</b>남아도 손실 금액이 0원으로 보이지 않고 "레시피 없음"으로 분류돼요.</div>` : ''}
      <div class="colhead small muted"><span>메뉴 · 판매가</span><span>1개 원가 · 원가율</span></div>
      ${ZW.CATS.map((cat) => { const ms = live.filter((m) => m.cat === cat); return ms.length ? `<div class="cat">${cat}<span>${ms.length}</span></div>${ms.map((m) => menuRow(m, m.id === sel)).join('')}` : ''; }).join('')}
      <details class="offlist"><summary class="small muted">판매 중지 ${off.length}개</summary>${off.map((m) => menuRow(m)).join('')}</details>`;
  }
  function ingRow(i, sel) {
    const p = fmtUnitPrice(i), n = usedBy(i.id).length;
    return `<button type="button" class="row${sel ? ' sel' : ''}${i.stopped ? ' off' : ''}" data-ing="${i.id}">
      <span class="grow"><b>${i.name}</b> <span class="muted small">${i.unit}</span>${i.stopped ? '<span class="tag">사용 중지</span>' : ''}
      <br><span class="small muted">${i.c ? CARBON[i.c][0] : '<span class="warn-t">탄소 분류 없음</span>'} · ${n ? `메뉴 ${n}개에 사용함` : "사용하는 메뉴 없음"}</span></span>
      <span class="num small">${p ? i.pack ? `${won(i.pack[0])} / ${fmtQty(i.pack[1])}${i.unit}` : '' : '<span class="tag warn">단가 없음</span>'}</span></button>`;
  }
  function ingList(sel) {
    const live = ING.filter((i) => !i.stopped), off = ING.filter((i) => i.stopped);
    const noPrice = live.filter((i) => !i.pack).length, noC = live.filter((i) => !i.c).length;
    return `${noPrice || noC ? `<div class="banner warn" style="margin:12px 0 0"><b>채울 것 ${noPrice + noC}개</b>${noPrice ? `단가 없는 재료 ${noPrice}개(손실 금액에서 제외됨)` : ''}${noPrice && noC ? ' · ' : ''}${noC ? `탄소 분류 없는 재료 ${noC}개(탄소에서 제외됨)` : ''}</div>` : ''}
      <div class="colhead small muted"><span>식자재 · 기본 단위</span><span>기본 단가</span></div>
      ${live.map((i) => ingRow(i, i.id === sel)).join('')}
      <details class="offlist"><summary class="small muted">사용 중지 ${off.length}개</summary>${off.map((i) => ingRow(i)).join('')}</details>`;
  }

  // 메뉴 상세 ------------------------------------------------------------------
  function recipeLine(id, q) {
    const i = ingById[id], p = unitPrice(i);
    return `<div class="rline"><span class="grow">${i.name}</span>
      <span class="qty"><input class="num" value="${fmtQty(q)}" inputmode="decimal" aria-label="${i.name} 양"><span class="u">${i.unit}</span></span>
      <span class="num rc">${p === null ? '<span class="tag warn">단가 없음</span>' : won(p * q)}</span>
      <button type="button" class="iconbtn sm" aria-label="${i.name} 빼기">${ICON.x}</button></div>`;
  }
  function menuDetail(m, opts = {}) {
    const c = costOf(m);
    const isNew = opts.isNew;
    return `<div class="form">
      <label class="fld"><span class="lab">메뉴 이름</span><span class="inp"><input value="${m.name}"></span></label>
      <div class="fld"><span class="lab">분류</span><div class="chips">${ZW.CATS.map((k) => `<button type="button" class="chip" aria-pressed="${k === m.cat}">${k}</button>`).join('')}</div></div>
      <div class="fld"><span class="lab">만드는 방식</span><div class="seg">
        <button type="button" aria-pressed="${m.fresh}">미리 만들어 둠</button><button type="button" aria-pressed="${!m.fresh}">주문 때 만듦</button></div>
        <span class="small muted">${m.fresh ? '당일 생산품 — 마감 때 <b>만든 · 남은 수량 · 품절</b>을 받아요' : '음료처럼 — 마감 때 <b>판매량</b>만 받아요'}</span></div>
      <label class="fld"><span class="lab">판매가</span><span class="inp"><input class="num" value="${m.price.toLocaleString('ko-KR')}" inputmode="numeric"><span class="muted">원</span></span>
        <span class="small muted">바꾸면 오늘 마감부터 적용돼요. 지난 기록은 그날 값 그대로예요</span></label>
      <div class="fld"><span class="lab row-between"><span>레시피 <span class="muted small">1개에 들어가는 양</span></span>${m.recipe.length ? `<span class="small muted">${m.recipe.length}가지</span>` : ''}</span>
        <div class="recipe">${m.recipe.map(([id, q]) => recipeLine(id, q)).join('')}
          ${opts.adding ? addingBox() : `<button type="button" class="addline">+ 재료 더하기</button>`}</div></div>
      ${m.recipe.length ? `<div class="costbox">
        <div class="row-between"><span>1개 원가</span><b class="num">${won(c.cost)}${c.missing ? ' + ?' : ''}</b></div>
        <div class="row-between"><span>원가율 <span class="muted small">원가 ÷ 판매가</span></span><b class="num">${c.missing ? '—' : Math.round(c.rate * 100) + '%'}</b></div>
        ${c.missing ? `<div class="small warn-t" style="margin-top:6px">단가 없는 재료 ${c.missing}개가 제외된 값이에요. 남으면 손실 금액도 이만큼 작게 보여요 — <button type="button" class="link" data-go="ingredient">단가 넣기</button></div>` : ''}
      </div>` : `<div class="costbox small muted">레시피를 넣으면 1개 원가와 원가율이 나와요. 레시피 없이도 마감은 입력할 수 있어요.</div>`}
      <div class="actions">${isNew ? '<button class="primary" type="button">메뉴 추가</button>' : `<button class="primary" type="button">저장</button>
        <button class="ghost wide" type="button" data-stop>판매 중지</button>
        <p class="small muted center" style="margin:0">지우지 않고 판매 중지로 둬요 — 지난 마감 기록이 이 메뉴를 가리켜요</p>`}</div>
    </div>`;
  }
  // 레시피에서 재료 찾기 → 없으면 그 자리에서 새 식자재 (단가는 나중에 넣어도 됨)
  function addingBox() {
    return `<div class="adding">
      <span class="inp"><span class="muted" style="display:grid;margin-right:6px">${ICON.search}</span><input value="말차" aria-label="재료 찾기"></span>
      <div class="small muted" style="padding:6px 2px">"말차"와 맞는 식자재가 없어요</div>
      <div class="newing">
        <div class="small"><b>새 식자재 "말차 파우더"</b></div>
        <div class="seg sm"><button type="button" aria-pressed="true">g</button><button type="button">ml</button><button type="button">개</button></div>
        <div class="inline-price"><span class="inp"><input class="num" placeholder="가격" value="18,000"><span class="muted">원</span></span><span class="muted">/</span>
          <span class="inp"><input class="num" placeholder="양" value="500"><span class="muted">g</span></span></div>
        <div class="small muted">= 1g당 36원 · 단가는 비워 두고 나중에 넣어도 돼요</div>
        <div class="row-between"><span class="inp" style="flex:1;margin-right:8px"><input class="num" value="6"><span class="muted">g</span></span><button class="primary inline" type="button">더하기</button></div>
      </div></div>`;
  }

  // 식자재 상세 ----------------------------------------------------------------
  function ingDetail(i) {
    const users = usedBy(i.id), locked = users.length > 0;
    const p = fmtUnitPrice(i);
    return `<div class="form">
      <label class="fld"><span class="lab">식자재 이름</span><span class="inp"><input value="${i.name}"></span></label>
      <div class="fld"><span class="lab">기본 단위 <span class="muted small">레시피 · 재고를 이 단위로 측정해요</span></span>
        <div class="seg${locked ? ' locked' : ''}">${['g', 'ml', '개'].map((u) => `<button type="button" aria-pressed="${u === i.unit}" ${locked ? 'disabled' : ''}>${u}</button>`).join('')}</div>
        ${locked ? `<span class="small muted lockline">${ICON.lock} 레시피 ${users.length}개에서 사용 중이라 바꿀 수 없어요 — 단위가 바뀌면 레시피 숫자의 뜻이 바뀌어요</span>` : ''}</div>
      ${i.unit === '개' ? `<label class="fld"><span class="lab">1개 무게 <span class="muted small">탄소 계산에 사용해요</span></span><span class="inp"><input class="num" value="${i.each}"><span class="muted">g</span></span></label>` : ''}
      <div class="fld"><span class="lab">기본 단가 <span class="muted small">사는 단위 그대로 넣어요</span></span>
        <div class="inline-price"><span class="inp"><input class="num" value="${i.pack ? i.pack[0].toLocaleString('ko-KR') : ''}" placeholder="가격"><span class="muted">원</span></span><span class="muted">/</span>
          <span class="inp"><input class="num" value="${i.pack ? fmtQty(i.pack[1]) : ''}" placeholder="양"><span class="muted">${i.unit}</span></span></div>
        <span class="small muted">${p ? `= ${p}` : '<span class="warn-t">비어 있으면 이 재료는 손실 금액에서 제외돼요</span>'}. 입고(M3)를 기록하면 입고 단가를 먼저 사용해요</span></div>
      <div class="fld"><span class="lab">탄소 분류 <span class="muted small">추정 · 전 세계 평균</span></span>
        <span class="inp sel"><select>${i.c ? '' : '<option selected>분류를 골라 주세요</option>'}${Object.entries(CARBON).map(([k, [n, f]]) => `<option ${k === i.c ? 'selected' : ''}>${n}${f ? ` · ${f} kgCO₂e/kg` : ''}</option>`).join('')}</select></span>
        <span class="small muted">${i.c ? '' : '<span class="warn-t">분류가 없으면 탄소에서 제외돼요. 알맞은 재료가 없으면 가장 가까운 것을 골라요(버터 → 우유 · 치즈 중). </span>'}출처 Poore &amp; Nemecek (2018), Our World in Data</span></div>
      <div class="fld"><span class="lab">사용 중인 메뉴 <span class="muted small">${users.length}개</span></span>
        <div class="users">${users.map((m) => { const q = m.recipe.find(([id]) => id === i.id)[1]; return `<button type="button" class="chip">${m.name} · ${fmtQty(q)}${i.unit}</button>`; }).join('') || '<span class="small muted">아직 레시피에 없어요</span>'}</div></div>
      <div class="actions"><button class="primary" type="button">저장</button>
        <button class="ghost wide" type="button" data-stop>사용 중지</button>
        ${locked ? `<p class="small muted center" style="margin:0">사용 중지해도 레시피 ${users.length}개에는 남아요. 레시피에서 빼려면 메뉴에서 빼 주세요</p>` : ''}</div>
    </div>`;
  }

  function empty() {
    return `<div class="empty" style="padding:48px 8px 16px"><div class="big" aria-hidden="true">🥐</div>
      <h2 style="margin:8px 0 4px;font-size:18px;color:var(--text)">아직 메뉴가 없어요</h2>
      <p class="small" style="margin:0">판매하는 메뉴부터 넣어요. 레시피 · 식자재는 메뉴를 넣으면서 같이 만들 수 있어요.</p>
      <button class="primary" type="button" data-go="newmenu">첫 메뉴 넣기</button></div>
      <div class="uses small" style="margin-top:8px">많으면 표로 한 번에 — 데스크톱에서 엑셀 붙여넣기(나중에)</div>`;
  }

  const NEW_MENU = { id: 'matcha', cat: '음료', name: '말차라떼', fresh: false, price: 5800, recipe: [['milk', 200]] };
  const detailFor = (s) => s === 'menu' ? ['menu', MENUS.find((m) => m.id === 'croissant')]
    : s === 'price' ? ['menu', MENUS.find((m) => m.id === 'ricotta')]
    : s === 'newmenu' ? ['new', NEW_MENU]
    : s === 'ingredient' ? ['ing', ingById.butter] : [null, null];
  const tabOf = (s) => (s === 'ingredients' || s === 'ingredient' ? 'ing' : 'menu');

  function wire(root) {
    const go = (s) => { const p = new URLSearchParams(location.search); p.set('state', s); location.search = p.toString(); };
    root.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
    root.querySelectorAll('[data-menu]').forEach((b) => b.onclick = () => go(b.dataset.menu === 'ricotta' ? 'price' : 'menu'));
    root.querySelectorAll('[data-ing]').forEach((b) => b.onclick = () => go('ingredient'));
    root.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => go(b.dataset.tab === 'ing' ? 'ingredients' : 'menus'));
    root.querySelectorAll('[data-stop]').forEach((b) => b.onclick = () => ZW.toast('판매 중지 — 목록 아래 "판매 중지"로 내려가요. 다시 켤 수 있어요'));
    root.querySelectorAll('.chip[aria-pressed]').forEach((b) => b.onclick = () => { b.parentElement.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); });
  }

  window.SET = { STATES, state, variant, MENUS, ING, ICON, menuList, ingList, menuDetail, ingDetail, empty, detailFor, tabOf, wire, costOf };
})();
