/* 로그인 · 가입 · 초대 시안 공용 (Auth.mobile.html · Auth.desktop.html).
 * shared.js 뒤에 읽는다. 예시 매장 · 사람 이름은 지어낸 값이다.
 *
 * state (?state=)
 *   login          로그인 — 기본
 *   signup         가입
 *   error          로그인 실패 (어느 쪽이 틀렸는지 말하지 않는다)
 *   locked         로그인 실패가 이어져 잠시 막힘
 *   invite         초대 링크 — 계정 없는 사람 (가입하며 들어가기)
 *   invite-in      초대 링크 — 이미 로그인한 사람 (수락만)
 *   invite-member  초대 링크 — 이미 그 매장 구성원
 *   invite-expired 초대 링크 — 만료 · 이미 쓰임 · 취소
 */
(function () {
  const STATES = [
    ['login', '로그인'], ['signup', '가입'], ['error', '실패'], ['locked', '잠김'],
    ['invite', '초대'], ['invite-in', '초대·로그인됨'], ['invite-member', '초대·이미 구성원'], ['invite-expired', '초대·만료'],
  ];
  const INVITE = { store: '모래내 베이커리 & 델리', owner: '한도윤', role: '직원', expires: '11월 12일(목)까지' };
  const ME = { name: '서지우', email: 'jiwoo@example.com' };

  const state = (ZW.params.get('state') || 'login');
  const variant = (ZW.params.get('v') || 'A').toUpperCase();

  // 앱 이름 + 한 줄 (공용)
  const brand = (small) => `<div class="brand${small ? ' sm' : ''}">
      <span class="logo" aria-hidden="true">${ZW_LEAF}</span>
      <span><b>ZeroWaste</b> <span class="muted">F&amp;B</span></span>
    </div>`;
  const ZW_LEAF = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/></svg>';

  const field = (id, label, type, opts = {}) => `
    <label class="fld" for="${id}">
      <span class="lab">${label}${opts.hint ? ` <span class="muted small">${opts.hint}</span>` : ''}</span>
      <span class="inp${opts.err ? ' bad' : ''}">
        <input id="${id}" type="${type}" autocomplete="${opts.ac || 'off'}" value="${opts.value || ''}" ${opts.readonly ? 'readonly' : ''} placeholder="${opts.ph || ''}">
        ${type === 'password' ? '<button type="button" class="eye" data-eye aria-label="비밀번호 보기">보기</button>' : ''}
      </span>
      ${opts.err ? `<span class="field-err">${opts.err}</span>` : ''}
    </label>`;

  // 로그인 · 가입 탭 (시안 A) — 초대 상태에서는 쓰지 않는다
  const tabs = (cur) => `<div class="seg" role="tablist">
      <button type="button" role="tab" aria-pressed="${cur === 'login'}" data-go="login">로그인</button>
      <button type="button" role="tab" aria-pressed="${cur === 'signup'}" data-go="signup">가입</button>
    </div>`;

  function loginForm(s) {
    const err = s === 'error', locked = s === 'locked';
    return `
      ${err ? `<div class="banner err" role="alert"><b>이메일 또는 비밀번호가 올바르지 않습니다</b>5회 연속 실패하면 15분 동안 로그인이 제한됩니다.</div>` : ''}
      ${locked ? `<div class="banner warn" role="alert"><b>로그인이 잠시 제한되었습니다</b>5회 연속 실패했습니다. <span class="num">14분</span> 후에 다시 시도해 주세요.</div>` : ''}
      ${field('email', '이메일', 'email', { ac: 'username', value: err || locked ? 'owner@example.com' : '', ph: 'name@example.com' })}
      ${field('pw', '비밀번호', 'password', { ac: 'current-password', value: err ? '••••••••' : '' })}
      <div class="row-between"><label class="check"><input type="checkbox" checked> 로그인 유지</label>
        <button type="button" class="link" data-forgot>비밀번호를 잊었어요</button></div>
      <button class="primary" type="submit" ${locked ? 'disabled' : ''}>로그인</button>`;
  }
  function signupForm(opts = {}) {
    return `
      ${field('name', '이름', 'text', { ac: 'name', ph: '가게에서 부르는 이름', hint: '동료에게 보여요' })}
      ${field('email', '이메일', 'email', { ac: 'username', ph: 'name@example.com', hint: '로그인에 사용해요' })}
      ${field('pw', '비밀번호', 'password', { ac: 'new-password', hint: '8자 이상' })}
      <label class="check"><input type="checkbox"> <span><button type="button" class="link">이용 약관</button> · <button type="button" class="link">개인정보 처리</button>에 동의해요</span></label>
      <button class="primary" type="submit">${opts.cta || '가입하기'}</button>`;
  }

  // 초대 카드: 어느 매장에 누가 불렀는지 먼저 보여 준다
  const inviteHead = (sub) => `<div class="invite">
      <div class="small muted">${INVITE.owner} 님이 초대했어요</div>
      <div class="inv-store">${INVITE.store.replace('&', '&amp;')}</div>
      <div class="inv-meta"><span class="pill">${INVITE.role}</span><span class="small muted">${sub || '초대 링크 ' + INVITE.expires}</span></div>
    </div>`;
  const staffNote = `<ul class="can small muted">
      <li>직원은 <b>마감 · 입고 · 재료 폐기</b>를 입력해요</li>
      <li>원가 · 손실 금액은 사장님에게만 보여요</li>
    </ul>`;

  // 화면 본문 (시안 A · B 공통 조각을 조합). B = 이메일 먼저
  function body(s, v) {
    if (s === 'invite') return `${inviteHead()}${staffNote}
        <div class="sub-h">가입하고 들어가기</div>${signupForm({ cta: '가입하고 들어가기' })}
        <div class="alt small">이미 계정이 있어요 <button type="button" class="link" data-go="invite-in">로그인하고 들어가기</button></div>`;
    if (s === 'invite-in') return `${inviteHead()}${staffNote}
        <div class="who"><span class="avatar">${ME.name[0]}</span><span><b>${ME.name}</b><br><span class="small muted">${ME.email}</span></span></div>
        <button class="primary" type="button" data-accept>${INVITE.store.split(' ')[0]} 직원으로 들어가기</button>
        <div class="alt small">내 계정이 아니에요 <button type="button" class="link">로그아웃하고 다른 계정으로</button></div>`;
    if (s === 'invite-member') return `${inviteHead('이미 이 매장 직원이에요')}
        <div class="banner info" style="margin:0 0 12px"><b>이미 초대되었어요</b>바로 매장으로 갈 수 있어요.</div>
        <button class="primary" type="button">매장으로 가기</button>`;
    if (s === 'invite-expired') return `<div class="empty" style="padding:24px 0 8px"><div class="big" aria-hidden="true">⏳</div>
        <h2 style="margin:8px 0 4px;font-size:18px;color:var(--text)">이 초대 링크는 만료되었어요</h2>
        <p class="small" style="margin:0">기한이 지났거나, 이미 사용되었거나, 사장님이 취소했어요.<br>사장님께 새 링크를 받아 주세요.</p></div>
        <button class="ghost" type="button" style="width:100%;padding:12px" data-go="login">로그인 화면으로</button>`;

    if (v === 'B') {
      // 이메일 먼저: 한 칸씩. 계정이 있는지는 다음 칸에서야 갈린다
      if (s === 'signup') return `<h2 class="h">처음이시네요</h2><p class="small muted lead">owner@example.com 으로 가입해요 <button type="button" class="link" data-go="login">바꾸기</button></p>${signupForm()}`;
      if (s === 'login' ) return `<h2 class="h">시작하기</h2><p class="small muted lead">이메일을 넣으면 로그인 · 가입 중 맞는 쪽으로 가요</p>
        ${field('email', '이메일', 'email', { ac: 'username', ph: 'name@example.com' })}
        <button class="primary" type="button" data-next>계속</button>
        <div class="or"><span>또는</span></div><button class="ghost demo" type="button">데모 매장 둘러보기</button>`;
      return `<h2 class="h">비밀번호</h2><p class="small muted lead">owner@example.com <button type="button" class="link" data-go="login">바꾸기</button></p>${loginForm(s)}`;
    }
    const cur = s === 'signup' ? 'signup' : 'login';
    return `${tabs(cur)}<div class="formgap"></div>${cur === 'signup' ? signupForm() : loginForm(s)}
      <div class="or"><span>또는</span></div><button class="ghost demo" type="button">데모 매장 둘러보기</button>`;
  }

  // 동작: 탭 · 상태 이동은 주소만 바꿔 다시 연다(file:// 에서도 된다)
  function wire(root) {
    const go = (s) => { const p = new URLSearchParams(location.search); p.set('state', s); location.search = p.toString(); };
    root.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
    root.querySelectorAll('[data-eye]').forEach((b) => b.onclick = () => {
      const i = b.previousElementSibling; const on = i.type === 'password';
      i.type = on ? 'text' : 'password'; b.textContent = on ? '숨기기' : '보기';
    });
    root.querySelectorAll('[data-forgot]').forEach((b) => b.onclick = () => ZW.toast('비밀번호 찾기는 메일 발송이 생기면 열어요 (DESIGN 9.4)'));
    root.querySelectorAll('[data-next]').forEach((b) => b.onclick = () => go('signup'));
    root.querySelectorAll('[data-accept]').forEach((b) => b.onclick = () => ZW.toast('들어갔어요 → 마감 화면'));
    root.querySelectorAll('.demo').forEach((b) => b.onclick = () => ZW.toast('데모 매장(읽기 전용)으로 → 오늘'));
    const f = root.querySelector('form');
    if (f) f.onsubmit = (e) => {
      e.preventDefault();
      const email = f.querySelector('#email'), pw = f.querySelector('#pw');
      if (email && !/^\S+@\S+\.\S+$/.test(email.value)) return ZW.toast('이메일 모양이 아니에요');
      if (pw && pw.value.length < 8) return ZW.toast('비밀번호는 8자 이상이에요');
      ZW.toast(state === 'signup' || state === 'invite' ? '가입했어요 → 첫 매장 등록' : '로그인했어요 → 오늘');
    };
  }

  window.AUTH = { STATES, state, variant, brand, body, wire, INVITE };
})();
