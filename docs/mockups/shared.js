/* ZeroWaste F&B 목업 공용 값 · 부품.
 * file:// 로 바로 열리게 모듈(import) 없이 전역 ZW 하나만 둔다.
 * 예시 데이터는 전부 지어낸 값이다.
 */
(function () {
  const params = new URLSearchParams(location.search);

  // ?dark=1 이면 어두운 화면, 없으면 시스템 설정을 따른다
  const darkParam = params.get('dark');
  const dark = darkParam === null
    ? matchMedia('(prefers-color-scheme: dark)').matches
    : darkParam === '1';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';

  // 컬러 시안 (?palette=A ~ H). 채택: E 올리브 (2026-11-08) — 파라미터가 없으면 E. shared.css 기본값은 A(비교용)
  const COMMON_WARN = { light: { warn: '#8a5a00', 'warn-soft': '#fbf0d9' }, dark: { warn: '#e0b04f', 'warn-soft': '#3a2f17' } };
  const PALETTES = {
    A: { name: '숲', desc: '초록(아낌 · 친환경) + 테라코타 손실. 지금 기본값',
      light: { bg: '#f6f5f1', surface: '#ffffff', 'surface-2': '#efede7', text: '#1c1b19', muted: '#6b6860', line: '#e2dfd7', accent: '#2f6b4f', 'accent-ink': '#ffffff', 'accent-soft': '#e3efe8', loss: '#b4442c', 'loss-soft': '#f8e6e1' },
      dark: { bg: '#141413', surface: '#1f1e1c', 'surface-2': '#2a2926', text: '#ecebe6', muted: '#9a978f', line: '#36342f', accent: '#5fae86', 'accent-ink': '#0f1a14', 'accent-soft': '#1f3329', loss: '#e9846a', 'loss-soft': '#3a231d' } },
    B: { name: '밀', desc: '갈색 빵 껍질 + 크림 바탕. 베이커리 느낌, 손실은 빨강',
      light: { bg: '#faf6ef', surface: '#ffffff', 'surface-2': '#f1ebe0', text: '#2a2118', muted: '#74685a', line: '#e6ddcf', accent: '#8a4b1f', 'accent-ink': '#ffffff', 'accent-soft': '#f5e6d8', loss: '#b3261e', 'loss-soft': '#fbe4e1' },
      dark: { bg: '#17130f', surface: '#221c16', 'surface-2': '#2e261e', text: '#f0e9df', muted: '#a59886', line: '#3a3027', accent: '#e0a46c', 'accent-ink': '#20150b', 'accent-soft': '#3a2a1b', loss: '#f08a7e', 'loss-soft': '#3d201c' } },
    C: { name: '청록', desc: '차가운 청록 + 주황 손실. 업무 도구 느낌, 숫자가 또렷하다',
      light: { bg: '#f4f7f7', surface: '#ffffff', 'surface-2': '#e8eeee', text: '#13201f', muted: '#5d6b6a', line: '#d9e2e1', accent: '#0f6e6e', 'accent-ink': '#ffffff', 'accent-soft': '#dcefee', loss: '#b53b0b', 'loss-soft': '#fde8dc' },
      dark: { bg: '#0f1515', surface: '#172020', 'surface-2': '#212b2b', text: '#e5eeed', muted: '#8fa2a0', line: '#2c3838', accent: '#4fc2b8', 'accent-ink': '#062220', 'accent-soft': '#163332', loss: '#f59563', 'loss-soft': '#3b2216' } },
    D: { name: '먹', desc: '흑백 + 손실 빨강 하나만 색. 손실 숫자가 제일 튄다',
      light: { bg: '#f7f7f5', surface: '#ffffff', 'surface-2': '#ececea', text: '#111111', muted: '#666666', line: '#e0e0dc', accent: '#1a1a1a', 'accent-ink': '#ffffff', 'accent-soft': '#ececea', loss: '#c62828', 'loss-soft': '#fbe5e5' },
      dark: { bg: '#0e0e0e', surface: '#1a1a1a', 'surface-2': '#262626', text: '#f0f0f0', muted: '#9a9a9a', line: '#333333', accent: '#f0f0f0', 'accent-ink': '#111111', 'accent-soft': '#2a2a2a', loss: '#ff7a6b', 'loss-soft': '#3a1d1a' } },
    E: { name: '올리브', desc: '올리브 초록 + 벽돌 손실. A보다 흙빛이고 차분하다',
      light: { bg: '#f5f4ee', surface: '#ffffff', 'surface-2': '#ebe9df', text: '#1e1f17', muted: '#67685a', line: '#dedccf', accent: '#5a6b1f', 'accent-ink': '#ffffff', 'accent-soft': '#ecefdc', loss: '#a8321f', 'loss-soft': '#f7e3dd' },
      dark: { bg: '#131410', surface: '#1d1e18', 'surface-2': '#282a21', text: '#ebebe2', muted: '#9b9c8c', line: '#34362b', accent: '#b5c46a', 'accent-ink': '#1a1f08', 'accent-soft': '#2a3018', loss: '#ec8a72', 'loss-soft': '#3a221b' } },
    F: { name: '남색', desc: '차분한 남색 + 산호 손실. 은행 앱처럼 믿음직한 느낌',
      light: { bg: '#f5f6f9', surface: '#ffffff', 'surface-2': '#e9ecf2', text: '#141a26', muted: '#5e6677', line: '#dce0e8', accent: '#1f3a68', 'accent-ink': '#ffffff', 'accent-soft': '#e1e8f5', loss: '#b8301d', 'loss-soft': '#fce6e2' },
      dark: { bg: '#0f121a', surface: '#181c26', 'surface-2': '#222836', text: '#e6e9f0', muted: '#949bab', line: '#2d3342', accent: '#8fb0e8', 'accent-ink': '#0d1830', 'accent-soft': '#1e2a42', loss: '#ff8a75', 'loss-soft': '#3c1f1c' } },
    G: { name: '파랑', desc: '선명한 파랑 + 빨강 손실. 밝고 경쾌하다, 토스 같은 요즘 앱 느낌',
      light: { bg: '#f6f7fb', surface: '#ffffff', 'surface-2': '#eaedf6', text: '#121626', muted: '#5b6278', line: '#dde1ee', accent: '#2b4cc4', 'accent-ink': '#ffffff', 'accent-soft': '#e3e9fb', loss: '#c62828', 'loss-soft': '#fbe5e5' },
      dark: { bg: '#0e1018', surface: '#171a26', 'surface-2': '#212536', text: '#e8eaf2', muted: '#969cb0', line: '#2c3144', accent: '#8ea6ff', 'accent-ink': '#0b1233', 'accent-soft': '#1f2850', loss: '#ff7a6b', 'loss-soft': '#3a1d1a' } },
    H: { name: '자두', desc: '자두 보라 + 주황 손실. 디저트 카페 느낌, 흔하지 않다',
      light: { bg: '#f8f5f6', surface: '#ffffff', 'surface-2': '#efe9ec', text: '#221a1f', muted: '#6e6269', line: '#e5dce1', accent: '#6b2d5c', 'accent-ink': '#ffffff', 'accent-soft': '#f3e3ef', loss: '#b04a00', 'loss-soft': '#fbe9da' },
      dark: { bg: '#151012', surface: '#201a1d', 'surface-2': '#2c2428', text: '#f0e8ec', muted: '#a3959c', line: '#3a3035', accent: '#e39ad0', 'accent-ink': '#2a0f22', 'accent-soft': '#3a2133', loss: '#ffa05c', 'loss-soft': '#3a2414' } },
  };
  Object.values(PALETTES).forEach((p) => { Object.assign(p.light, COMMON_WARN.light); Object.assign(p.dark, COMMON_WARN.dark); });
  const paletteKey = (params.get('palette') || 'E').toUpperCase();
  function applyPalette(key, isDark, el = document.documentElement) {
    const p = PALETTES[key] || PALETTES.A;
    Object.entries(isDark ? p.dark : p.light).forEach(([k, v]) => el.style.setProperty('--' + k, v));
  }
  applyPalette(paletteKey, dark);

  // WCAG 대비율
  function contrast(a, b) {
    const lum = (hex) => {
      const c = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  }

  const won = (n) => '₩' + Math.round(n).toLocaleString('ko-KR');

  // fresh: 당일 생산 · 당일 폐기 품목 (만든 · 남은 · 품절을 받는다)
  // price: 판매가, cost: 레시피로 펼친 1개 원가 (손실은 원가 기준 — DATA_MODEL 4절 8)
  // y: 어제 마감 값 ("어제 값 불러오기"용)
  const MENUS = [
    { id: 'americano', cat: '음료', name: '아메리카노', fresh: false, price: 4500, cost: 900, y: { sold: 62 } },
    { id: 'latte', cat: '음료', name: '카페라떼', fresh: false, price: 5000, cost: 1300, y: { sold: 38 } },
    { id: 'vanilla', cat: '음료', name: '바닐라라떼', fresh: false, price: 5500, cost: 1500, y: { sold: 21 } },
    { id: 'icetea', cat: '음료', name: '복숭아 아이스티', fresh: false, price: 4800, cost: 800, y: { sold: 14 } },
    { id: 'matcha', cat: '음료', name: '말차라떼', fresh: false, price: 5800, cost: 1700, y: null, isNew: true },
    { id: 'croissant', cat: '베이커리', name: '크루아상', fresh: true, price: 3800, cost: 1100, y: { made: 40, left: 6, soldout: false } },
    { id: 'saltbread', cat: '베이커리', name: '소금빵', fresh: true, price: 3200, cost: 700, y: { made: 60, left: 0, soldout: true, at: '15시' } },
    { id: 'baguette', cat: '베이커리', name: '바게트', fresh: true, price: 4500, cost: 900, y: { made: 15, left: 4, soldout: false } },
    { id: 'scone', cat: '베이커리', name: '플레인 스콘', fresh: true, price: 3500, cost: 800, y: { made: 20, left: 3, soldout: false } },
    { id: 'ricotta', cat: '샐러드', name: '리코타 샐러드', fresh: true, price: 9800, cost: 3900, y: { made: 12, left: 2, soldout: false } },
    { id: 'hamcheese', cat: '샌드위치', name: '햄치즈 샌드위치', fresh: true, price: 7500, cost: 2600, y: { made: 18, left: 1, soldout: false } },
    { id: 'eggmayo', cat: '샌드위치', name: '에그마요 샌드위치', fresh: true, price: 6900, cost: 2200, y: { made: 14, left: 0, soldout: true, at: '13시' } },
    { id: 'bulgogi', cat: '도시락', name: '불고기 도시락', fresh: true, price: 9500, cost: 4100, y: { made: 10, left: 2, soldout: false } },
  ];
  const CATS = ['음료', '베이커리', '샐러드', '샌드위치', '도시락'];
  const SOLDOUT_AT = ['~12시', '~15시', '~18시', '마감 직전'];
  // 남은 수량의 행방 (DATA_MODEL 4절 2). 폐기가 기본값이고 나머지를 빼고 남은 만큼이 폐기
  const DEST = [
    { key: 'discount', label: '할인 판매' },
    { key: 'staff', label: '직원식' },
    { key: 'donate', label: '기부' },
  ];

  const blank = (m) => m.fresh
    ? { touched: false, made: 0, left: 0, soldout: false, at: null, dest: { discount: 0, staff: 0, donate: 0 } }
    : { touched: false, sold: 0 };

  const fromYesterday = (m) => {
    const s = blank(m);
    if (!m.y) return s; // 신메뉴: 어제 값이 없다
    s.touched = true;
    if (m.fresh) { s.made = m.y.made; s.left = m.y.left; s.soldout = m.y.soldout; s.at = m.y.at ? (m.y.at === '13시' ? '~12시' : '~15시') : null; }
    else s.sold = m.y.sold;
    return s;
  };

  // 화면 상태 시나리오 (?state=)
  //  entry   : 마감 입력 중 (반쯤 채움) — 기본
  //  closed  : 휴무로 표시
  //  empty   : 메뉴가 하나도 없음 (처음 쓰는 매장)
  //  reentry : 이미 저장된 날을 다시 여는 중
  //  error   : 검증 오류 + 저장 실패
  function initialState(scenario) {
    const st = {};
    MENUS.forEach((m) => { st[m.id] = blank(m); });
    if (scenario === 'entry' || scenario === 'error') {
      st.americano = { touched: true, sold: 58 };
      st.latte = { touched: true, sold: 41 };
      st.croissant = { touched: true, made: 40, left: 5, soldout: false, at: null, dest: { discount: 0, staff: 2, donate: 0 } };
      st.saltbread = { touched: true, made: 60, left: 0, soldout: true, at: '~15시', dest: { discount: 0, staff: 0, donate: 0 } };
      st.baguette = { touched: true, made: 15, left: 4, soldout: false, at: null, dest: { discount: 0, staff: 0, donate: 0 } };
      st.ricotta = { touched: true, made: 12, left: 3, soldout: false, at: null, dest: { discount: 0, staff: 0, donate: 0 } };
    }
    if (scenario === 'error') {
      st.baguette.left = 18; // 만든 15보다 많이 남음 → 오류
    }
    if (scenario === 'reentry') {
      MENUS.forEach((m) => { st[m.id] = fromYesterday(m); });
      st.matcha = { touched: true, sold: 9 };
    }
    return st;
  }

  // 손실 · 폐기율: 당일 생산품만, 원가 기준. 할인 판매 · 직원식 · 기부는 손실에서 뺀다
  function totals(state, list = MENUS) {
    let lossWon = 0, wasted = 0, made = 0, done = 0, needed = 0;
    list.forEach((m) => {
      const s = state[m.id];
      needed++;
      if (s.touched) done++;
      if (!m.fresh) return;
      if (s.left > s.made) return; // 오류 난 줄은 손실에 넣지 않는다 (고친 뒤 다시 센다)
      made += s.made;
      const w = wasteOf(s);
      wasted += w;
      lossWon += w * m.cost;
    });
    return { lossWon, wasted, made, rate: made ? wasted / made : 0, done, needed };
  }
  function wasteOf(s) {
    const other = s.dest.discount + s.dest.staff + s.dest.donate;
    return Math.max(0, s.left - other);
  }
  function errorsOf(m, s) {
    if (!m.fresh) return null;
    if (s.left > s.made) return `남은 수량(${s.left})이 만든 수량(${s.made})보다 많아요`;
    return null;
  }

  // 화면 파일 오른쪽 아래의 시안 전환 단추 — 주소 파라미터만 바꿔 다시 연다 (file:// 에서도 된다)
  function switcher(items, style = '') {
    const box = document.createElement('div');
    box.className = 'switcher';
    box.style.cssText = style;
    const link = (key, val) => { const p = new URLSearchParams(location.search); p.set(key, val); return '?' + p.toString(); };
    box.innerHTML = items.map(([label, key, vals, cur]) => `<span class="grp"><span class="lab">${label}</span>${vals.map(([v, t]) =>
      `<a href="${link(key, v)}" aria-current="${String(v) === String(cur)}">${t}</a>`).join('')}</span>`).join('');
    document.body.appendChild(box);
  }

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 1800);
  }

  window.ZW = { params, dark, PALETTES, paletteKey, applyPalette, contrast, won, MENUS, CATS, SOLDOUT_AT, DEST, blank, fromYesterday, initialState, totals, wasteOf, errorsOf, toast, switcher };
})();
