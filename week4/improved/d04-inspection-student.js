/* 기존 학생 확장 지점에 카메라 설정 UI를 연결합니다. */
(() => {
  'use strict';
  const viewer = window.InspectionViewer;
  if (!viewer) return;
  const {controls, canvas} = viewer;
  const host = document.querySelector('#student-ui');
  host.innerHTML = `
    <h2>카메라 설정</h2>
    <div class="view-modes" role="group" aria-label="카메라 뷰 전환">
      <button class="btn" type="button" data-view="free" aria-pressed="true">자유 이동</button>
      <button class="btn" type="button" data-view="front" aria-pressed="false">전면 직교</button>
      <button class="btn" type="button" data-view="side" aria-pressed="false">측면 직교</button>
    </div>
    <button class="btn primary" id="navigate" type="button">탐색 시작 · 마우스 잠금</button>
    <p id="navigation-status" class="note" role="status">화면을 클릭하면 키보드 이동이 활성화됩니다. 드래그로 상하좌우 회전할 수 있습니다.</p>
    <div class="ctl"><label for="move-speed">이동 속도 <output id="speed-value" for="move-speed"></output></label>
      <input id="move-speed" type="range" min="0.2" max="12" step="0.2" value="4">
      <div class="hint">작은 명판에 접근할 때 속도를 낮추세요.</div></div>
    <div class="ctl free-only"><label for="camera-fov">수직 FOV <output id="fov-value" for="camera-fov"></output></label>
      <input id="camera-fov" type="range" min="30" max="90" step="1" value="60">
      <div class="hint">작을수록 좁고 크게 보입니다. 카메라 위치는 유지됩니다.</div></div>
    <div class="ctl free-only"><label for="mouse-sensitivity">마우스 감도 <output id="sensitivity-value" for="mouse-sensitivity"></output></label>
      <input id="mouse-sensitivity" type="range" min="0.5" max="5" step="0.1" value="2.5"></div>
    <div id="ortho-controls" hidden>
      <p>화면의 세로 범위: <output id="ortho-height"></output></p>
      <div class="actions"><button class="btn" id="zoom-in" type="button">확대 +</button><button class="btn" id="zoom-out" type="button">축소 −</button></div>
    </div>
    <p class="note" id="mode-note"></p>`;
  const freeInstructions = document.querySelector('#instructions').innerHTML;
  function syncMode() {
    const mode = controls.state.mode, free = mode === 'free';
    for (const button of host.querySelectorAll('[data-view]')) button.setAttribute('aria-pressed',String(button.dataset.view===mode));
    for (const item of host.querySelectorAll('.free-only')) item.hidden = !free;
    document.querySelector('#navigate').hidden = !free;
    document.querySelector('#ortho-controls').hidden = free;
    if (!free) document.querySelector('#ortho-height').textContent = (2*controls.camera().halfHeight).toFixed(2)+' m';
    document.querySelector('.view-badge').textContent = free ? '자유 이동 · Y축 고정' : mode==='front' ? '전면 직교 · −Z 방향' : '오른쪽 측면 직교 · −X 방향';
    document.querySelector('#mode-note').textContent = free
      ? '마우스로 상하좌우를 바라봅니다(±89°). WASD는 수평 이동, Space / Shift는 높이 조절입니다. 직교뷰에서 돌아오면 이전 위치·시선·FOV를 복원합니다.'
      : 'W/S는 화면 위아래, A/D는 화면 좌우로 카메라를 이동합니다. 드래그하면 장면이 손을 따라 움직입니다. Home은 현재 직교뷰만 전체 보기로 되돌립니다.';
    document.querySelector('#instructions').innerHTML = free ? freeInstructions
      : '<kbd>W</kbd> 위 · <kbd>S</kbd> 아래 · <kbd>A</kbd> 왼쪽 · <kbd>D</kbd> 오른쪽 (화면 기준 이동)<br>드래그: 평행 이동 · 휠: 확대/축소 · <kbd>Home</kbd> 현재 직교뷰 전체 보기<br>자유 이동 버튼을 누르면 전환 전 카메라 위치와 시선으로 돌아갑니다.';
    document.querySelector('.viewport').classList.toggle('navigating',free && document.pointerLockElement===canvas);
  }
  for (const button of host.querySelectorAll('[data-view]')) button.addEventListener('click',()=>controls.setMode(button.dataset.view));
  for (const [id,factor] of [['zoom-in',1/1.2],['zoom-out',1.2]]) document.getElementById(id).addEventListener('click',()=>{
    controls.setHalfHeight(controls.camera().halfHeight*factor);
    controls.state.actions++;
  });
  canvas.addEventListener('viewchange',syncMode);
  const bindings = [
    ['move-speed','speed-value','speed',1,v => v.toFixed(1) + ' m/s'],
    ['camera-fov','fov-value','fov',1,v => v + '°'],
    ['mouse-sensitivity','sensitivity-value','sensitivity',.001,v => (v * 180 / Math.PI).toFixed(2) + ' °/px']
  ];
  function sync() {
    for (const [id, output, key, scale, format] of bindings) {
      document.getElementById(id).value = controls.state[key] / scale;
      document.getElementById(output).textContent = format(controls.state[key]);
    }
  }
  for (const [id,,key,scale] of bindings) {
    document.getElementById(id).addEventListener('input', e => {
      controls.state[key] = Number(e.target.value) * scale;
      sync();
    });
  }
  document.querySelector('#navigate').addEventListener('click', controls.start);
  canvas.addEventListener('navigationchange', e => {
    document.querySelector('#navigation-status').textContent = e.detail.message;
    document.querySelector('#navigate').textContent = e.detail.locked ? '탐색 중 · Esc로 해제' : '탐색 시작 · 마우스 잠금';
    document.querySelector('.viewport').classList.toggle('navigating', e.detail.locked && controls.state.mode==='free');
  });
  document.querySelector('#home').addEventListener('click', sync);
  document.addEventListener('keydown', e => { if (e.code === 'Home') sync(); });
  sync();
  syncMode();
})();
