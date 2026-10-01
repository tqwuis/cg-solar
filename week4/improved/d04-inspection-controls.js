/* baseline의 orbit/pan/dolly 조작 + 수평 회전. Old의 독립적인 직교뷰 상태를 재사용합니다. */
window.InspectionControls = function(canvas, bounds) {
  'use strict';
  const state = {mode:'orbit', target:[3,3,0], distance:30, yaw:.6, fov:45, actions:0};
  const center = bounds.min.map((n,i)=>(n+bounds.max[i])/2);
  const radius = Math.hypot(...bounds.min.map((n,i)=>(bounds.max[i]-n)/2));
  const views = {front:null, side:null}, keys = new Set();
  let drag = null, transition = null;
  const focusDuration = .85;
  const emit = (type,detail={})=>canvas.dispatchEvent(new CustomEvent(type,{detail}));
  const changed = (reason='move')=>emit('camerachange',{reason});
  const aspect = ()=>{const r=canvas.getBoundingClientRect();return Math.max(1,r.width)/Math.max(1,r.height);};
  const orthoRight = ()=>state.mode==='front'?[1,0,0]:[0,0,-1];
  function stopDrag() {
    const previous=drag;drag=null;
    if(previous && canvas.hasPointerCapture(previous.id))canvas.releasePointerCapture(previous.id);
  }
  function clearInput(){keys.clear();stopDrag();}
  function resetView() {
    const axis=state.mode==='front'?0:2;
    views[state.mode]={target:[...center],halfHeight:1.1*Math.max(
      (bounds.max[1]-bounds.min[1])/2,(bounds.max[axis]-bounds.min[axis])/2/aspect())};
  }
  function setMode(mode) {
    if(!['orbit','front','side'].includes(mode)||mode===state.mode)return;
    transition=null;clearInput();state.mode=mode;
    if(mode!=='orbit'&&!views[mode])resetView();
    state.actions++;changed('mode');canvas.focus({preventScroll:true});
  }
  function home() {
    transition=null;clearInput();
    if(state.mode==='orbit') {
      state.target=[...center];state.yaw=.6;state.fov=45;
      const halfY=state.fov*Math.PI/360,halfX=Math.atan(Math.tan(halfY)*aspect());
      state.distance=1.08*radius/Math.sin(Math.min(halfX,halfY));
    } else resetView();
    changed('home');
  }
  function camera() {
    if(state.mode!=='orbit') {
      const v=views[state.mode],offset=state.mode==='front'?[0,0,1]:[1,0,0];
      return {eye:v.target.map((n,i)=>n+offset[i]*(radius*2+1)),target:[...v.target],
        up:[0,1,0],orthographic:true,halfHeight:v.halfHeight,near:.02,far:radius*4+10};
    }
    return {eye:[state.target[0]+Math.sin(state.yaw)*state.distance,state.target[1],
      state.target[2]+Math.cos(state.yaw)*state.distance],target:[...state.target],up:[0,1,0],
      fov:state.fov,near:.02,far:Math.max(180,state.distance+radius*2+10)};
  }
  function zoom(factor) {
    if(!Number.isFinite(factor)||factor<=0)return;
    transition=null;
    if(state.mode==='orbit')state.distance=Math.max(.12,Math.min(180,state.distance*factor));
    else views[state.mode].halfHeight=Math.max(.2,Math.min(100,views[state.mode].halfHeight*factor));
    state.actions++;changed();
  }
  function pan(dx,dy) {
    if(!dx&&!dy)return;
    transition=null;
    const h=Math.max(1,canvas.getBoundingClientRect().height);
    const unit=state.mode==='orbit'?2*state.distance*Math.tan(state.fov*Math.PI/360)/h:2*views[state.mode].halfHeight/h;
    const right=state.mode==='orbit'?[Math.cos(state.yaw),0,-Math.sin(state.yaw)]:orthoRight();
    const owner=state.mode==='orbit'?state:views[state.mode];
    owner.target=owner.target.map((n,i)=>n-dx*unit*right[i]+(i===1?dy*unit:0));
    changed();
  }
  function turn(dx) {
    if(!dx)return;
    transition=null;
    state.yaw-=dx*.006;
    state.yaw=Math.atan2(Math.sin(state.yaw),Math.cos(state.yaw));
    changed();
  }
  // 명판의 정면 법선 방향에서 접근하고 중심과 높이를 맞춥니다.
  function focusSign(sign) {
    const start=camera(),fov=transition?.to.fov??state.fov;
    clearInput();
    if(start.orthographic){
      // 저장된 원근 시점으로 뛰지 않고 현재 직교 시점에서 출발합니다.
      state.target=[...start.target];state.distance=Math.hypot(...start.eye.map((n,i)=>n-start.target[i]));
      state.yaw=Math.atan2(start.eye[0]-start.target[0],start.eye[2]-start.target[2]);
      state.fov=2*Math.atan(start.halfHeight/state.distance)*180/Math.PI;
    }
    state.mode='orbit';
    const tan=Math.tan(fov*Math.PI/360);
    const to={target:[...sign.position],yaw:sign.yaw,fov,
      distance:Math.max(.4,1.8*Math.max(sign.size[1]/(2*tan),sign.size[0]/(2*tan*aspect())))};
    transition={elapsed:0,from:{target:[...state.target],distance:state.distance,yaw:state.yaw,fov:state.fov},to,
      yawDelta:Math.atan2(Math.sin(to.yaw-state.yaw),Math.cos(to.yaw-state.yaw))};
    state.actions++;changed('focus');
  }
  function advanceFocus(dt) {
    if(!transition)return;
    const t=transition;
    t.elapsed=Math.min(focusDuration,t.elapsed+Math.max(dt,0));
    const p=t.elapsed/focusDuration,ease=p*p*p*(10+p*(-15+6*p));
    const mix=(a,b)=>a+(b-a)*ease;
    state.target=t.from.target.map((n,i)=>mix(n,t.to.target[i]));
    state.distance=mix(t.from.distance,t.to.distance);state.fov=mix(t.from.fov,t.to.fov);
    state.yaw=t.from.yaw+t.yawDelta*ease;
    if(p===1){Object.assign(state,t.to);transition=null;}
    // 자동 접근 중에는 선택 외곽선을 유지합니다.
    changed('focus');
  }
  function focusComparison(comparison) {
    transition=null;clearInput();state.mode=comparison.id==='O1'?'front':'side';
    const members=window.InspectionModel.boxes.filter(p=>comparison.members.includes(p.id));
    const axis=state.mode==='front'?0:2;
    const lo=i=>Math.min(...members.map(p=>p.position[i]-p.size[i]/2));
    const hi=i=>Math.max(...members.map(p=>p.position[i]+p.size[i]/2));
    views[state.mode]={target:[...comparison.position],halfHeight:1.4*Math.max((hi(1)-lo(1))/2,(hi(axis)-lo(axis))/2/aspect())};
    views[state.mode].target[axis]=(lo(axis)+hi(axis))/2;
    views[state.mode].target[1]=(lo(1)+hi(1))/2;
    state.actions++;changed('comparison');canvas.focus({preventScroll:true});
  }
  canvas.style.touchAction='none';
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{
    if(drag||![0,2].includes(e.button))return;
    canvas.focus({preventScroll:true});
    drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,
      moved:false,pan:state.mode!=='orbit'||e.shiftKey||e.button===2,select:e.button===0&&!e.shiftKey};
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    if(!drag.moved){
      if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5)return;
      drag.moved=true;state.actions++;
    }
    if(drag.pan)pan(e.clientX-drag.x,e.clientY-drag.y);
    else turn(e.clientX-drag.x);
    drag.x=e.clientX;drag.y=e.clientY;
  });
  canvas.addEventListener('pointerup',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const pick=drag.select&&!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5;
    stopDrag();
    if(pick)emit('signclick',{x:e.clientX,y:e.clientY});
  });
  for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(drag?.id===e.pointerId)stopDrag();});
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);
    if(pixels)zoom(Math.exp(Math.max(-1,Math.min(1,pixels*.001))));
  },{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.altKey||e.metaKey)return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&state.mode!=='orbit') {
      e.preventDefault();if(!keys.has(e.code))state.actions++;keys.add(e.code);return;
    }
    if(e.code==='Home'){e.preventDefault();if(!e.repeat){state.actions++;home();}return;}
    if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?1.12:1/1.12);return;}
    if(state.mode==='orbit'&&['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();state.actions++;turn(e.code==='ArrowLeft'?20:-20);}
    // 상하 방향키는 원근뷰 회전에 사용하지 않습니다.
    if(['ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  function update(dt) {
    if(document.hidden){clearInput();return;}
    advanceFocus(dt);
    if(document.activeElement!==canvas){clearInput();return;}
    if(state.mode==='orbit')return;
    const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    const y=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    const length=Math.hypot(x,y);if(!length)return;
    const step=8*Math.min(Math.max(dt,0),.05)/length,right=orthoRight(),v=views[state.mode];
    v.target=v.target.map((n,i)=>n+step*(right[i]*x+(i===1?y:0)));changed();
  }
  canvas.addEventListener('blur',clearInput);window.addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',clearInput);
  home();
  return {state,camera,home,setMode,zoom,focusSign,focusComparison,update,get transitioning(){return transition!==null;}};
};
