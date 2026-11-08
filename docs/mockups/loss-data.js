/* 오늘 손실 화면(F19) 시안용 데이터 · 부품. 값은 전부 지어낸 것.
 * 오늘(일 11/8) 값은 마감 입력 시안의 "입력 중" 상태를 저장했다고 보고 맞춘다:
 *   메뉴 폐기 ₩18,600 (리코타 3 · 바게트 4 · 크루아상 3) + 재료 폐기 ₩4,200 = ₩22,800
 * 손실은 원가 기준 (DATA_MODEL 4절 8). 할인 판매 · 직원식 · 기부는 손실이 아니라 "구한 것".
 */
(function () {
  const { params, won } = ZW;
  const state = params.get('state') || 'normal';

  // 이번 주(월 ~ 일). 월요일은 정기 휴무. loss = 그날 손실(원), rate = 폐기율, lastWeek = 지난주 같은 요일
  const WEEK = [
    { d: '월', date: '11/2', closed: true, lastWeek: null },
    { d: '화', date: '11/3', loss: 31400, rate: 0.104, wasted: 14, lastWeek: 33800 },
    { d: '수', date: '11/4', loss: 27900, rate: 0.092, wasted: 12, lastWeek: 30100 },
    { d: '목', date: '11/5', loss: 35200, rate: 0.113, wasted: 15, lastWeek: 36900 },
    { d: '금', date: '11/6', loss: 19800, rate: 0.061, wasted: 8, lastWeek: 27200 },
    { d: '토', date: '11/7', loss: 24600, rate: 0.071, wasted: 10, lastWeek: 30800 },
    { d: '일', date: '11/8', loss: 22800, rate: 0.079, wasted: 10, lastWeek: 29500, today: true },
  ];

  // 오늘 무엇을 버렸나 — kind: menu(메뉴 폐기, 레시피로 펼친 원가) / ingredient(재료 폐기, 로트 단가)
  const TODAY_LINES = [
    { kind: 'menu', name: '리코타 샐러드', cat: '샐러드', qty: '3개', why: '남음 → 폐기', loss: 11700 },
    { kind: 'menu', name: '바게트', cat: '베이커리', qty: '4개', why: '남음 → 폐기', loss: 3600 },
    { kind: 'menu', name: '크루아상', cat: '베이커리', qty: '3개', why: '남음 5 중 직원식 2 · 폐기 3', loss: 3300 },
    { kind: 'ingredient', name: '우유', cat: '재료', qty: '1L', why: '유통기한 만료', loss: 2800 },
    { kind: 'ingredient', name: '양상추', cat: '재료', qty: '350g', why: '손질', loss: 1400 },
  ];
  // 구한 것 — 남았지만 버리지 않은 것 (손실에서 빠진다)
  const SAVED = [{ name: '크루아상', qty: '2개', how: '직원식', value: 2200 }];

  // 상태에 맞게 고친 사본
  const week = WEEK.map((x) => ({ ...x }));
  const today = week[week.length - 1];
  if (state === 'before') { delete today.loss; today.pending = true; }              // 오늘 마감 전
  if (state === 'missing') { const w = week[2]; delete w.loss; w.missing = true; }   // 수요일 입력 안 함
  if (state === 'closed') { delete today.loss; today.closed = true; }                // 오늘 휴무
  const empty = state === 'empty';

  const counted = week.filter((x) => x.loss != null);
  const weekSum = counted.reduce((a, x) => a + x.loss, 0);
  // 지난주 비교는 이번 주에 값이 있는 요일끼리만 — 빠진 날을 0으로 세면 "줄었다"로 속는다
  const lastWeekSum = counted.reduce((a, x) => a + (x.lastWeek || 0), 0);
  const weekWasted = counted.reduce((a, x) => a + x.wasted, 0);
  const weekRate = counted.length ? counted.reduce((a, x) => a + x.rate, 0) / counted.length : 0;

  const pct = (r) => (r * 100).toFixed(1) + '%';
  // 손실은 줄면 좋은 것 — 줄면 주 색(초록), 늘면 손실 색
  function delta(now, before, label) {
    if (now == null || !before) return '';
    const diff = now - before;
    const p = Math.round(Math.abs(diff) / before * 100);
    const good = diff <= 0;
    return `<span class="delta ${good ? 'good' : 'bad'}">${label} ${won(Math.abs(diff))} ${good ? '↓ 덜' : '↑ 더'} 버림 (${p}%)</span>`;
  }

  // 막대 그래프 (SVG). 휴무 = 막대 없이 "휴무", 입력 안 함 = 점선 막대 + "?", 마감 전 = 점선 + "…"
  // opts: { height, ghost(지난주 표시), selectable, selected }
  function bars(opts = {}) {
    const H = opts.height || 140, W = 320, n = week.length, gap = 10;
    const bw = (W - gap * (n - 1)) / n;
    const max = Math.max(...week.map((x) => Math.max(x.loss || 0, opts.ghost ? x.lastWeek || 0 : 0)), 1);
    const top = 18, base = H - 22, scale = (v) => (base - top) * v / max;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="bars" role="img" aria-label="이번 주 요일별 폐기 손실">`;
    week.forEach((x, i) => {
      const cx = i * (bw + gap);
      const sel = opts.selectable && opts.selected === i;
      if (opts.ghost && x.lastWeek) {
        const gh = scale(x.lastWeek);
        s += `<rect x="${cx + bw * 0.15}" y="${base - gh}" width="${bw * 0.7}" height="${gh}" rx="3" fill="none" stroke="var(--muted)" stroke-dasharray="3 3" opacity=".7"/>`;
      }
      if (x.loss != null) {
        const h = scale(x.loss);
        const fill = x.today || sel ? 'var(--loss)' : 'color-mix(in srgb, var(--loss) 45%, transparent)';
        s += `<rect x="${cx}" y="${base - h}" width="${bw}" height="${h}" rx="5" fill="${fill}"/>`;
        if (x.today || sel) s += `<text x="${cx + bw / 2}" y="${base - h - 5}" text-anchor="middle" class="bv">${(x.loss / 10000).toFixed(1)}만</text>`;
      } else if (x.closed) {
        s += `<text x="${cx + bw / 2}" y="${base - 6}" text-anchor="middle" class="bl">휴무</text>`;
      } else {
        const h = (base - top) * 0.45;
        s += `<rect x="${cx + 1}" y="${base - h}" width="${bw - 2}" height="${h}" rx="5" fill="none" stroke="var(--warn)" stroke-dasharray="4 3"/>`;
        s += `<text x="${cx + bw / 2}" y="${base - h / 2 + 4}" text-anchor="middle" class="bq">${x.pending ? '…' : '?'}</text>`;
      }
      s += `<text x="${cx + bw / 2}" y="${H - 6}" text-anchor="middle" class="bl ${x.today ? 'today' : ''}">${x.d}</text>`;
      if (opts.selectable && x.loss != null) s += `<rect x="${cx}" y="0" width="${bw}" height="${H}" fill="transparent" data-day="${i}" style="cursor:pointer"><title>${x.d} ${x.date}</title></rect>`;
    });
    return s + '</svg>';
  }

  // 그날의 내역 — 오늘은 실제 줄, 다른 날은 같은 모양을 손실에 비례해 지어낸다(시안용)
  function linesFor(i) {
    const x = week[i];
    if (x.today) return TODAY_LINES;
    if (x.loss == null) return [];
    const k = x.loss / 22800;
    return TODAY_LINES.map((l) => ({ ...l, loss: Math.round(l.loss * k / 100) * 100 }));
  }

  // 막대 그래프용 공용 스타일
  const css = document.createElement('style');
  css.textContent = `
    .bars { width: 100%; height: auto; display: block; }
    .bars .bl { font-size: 11px; fill: var(--muted); }
    .bars .bl.today { fill: var(--fg, var(--text)); font-weight: 700; }
    .bars .bv { font-size: 11px; fill: var(--loss); font-weight: 700; }
    .bars .bq { font-size: 13px; fill: var(--warn); font-weight: 700; }
    .delta { display: inline-block; font-size: 13px; font-weight: 600; padding: 3px 8px; border-radius: 999px; }
    .delta.good { background: var(--accent-soft); color: var(--accent); }
    .delta.bad { background: var(--loss-soft); color: var(--loss); }
    .hbar { height: 6px; border-radius: 999px; background: var(--surface-2); overflow: hidden; margin-top: 4px; }
    .hbar i { display: block; height: 100%; background: var(--loss); }
    .hbar i.ing { background: var(--warn); }
  `;
  document.head.appendChild(css);

  window.LOSS = { state, empty, week, today, TODAY_LINES, SAVED, weekSum, lastWeekSum, weekWasted, weekRate, pct, delta, bars, linesFor };
})();
