/* 관찰 작업에 맞춘 UI. 답을 별도로 표시하지 않고 실제 명판을 선택합니다. */
(()=>{
  'use strict';
  const viewer=window.InspectionViewer;if(!viewer)return;
  const {canvas,controls,model}=viewer;
  const pins=new Map(),cards=new Map();
  for(const sign of model.signs){
    const button=document.createElement('button');button.type='button';button.className='sign-pin';
    button.textContent=sign.id;button.hidden=true;button.setAttribute('aria-label',sign.id+' 명판으로 이동');
    button.addEventListener('click',()=>{viewer.focusVisible(sign.id);canvas.focus({preventScroll:true});});
    document.querySelector('#sign-pins').appendChild(button);pins.set(sign.id,button);
  }
  for(const poi of model.poi){
    const card=document.createElement('button');card.type='button';card.className='task-card';card.dataset.sign=poi.id;
    card.innerHTML=`<span class="task-id">${poi.id}</span><span class="task-copy"><strong>${poi.name}</strong><small>${poi.task}</small><span class="task-state">화면에서 찾기</span></span><span class="task-arrow" aria-hidden="true">↗</span>`;
    card.addEventListener('click',()=>{viewer.focusVisible(poi.id);canvas.focus({preventScroll:true});});
    document.querySelector('#poi-tasks').appendChild(card);cards.set(poi.id,card);
  }
  for(const task of model.comparisons){
    const card=document.createElement('button');card.type='button';card.className='task-card comparison-card';
    card.innerHTML=`<span class="task-id">${task.id}</span><span class="task-copy"><strong>${task.name}</strong><small>${task.task}</small><span class="task-state">${task.id==='O1'?'전면':'측면'} 직교로 비교하기</span></span><span class="task-arrow" aria-hidden="true">↗</span>`;
    card.addEventListener('click',()=>controls.focusComparison(task));
    document.querySelector('#comparison-tasks').appendChild(card);
  }
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>controls.setMode(button.dataset.view));
  document.querySelector('#zoom-in').addEventListener('click',()=>controls.zoom(1/1.2));
  document.querySelector('#zoom-out').addEventListener('click',()=>controls.zoom(1.2));
  document.querySelector('#transparency').addEventListener('click',()=>{viewer.toggleTransparency();canvas.focus({preventScroll:true});});
  const names={orbit:'원근 관찰 · 수평 회전',front:'전면 직교 · −Z 방향',side:'오른쪽 측면 직교 · −X 방향'};
  let nextUpdate=0,dirty=true;
  function sync() {
    dirty=true;
    const {mode}=controls.state,transparent=viewer.transparent,selected=model.signs.find(s=>s.id===viewer.selectedId);
    for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===mode));
    document.querySelector('#view-label').textContent=names[mode];
    document.querySelector('#ghost-badge').hidden=!transparent;
    document.querySelector('#transparency').setAttribute('aria-pressed',String(transparent));
    document.querySelector('#transparency-description').textContent=transparent?'켜짐 · 구조물 뒤의 명판도 선택 가능':'꺼짐 · 가려진 명판 찾기';
    document.querySelector('#selection-card').hidden=!selected;
    document.querySelector('#selection-name').textContent=selected?selected.id+' · '+(selected.name||'비교 장치 명판'):'';
    document.querySelector('#inspection-status').textContent=selected
      ? selected.id+(controls.transitioning?' 정면으로 이동 중입니다. 드래그나 휠로 멈출 수 있습니다.':' 정면으로 이동했습니다. 명판에서 내용을 확인하세요.')
      :transparent?'명판은 선명하게 유지됩니다. 번호나 명판을 클릭하세요.':'보이는 명판을 클릭하세요. 가려진 명판은 Space로 찾을 수 있습니다.';
    document.querySelector('#instructions').innerHTML=mode==='orbit'
      ? '드래그: 좌우 회전 · Shift / 오른쪽 드래그: 평행 이동 · 휠: 거리 조절<br>명판 또는 표시된 번호 클릭: 정면으로 접근 · <kbd>Space</kbd> 구조물 반투명'
      : '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / 드래그: 화면 평행 이동 · 휠: 확대/축소<br><kbd>Home</kbd> 현재 뷰 전체 보기 · <kbd>Space</kbd> 구조물 반투명 · 원근 관찰로 이전 시점 복귀';
    document.querySelector('#view-hint').textContent=mode==='orbit'
      ? '상하 회전은 고정됩니다. 높이는 Shift 드래그로 맞추세요.'
      : '명판을 선택하면 원근 정면 관찰로 이동합니다. 구조 비교는 O1 / O2를 누르세요.';
    for(const [id,card] of cards)card.classList.toggle('selected',id===viewer.selectedId);
    for(const [id,pin] of pins)pin.classList.toggle('selected',id===viewer.selectedId);
  }
  canvas.addEventListener('inspectionchange',sync);
  viewer.onFrame=time=>{
    if(!dirty&&time<nextUpdate)return;
    dirty=false;nextUpdate=time+.15;
    const rect=canvas.getBoundingClientRect(),camera=controls.camera(),occupied=[];let count=0;
    for(const sign of model.signs){
      const point=viewer.visibleSign(sign.id),pin=pins.get(sign.id),card=cards.get(sign.id);
      pin.hidden=!point||sign.id===viewer.selectedId;
      if(point&&!pin.hidden){
        const top=window.InspectionPicking.project(camera,rect,[sign.position[0],sign.position[1]+sign.size[1]/2,sign.position[2]])||point;
        const x=Math.max(28,Math.min(rect.width-28,top.x-rect.left));
        let y=Math.max(28,top.y-rect.top-8);
        while(y>54&&occupied.some(p=>Math.abs(p.x-x)<56&&Math.abs(p.y-y)<25))y-=27;
        occupied.push({x,y});pin.style.left=x+'px';pin.style.top=y+'px';
      }
      if(card){
        card.disabled=!point;
        const projected=window.InspectionPicking.project(controls.camera(),rect,sign.position);
        card.querySelector('.task-state').textContent=sign.id===viewer.selectedId?'현재 관찰 중':point?'선택해서 가까이 보기':projected?'구조물에 가려짐 · Space로 찾기':'화면 밖 · 회전 / 전체 보기';
        if(point)count++;
      }
    }
    document.querySelector('#visible-count').textContent=count+' / 6 선택 가능';
  };
  let pointerDown=false;
  canvas.addEventListener('pointerdown',()=>{pointerDown=true;canvas.style.cursor='grabbing';});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{pointerDown=false;canvas.style.cursor='grab';});
  canvas.addEventListener('pointermove',e=>{if(!pointerDown)canvas.style.cursor=viewer.pickSign(e.clientX,e.clientY)?'pointer':'grab';});
  sync();
})();
