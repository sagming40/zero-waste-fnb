/* 앱 전체 화면 목록 · 이동 시안용 데이터 (Map.html · Shell.*.html 공용).
 * src가 있는 화면은 이미 그린 시안을 그대로 끼워 보여 주고, 없는 화면은 자리표시.
 */
(function () {
  // 아이콘: 직접 그린 단순한 선 아이콘 (24 × 24, stroke)
  const I = {
    today: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    closing: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4v3h6V4M9 12h6M9 16h4"/>',
    forecast: '<path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/>',
    stock: '<path d="M4 8l8-4 8 4v9l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v9"/>',
    receive: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
    waste: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    count: '<path d="M9 5h10M9 12h10M9 19h10M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2"/>',
    report: '<path d="M5 20V10M10 20V4M15 20v-7M20 20v-4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    store: '<path d="M4 9l2-5h12l2 5M4 9h16v11H4zM9 20v-5h6v5"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
  };
  const icon = (k, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k] || ''}</svg>`;

  // 화면 목록. staff: 직원도 쓰는가 (F03: 직원은 마감 입력 · 입고 · 폐기만)
  // stage: 언제 만드는가 (PLAN), mock: 시안 상태
  const SCREENS = [
    { id: 'today', label: '오늘', group: '매일', f: 'F19 (+ F16)', staff: false, stage: 'M2', mock: '오늘 손실 채택', src: 'Loss' },
    { id: 'closing', label: '마감', group: '매일', f: 'F08', staff: true, stage: 'M2', mock: '채택', src: 'Closing' },
    { id: 'forecast', label: '내일 권장', group: '매일', f: 'F16 · F17', staff: false, stage: 'M4', mock: '시안 전' },
    { id: 'stock', label: '재고', group: '재고', f: 'F11 · F21', staff: false, stage: 'M3', mock: '시안 전' },
    { id: 'receive', label: '입고', group: '재고', f: 'F10', staff: true, stage: 'M3', mock: '시안 전' },
    { id: 'waste', label: '재료 폐기', group: '재고', f: 'F09', staff: true, stage: 'M3', mock: '시안 전' },
    { id: 'count', label: '실사', group: '재고', f: 'F12', staff: false, stage: 'M3', mock: '시안 전' },
    { id: 'report', label: '리포트', group: '리포트', f: 'F20 · F18', staff: false, stage: 'M4 · M5', mock: '시안 전' },
    { id: 'settings', label: '메뉴 · 레시피', group: '설정', f: 'F04 · F05 · F06', staff: false, stage: 'M2', mock: '채택', src: 'Settings' },
    { id: 'store', label: '매장 · 직원', group: '설정', f: 'F02 · F03', staff: false, stage: 'M2', mock: '채택', src: 'Members' },
  ];
  const byId = Object.fromEntries(SCREENS.map((s) => [s.id, s]));

  // 화면 안에 넣을 내용: 그린 시안이면 iframe 주소, 아니면 null
  function srcFor(id, device, extra) {
    const s = byId[id];
    if (!s || !s.src) return null;
    return `${s.src}.${device}.html?${extra}`;
  }

  // 아직 안 그린 화면의 자리표시
  function placeholder(id) {
    const s = byId[id];
    return `<div style="padding:28px 20px;text-align:center;color:var(--muted)">
      <div style="color:var(--fg, var(--text));opacity:.5">${icon(id, 40)}</div>
      <div style="font-size:18px;font-weight:700;color:var(--text);margin-top:8px">${s.label}</div>
      <div style="font-size:13px;margin-top:4px">${s.f} · ${s.stage} · ${s.mock}</div>
      <div style="font-size:12px;margin-top:12px">이 화면 시안은 아직 그리지 않았다</div></div>`;
  }

  window.NAV = { SCREENS, byId, icon, srcFor, placeholder };
})();
