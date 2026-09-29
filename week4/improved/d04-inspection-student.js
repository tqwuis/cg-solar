/* 기존 학생 확장 지점에 카메라 설정 UI를 연결합니다. */
(() => {
  'use strict';
  const viewer = window.InspectionViewer;
  if (!viewer) return;
  const {controls, canvas} = viewer;
  const host = document.querySelector('#student-ui');
  host.innerHTML = `
    <h2>카메라 설정</h2>
    <button class="btn primary" id="navigate" type="button">탐색 시작 · 마우스 잠금</button>
    <p id="navigation-status" class="note" role="status">화면을 클릭하면 키보드 이동이 활성화됩니다. 드래그로 상하좌우 회전할 수 있습니다.</p>
    <div class="ctl"><label for="move-speed">이동 속도 <output id="speed-value" for="move-speed"></output></label>
      <input id="move-speed" type="range" min="0.2" max="12" step="0.2" value="4">
      <div class="hint">작은 명판에 접근할 때 속도를 낮추세요.</div></div>
    <div class="ctl"><label for="camera-fov">수직 FOV <output id="fov-value" for="camera-fov"></output></label>
      <input id="camera-fov" type="range" min="30" max="90" step="1" value="60">
      <div class="hint">작을수록 좁고 크게 보입니다. 카메라 위치는 유지됩니다.</div></div>
    <div class="ctl"><label for="mouse-sensitivity">마우스 감도 <output id="sensitivity-value" for="mouse-sensitivity"></output></label>
      <input id="mouse-sensitivity" type="range" min="0.5" max="5" step="0.1" value="2.5"></div>
    <p class="note">회전 중심은 현재 카메라 위치입니다. 마우스로 상하좌우를 바라보며, 상하 회전은 ±89°로 제한됩니다. WASD는 수평 이동, Space / Shift는 높이 조절입니다. 벽과 바닥을 통과할 수 있습니다.</p>`;
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
    document.querySelector('.viewport').classList.toggle('navigating', e.detail.locked);
  });
  document.querySelector('#home').addEventListener('click', sync);
  document.addEventListener('keydown', e => { if (e.code === 'Home') sync(); });
  sync();
})();
