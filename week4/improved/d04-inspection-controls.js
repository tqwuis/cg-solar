/* 샌드박스 카메라: world up은 +Y, 회전 중심은 eye, yaw/pitch로 시선을 정합니다. */
window.InspectionControls = function(canvas, bounds) {
  'use strict';
  // eye/yaw/pitch/fov는 자유이동 전용으로 보관하여 직교뷰 이동으로 덮어쓰지 않습니다.
  const state = {mode:'free', eye:[0,0,0], yaw:0, pitch:0, fov:60, speed:8, sensitivity:.0025, actions:0};
  const pitchLimit = 89 * Math.PI / 180;
  const keys = new Set();
  const moveKeys = new Set(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight']);
  let drag = null;
  const locked = () => document.pointerLockElement === canvas;
  const active = () => locked() || document.activeElement === canvas;
  const horizontalForward = () => [Math.sin(state.yaw), 0, -Math.cos(state.yaw)];
  const forward = () => [Math.sin(state.yaw) * Math.cos(state.pitch),
    Math.sin(state.pitch), -Math.cos(state.yaw) * Math.cos(state.pitch)];
  const center = bounds.min.map((v,i) => (v + bounds.max[i]) / 2);
  const radius = Math.hypot(...bounds.min.map((v,i) => (bounds.max[i] - v) / 2));
  const views = {front:null, side:null};
  const viewNames = {free:'자유 이동', front:'전면 직교', side:'오른쪽 측면 직교'};
  const viewRight = () => state.mode === 'front' ? [1,0,0] : [0,0,-1];
  function resetView() {
    const rect = canvas.getBoundingClientRect();
    const aspect = Math.max(1,rect.width) / Math.max(1,rect.height);
    const axis = state.mode === 'front' ? 0 : 2;
    views[state.mode] = {target:[...center], halfHeight:1.1 * Math.max(
      (bounds.max[1]-bounds.min[1])/2, (bounds.max[axis]-bounds.min[axis])/2/aspect)};
  }
  function viewChanged() {
    canvas.dispatchEvent(new CustomEvent('viewchange', {detail:{mode:state.mode}}));
  }
  function setMode(mode) {
    if (!['free','front','side'].includes(mode) || mode === state.mode) return;
    clearInput();
    state.mode = mode;
    if (mode !== 'free' && !views[mode]) resetView();
    if (locked()) document.exitPointerLock();
    state.actions++;
    canvas.focus({preventScroll:true});
    viewChanged();
    notify(instructions());
  }
  function instructions() {
    return state.mode === 'free'
      ? '자유 이동 · 화면을 드래그해 회전하거나 탐색 시작으로 마우스를 잠그세요.'
      : viewNames[state.mode] + ' · W/S 위아래, A/D 좌우, 드래그 평행 이동 · 휠로 확대/축소';
  }
  function setHalfHeight(value) {
    if (state.mode === 'free' || !Number.isFinite(value)) return;
    views[state.mode].halfHeight = Math.max(.2,Math.min(100,value));
    viewChanged();
  }
  function stopDrag() {
    const previous = drag;
    drag = null;
    if (previous && canvas.hasPointerCapture(previous.id)) canvas.releasePointerCapture(previous.id);
  }
  function clearInput() { keys.clear(); stopDrag(); }
  function home() {
    clearInput();
    if (state.mode !== 'free') { resetView(); viewChanged(); return; }
    state.fov = 60;
    state.yaw = -.6;
    state.pitch = 0;
    // 경계 상자를 감싸는 구가 가로·세로 화각 안에 들어오도록 배치합니다.
    const rect = canvas.getBoundingClientRect();
    const aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
    const halfY = state.fov * Math.PI / 360;
    const halfX = Math.atan(Math.tan(halfY) * aspect);
    const distance = 1.1 * radius / Math.sin(Math.min(halfX, halfY));
    const f = forward();
    state.eye = center.map((v,i) => v - f[i] * distance);
  }
  function camera() {
    if (state.mode !== 'free') {
      const v = views[state.mode], offset = state.mode === 'front' ? [0,0,1] : [1,0,0];
      return {eye:v.target.map((n,i)=>n+offset[i]*(2*radius+1)), target:[...v.target],
        up:[0,1,0], orthographic:true, halfHeight:v.halfHeight, near:.02, far:4*radius+10};
    }
    const f = forward();
    return {eye:[...state.eye], target:state.eye.map((v,i) => v + f[i]), up:[0,1,0],
      fov:state.fov, near:.02,
      far:Math.max(180, Math.hypot(...state.eye.map((v,i) => v - center[i])) + radius + 10)};
  }
  function turn(dx, dy) {
    state.yaw += dx * state.sensitivity;
    state.yaw = Math.atan2(Math.sin(state.yaw), Math.cos(state.yaw));
    // 위쪽 마우스 이동은 음수 dy입니다. 수직 시선과 up이 평행해지는 특이점을 피합니다.
    state.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, state.pitch - dy * state.sensitivity));
  }
  function pan(dx, dy) {
    const v = views[state.mode], right = viewRight();
    const unit = 2*v.halfHeight / Math.max(1,canvas.getBoundingClientRect().height);
    v.target = v.target.map((n,i)=>n-dx*unit*right[i]+(i===1?dy*unit:0));
  }
  function update(dt) {
    if (!active() || document.hidden) { clearInput(); return; }
    const longitudinal = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
    const lateral = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    const vertical = Number(keys.has('Space')) - Number(keys.has('ShiftLeft') || keys.has('ShiftRight'));
    if (state.mode !== 'free') {
      const upward = Math.max(-1,Math.min(1,longitudinal+vertical));
      const length = Math.hypot(lateral,upward);
      if (!length) return;
      const step = state.speed*Math.min(Math.max(dt,0),.05)/length, right = viewRight();
      const v = views[state.mode];
      v.target = v.target.map((n,i)=>n+step*(lateral*right[i]+(i===1?upward:0)));
      return;
    }
    const length = Math.hypot(longitudinal, lateral, vertical);
    if (!length) return;
    // 대각선 속도 보정 및 탭 복귀/긴 프레임에서 순간 이동 방지.
    const step = state.speed * Math.min(Math.max(dt, 0), .05) / length;
    const f = horizontalForward(), right = [Math.cos(state.yaw), 0, Math.sin(state.yaw)];
    state.eye = state.eye.map((v,i) => v + step *
      (longitudinal * f[i] + lateral * right[i] + (i === 1 ? vertical : 0)));
  }
  function notify(message) {
    canvas.dispatchEvent(new CustomEvent('navigationchange', {detail:{locked:locked(), message}}));
  }
  function lockFailed() { notify('마우스 잠금을 사용할 수 없습니다. 화면을 드래그해 상하좌우로 회전하세요.'); }
  function start() {
    canvas.focus({preventScroll:true});
    if (state.mode !== 'free') { notify(instructions()); return; }
    if (locked()) return;
    if (!canvas.requestPointerLock) { lockFailed(); return; }
    try {
      const request = canvas.requestPointerLock();
      if (request && request.catch) request.catch(lockFailed);
    } catch (_) { lockFailed(); }
  }
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', e => {
    if (locked() || drag || e.button !== 0) return;
    canvas.focus({preventScroll:true});
    drag = {id:e.pointerId, x:e.clientX, y:e.clientY};
    canvas.setPointerCapture(e.pointerId);
    state.actions++;
  });
  canvas.addEventListener('pointermove', e => {
    if (locked() || !drag || drag.id !== e.pointerId) return;
    if (state.mode === 'free') turn(e.clientX - drag.x, e.clientY - drag.y);
    else pan(e.clientX - drag.x, e.clientY - drag.y);
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) {
    canvas.addEventListener(event, e => { if (drag && drag.id === e.pointerId) stopDrag(); });
  }
  canvas.addEventListener('wheel', e => {
    if (state.mode === 'free') return;
    e.preventDefault();
    const pixels = e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);
    setHalfHeight(views[state.mode].halfHeight*Math.exp(Math.max(-1,Math.min(1,pixels*.001))));
    state.actions++;
  }, {passive:false});
  document.addEventListener('mousemove', e => { if (locked() && state.mode === 'free') turn(e.movementX, e.movementY); });
  document.addEventListener('pointerlockchange', () => {
    clearInput();
    if (locked() && state.mode !== 'free') { document.exitPointerLock(); return; }
    if (locked()) canvas.focus({preventScroll:true});
    notify(locked() ? '탐색 중 · Esc를 누르면 마우스가 해제됩니다.' : instructions());
  });
  document.addEventListener('pointerlockerror', lockFailed);
  document.addEventListener('keydown', e => {
    if (!active() || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.code === 'Escape') { clearInput(); if (locked()) document.exitPointerLock(); return; }
    if (e.code === 'Home') { e.preventDefault(); if (!e.repeat) { home(); state.actions++; } return; }
    if (!moveKeys.has(e.code)) return;
    e.preventDefault();
    if (!keys.has(e.code)) state.actions++;
    keys.add(e.code);
  });
  document.addEventListener('keyup', e => {
    keys.delete(e.code);
    if (active() && moveKeys.has(e.code)) e.preventDefault();
  });
  canvas.addEventListener('blur', clearInput);
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', clearInput);
  home();
  return {state, home, camera, update, start, setMode, setHalfHeight};
};
