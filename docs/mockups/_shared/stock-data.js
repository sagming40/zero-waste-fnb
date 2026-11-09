/* 재고 묶음(입고 · 재고 · 재료 폐기 · 실사) 시안이 같이 쓰는 예시 데이터와 계산.
 * shared.js 뒤에 읽는다. 전역 STK 하나. 값은 전부 지어낸 예시다.
 * 오늘 = 2026-11-08 (일) — 마감 입력 · 오늘 손실 시안과 같은 날.
 *
 * 식자재 이름 · 기본 단가는 settings/settings.js(메뉴 · 레시피 시안)와 같은 값을 쓴다.
 * 옆 폴더 파일은 읽지 않는 규칙(mockups README "파일")이라 여기에 다시 적었다.
 */
(function () {
  const TODAY = '2026-11-08';
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];

  // 날짜 — 문자열 'YYYY-MM-DD'만 쓴다(KST 영업일, 시각 없음)
  const toDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fromDate = (dt) => dt.toISOString().slice(0, 10);
  const addDays = (s, n) => { const dt = toDate(s); dt.setUTCDate(dt.getUTCDate() + n); return fromDate(dt); };
  const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000); // b - a
  const fmtDate = (s, withYear) => {
    const dt = toDate(s);
    const y = dt.getUTCFullYear() !== toDate(TODAY).getUTCFullYear() || withYear ? `${dt.getUTCFullYear()}년 ` : '';
    return `${y}${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일 (${DOW[dt.getUTCDay()]})`;
  };
  // 올해가 아니면 연도를 붙인다 (2027/5/5)
  const fmtShort = (s) => { const dt = toDate(s); const y = dt.getUTCFullYear() !== toDate(TODAY).getUTCFullYear() ? `${dt.getUTCFullYear()}/` : ''; return `${y}${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`; };

  // 남은 날 — 임박 기준은 고정: 오늘 · 내일 = 임박, 지남 = 만료 (2026-11-09 M3 사전 검증 안)
  function expInfo(exp) {
    if (!exp) return { kind: 'none', text: '유통기한 없음', d: null };
    const d = daysBetween(TODAY, exp);
    if (d < 0) return { kind: 'over', text: `${-d}일 지남`, d };
    if (d === 0) return { kind: 'soon', text: '오늘까지', d };
    if (d === 1) return { kind: 'soon', text: '내일까지', d };
    return { kind: 'ok', text: `${d}일 남음`, d };
  }

  // unit: 기본 단위 (레시피 · 재고를 이 단위로 측정). pack: 기본 단가 [가격원, 양] — 사는 단위 그대로.
  // shelf: 지난번 입고에서 유통기한까지 며칠이었나 ("지난번처럼" 칩). null = 유통기한 없이 넣었다
  const ING = [
    { id: 'flour', name: '밀가루(강력분)', unit: 'g', pack: [20000, 20000], shelf: 180 },
    { id: 'butter', name: '버터', unit: 'g', pack: [15000, 1000], shelf: 60 },
    { id: 'milk', name: '우유', unit: 'ml', pack: [2800, 1000], shelf: 7 },
    { id: 'sugar', name: '설탕', unit: 'g', pack: [1500, 1000], shelf: null },
    { id: 'egg', name: '달걀', unit: '개', pack: [7800, 30], shelf: 14 },
    { id: 'salt', name: '소금', unit: 'g', pack: [2000, 1000], shelf: null },
    { id: 'bean', name: '원두', unit: 'g', pack: [28000, 1000], shelf: 90 },
    { id: 'ham', name: '햄', unit: 'g', pack: [12000, 1000], shelf: 14 },
    { id: 'slice', name: '슬라이스 치즈', unit: '개', pack: [9000, 50], shelf: 30 },
    { id: 'bread', name: '식빵', unit: '개', pack: [3500, 12], shelf: 4 },
    { id: 'ricotta', name: '리코타 치즈', unit: 'g', pack: null, shelf: 10 },
    { id: 'lettuce', name: '양상추', unit: 'g', pack: [4000, 1000], shelf: 4 },
    { id: 'tomato', name: '방울토마토', unit: 'g', pack: [6000, 1000], shelf: 5 },
    { id: 'beef', name: '소고기 불고기용', unit: 'g', pack: [25000, 1000], shelf: 3 },
    { id: 'rice', name: '쌀', unit: 'g', pack: [50000, 20000], shelf: 365 },
  ];
  const ingById = Object.fromEntries(ING.map((i) => [i.id, i]));

  // 양 표시 — g · ml 는 1,000 이상이면 kg · L 로 (저장은 늘 기본 단위)
  const BIG = { g: 'kg', ml: 'L' };
  function fmtQty(q, unit) {
    if (q === null || q === undefined || q === '') return '';
    if (BIG[unit] && q >= 1000) { const v = q / 1000; return `${Number.isInteger(v) ? v : v.toFixed(1).replace(/\.0$/, '')}${BIG[unit]}`; }
    return `${q.toLocaleString('ko-KR')}${unit}`;
  }
  // 입력 칸에 보일 값과 단위 — 1,000 이상이고 100 단위로 떨어지면 큰 단위
  function inputQty(q, unit) {
    if (q === null || q === undefined) return { v: '', u: BIG[unit] || unit };
    if (BIG[unit] && q >= 1000 && q % 100 === 0) return { v: String(q / 1000), u: BIG[unit] };
    return { v: q.toLocaleString('ko-KR'), u: unit };
  }

  // 1기본단위당 값 — 원 미만이 흔하다(밀가루 1g = 1원). 돈 합계에서만 원으로 반올림 (DATA_MODEL 5절)
  const perUnit = (price, qty) => (price === null || price === undefined || !qty ? null : price / qty);
  const basePer = (i) => (i.pack ? i.pack[0] / i.pack[1] : null);
  function fmtPer(p, unit) {
    if (p === null) return null;
    const big = BIG[unit];
    // g · ml 는 1kg · 1L 당으로 보이는 게 읽기 쉽다 (1g당 16원 → 1kg당 16,000원)
    if (big) return `1${big}당 ${Math.round(p * 1000).toLocaleString('ko-KR')}원`;
    return `1${unit}당 ${p < 10 ? p.toFixed(1).replace(/\.0$/, '') : Math.round(p).toLocaleString('ko-KR')}원`;
  }
  // 기본 단가와 비교 — 5% 안이면 "비슷해요"
  function vsBase(i, price, qty) {
    const p = perUnit(price, qty), b = basePer(i);
    if (p === null) return null;
    if (b === null) return { kind: 'nobase', text: '기본 단가가 아직 없어요' };
    const r = p / b - 1;
    if (Math.abs(r) < 0.05) return { kind: 'same', text: '기본 단가와 비슷해요' };
    return { kind: r > 0 ? 'up' : 'down', text: `기본 단가보다 ${Math.round(Math.abs(r) * 100)}% ${r > 0 ? '비싸요' : '싸요'}`, r };
  }

  // 사람 — members 시안과 같은 이름 (지어낸 값)
  const PEOPLE = { owner: '한도윤', staff: '김하늘', staff2: '서지우' };

  // 입고 기록. line: [식자재, 양(기본 단위), 유통기한, 금액원 | null(단가 비어 있음)]
  // usedBy: 이 입고의 로트를 이미 차감한 마감 날짜 (단가를 나중에 넣으면 그날 손실을 다시 계산한다)
  const RECEIPTS = [
    { id: 'r1108', date: '2026-11-08', time: '08:50', by: 'staff', lines: [
      ['milk', 12000, '2026-11-15', null], ['lettuce', 2000, '2026-11-12', null], ['bread', 24, '2026-11-12', null]], usedBy: [] },
    { id: 'r1107', date: '2026-11-07', time: '08:40', by: 'staff', lines: [
      ['milk', 6000, '2026-11-14', null], ['egg', 60, '2026-11-21', null], ['lettuce', 3000, '2026-11-10', 13500], ['tomato', 1000, '2026-11-11', 6000]],
      usedBy: ['2026-11-07'], filledBy: null },
    { id: 'r1106', date: '2026-11-06', time: '10:10', by: 'owner', lines: [
      ['flour', 20000, '2027-05-05', 20000], ['butter', 2000, '2027-01-05', 30000], ['sugar', 3000, null, 4500], ['bean', 2000, '2027-02-04', 56000]], usedBy: ['2026-11-06', '2026-11-07'] },
    { id: 'r1105', date: '2026-11-05', time: '08:55', by: 'staff2', lines: [
      ['milk', 12000, '2026-11-12', 33600], ['ham', 1000, '2026-11-19', 12000], ['slice', 50, '2026-12-05', 9000], ['beef', 2000, '2026-11-08', 50000]],
      usedBy: ['2026-11-05', '2026-11-06', '2026-11-07'], filledBy: 'owner' },
    { id: 'r1103', date: '2026-11-03', time: '09:20', by: 'owner', lines: [
      ['rice', 20000, '2027-11-03', 50000], ['ricotta', 1000, '2026-11-13', null], ['salt', 1000, null, 2000]], usedBy: ['2026-11-03'] },
  ];
  const missingPrice = (r) => r.lines.filter((l) => l[3] === null).length;
  const receiptTotal = (r) => r.lines.reduce((s, l) => s + (l[3] || 0), 0);

  // 재고 ---------------------------------------------------------------------------
  // 오늘(11-08) 마감은 아직 — 재고는 어제 마감까지 차감됐고, 오늘 아침 입고는 더해져 있다
  const CLOSED_UNTIL = '2026-11-07';
  // 로트: 입고 줄 하나 = 로트 하나. [재료, 입고일, 처음 양, 남은 양, 유통기한, 금액(줄 전부) | null]
  // 다 쓴 로트(남은 0)는 재고 화면에 안 보인다 — 원장에는 남는다
  const LOTS = [
    ['milk', '2026-11-05', 12000, 2400, '2026-11-12', 33600], ['milk', '2026-11-07', 6000, 6000, '2026-11-14', null], ['milk', '2026-11-08', 12000, 12000, '2026-11-15', null],
    ['lettuce', '2026-11-04', 2000, 400, '2026-11-08', 8000], ['lettuce', '2026-11-07', 3000, 3000, '2026-11-10', 13500], ['lettuce', '2026-11-08', 2000, 2000, '2026-11-12', null],
    ['tomato', '2026-11-01', 1000, 300, '2026-11-06', 6000], ['tomato', '2026-11-07', 1000, 700, '2026-11-11', 6000],
    ['beef', '2026-11-05', 2000, 600, '2026-11-08', 50000],
    ['bread', '2026-11-05', 12, 2, '2026-11-09', 3500], ['bread', '2026-11-08', 24, 24, '2026-11-12', null],
    ['egg', '2026-11-07', 60, 38, '2026-11-21', null],
    ['ricotta', '2026-11-03', 1000, 400, '2026-11-13', null],
    ['ham', '2026-11-05', 1000, 520, '2026-11-19', 12000], ['slice', '2026-11-05', 50, 31, '2026-12-05', 9000],
    ['bean', '2026-11-06', 2000, 1300, '2027-02-04', 56000], ['flour', '2026-11-06', 20000, 14200, '2027-05-05', 20000],
    ['sugar', '2026-11-06', 3000, 2100, null, 4500], ['salt', '2026-11-03', 1000, 860, null, 2000], ['rice', '2026-11-03', 20000, 15800, '2027-11-03', 50000],
  ].map(([ing, date, qty0, left, exp, price], k) => ({ id: 'L' + k, ing, date, qty0, left, exp, price }));
  // 기록보다 더 사용한 양 (재고는 0에서 멈추고 모자란 만큼 "부족" 줄로 남는다 — M3 사전 검증 안)
  const SHORT = { butter: 350 };
  // 최근 7 영업일 하루 평균 사용량 (휴무일 제외) — "며칠치" 계산용
  const AVG = { milk: 3600, butter: 1100, flour: 2900, egg: 9, lettuce: 900, tomato: 400, bread: 8, beef: 400, bean: 600, ham: 120, slice: 4, rice: 2000, ricotta: 120, sugar: 300, salt: 60 };

  // 차감 순서: 만료 안 된 로트 중 유통기한 빠른 것부터, 유통기한 없음은 맨 뒤. 만료된 로트는 차감하지 않는다(사전 검증 안 — 아래 README)
  const lotOrder = (a, b) => (a.exp === null) - (b.exp === null) || (a.exp || '').localeCompare(b.exp || '') || a.date.localeCompare(b.date);
  const lotsOf = (ing) => LOTS.filter((l) => l.ing === ing && l.left > 0).sort(lotOrder);
  function lotValue(l) {
    const i = ingById[l.ing];
    const p = l.price !== null ? l.price / l.qty0 : basePer(i);
    return p === null ? null : p * l.left;
  }
  function stockOf(ing) {
    const lots = lotsOf(ing);
    const live = lots.filter((l) => expInfo(l.exp).kind !== 'over');
    const qty = lots.reduce((s, l) => s + l.left, 0);
    const liveQty = live.reduce((s, l) => s + l.left, 0);
    // 재고 금액은 만료 안 된 로트만. 만료 로트 금액은 따로(폐기로 기록하면 손실이 될 돈)
    let value = 0, unknown = 0, noPrice = 0, expValue = 0;
    lots.forEach((l) => {
      const v = lotValue(l), over = expInfo(l.exp).kind === 'over';
      if (over) { expValue += v || 0; return; }
      if (v === null) unknown++; else value += v;
      if (l.price === null) noPrice++;
    });
    const first = live.find((l) => l.exp) || null;
    const expired = lots.filter((l) => expInfo(l.exp).kind === 'over');
    const soon = lots.filter((l) => expInfo(l.exp).kind === 'soon');
    const days = AVG[ing] ? liveQty / AVG[ing] : null;
    return { ing, lots, qty, liveQty, value, unknown, noPrice, expValue, first, expired, soon, short: SHORT[ing] || 0, days };
  }
  const STOCK = ING.map((i) => stockOf(i.id));

  // 원장 (재료 하나의 최근 기록, 최신이 위). [날짜, 시각 | null, 종류, 양(±), 남은 양(그 뒤), 누가 · 메모]
  // 종류: in 입고 · use 마감 사용 · waste 재료 폐기 · count 실사 조정 · fix 입고 고침 · short 부족
  const LEDGER = {
    milk: [
      ['2026-11-08', '08:50', 'in', 12000, 20400, '김하늘 · 11/15까지'],
      ['2026-11-07', null, 'use', -3800, 8400, '마감 · 라떼 · 바닐라라떼 · 크루아상 외'],
      ['2026-11-07', '08:40', 'in', 6000, 12200, '김하늘 · 11/14까지 · 단가 비어 있음'],
      ['2026-11-06', null, 'use', -3400, 6200, '마감'],
      ['2026-11-05', null, 'use', -3600, 9600, '마감'],
      ['2026-11-05', '08:55', 'in', 12000, 13200, '서지우 · 11/12까지'],
    ],
    butter: [
      ['2026-11-07', null, 'short', 350, 0, '마감에서 1,350g이 필요했는데 1,000g만 남아 있었어요'],
      ['2026-11-07', null, 'use', -1000, 0, '마감 · 크루아상 40 · 소금빵 60'],
      ['2026-11-06', null, 'use', -1000, 1000, '마감'],
      ['2026-11-06', '10:10', 'in', 2000, 2000, '한도윤 · 1/5까지'],
    ],
    tomato: [
      ['2026-11-07', null, 'use', -300, 1000, '마감 · 리코타 샐러드 12'],
      ['2026-11-07', '08:40', 'in', 1000, 1300, '김하늘 · 11/11까지'],
      ['2026-11-06', null, 'use', -400, 300, '마감 — 11/6이 기한인 로트에서'],
    ],
  };
  const KIND = { in: '입고', use: '마감 사용', waste: '재료 폐기', count: '실사 조정', fix: '입고 고침', short: '부족' };

  window.STK = { TODAY, DOW, ING, ingById, PEOPLE, RECEIPTS, addDays, daysBetween, fmtDate, fmtShort, expInfo, fmtQty, inputQty, BIG,
    perUnit, basePer, fmtPer, vsBase, missingPrice, receiptTotal,
    CLOSED_UNTIL, LOTS, SHORT, AVG, lotsOf, lotValue, stockOf, STOCK, LEDGER, KIND };
})();
