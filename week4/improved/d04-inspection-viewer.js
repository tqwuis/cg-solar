/* 제공 WebGL2 렌더러 확장: 구조물 반투명, 명판 선택, 초록색 외곽선. */
(() => {
  'use strict';
  const canvas=document.querySelector('#cv'),gl=canvas.getContext('webgl2',{antialias:true}),read=document.querySelector('#readings');
  if(!gl){read.textContent='WebGL2를 사용할 수 없습니다. 지원하는 브라우저에서 열어 주세요.';return;}
  const M=D.M4,model=window.InspectionModel,controls=window.InspectionControls(canvas,model.bounds),picking=window.InspectionPicking;
  const program=D.program(gl,`#version 300 es
    layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNormal;layout(location=2) in vec2 aUV;
    uniform mat4 uModel,uVP;uniform mat3 uNormal;out vec3 vN;out vec2 vUV;
    void main(){vN=uNormal*aNormal;vUV=aUV;gl_Position=uVP*uModel*vec4(aPos,1.0);}
  `,`#version 300 es
    precision highp float;in vec3 vN;in vec2 vUV;uniform vec3 uColor;uniform bool uText,uOutline;uniform float uAlpha;uniform sampler2D uMap;out vec4 outColor;
    void main(){
      if(uOutline){vec2 pixels=min(vUV,1.0-vUV)/max(fwidth(vUV),vec2(.00001));if(min(pixels.x,pixels.y)>3.0)discard;outColor=vec4(.04,.85,.32,1.0);return;}
      if(uText){outColor=texture(uMap,vUV);return;}
      float light=.48+.52*max(dot(normalize(vN),normalize(vec3(.4,1,.6))),0.0);outColor=vec4(uColor*light,uAlpha);
    }
  `);
  const U=D.uniforms(gl,program,['uModel','uVP','uNormal','uColor','uText','uMap','uAlpha','uOutline']);
  const cube=D.upload(gl,D.cube(1));
  const plane=D.upload(gl,{pos:new Float32Array([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0]),nrm:new Float32Array([0,0,1,0,0,1,0,0,1,0,0,1]),uv:new Float32Array([0,0,1,0,1,1,0,1]),idx:new Uint16Array([0,1,2,0,2,3])});
  function matrix(position,size,yaw=0){const m=M.create();M.translate(m,m,position);M.rotateY(m,m,yaw);M.scale(m,m,size);return m;}
  const parts=model.boxes.map(p=>({...p,matrix:matrix(p.position,p.size)}));
  function texture(sign){
    const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
    ctx.fillStyle='#fff9e9';ctx.fillRect(0,0,512,256);ctx.fillStyle='#122337';ctx.fillRect(0,0,512,62);
    ctx.fillStyle='#ffffff';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText(sign.id,256,46);
    ctx.fillStyle='#122337';ctx.font='bold 60px sans-serif';ctx.fillText(sign.text[0],256,140);ctx.fillText(sign.text[1],256,220);
    const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
    gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    return tex;
  }
  const signs=model.signs.map(p=>({...p,matrix:matrix(p.position,[...p.size,1],p.yaw),
    outline:matrix(p.position,[p.size[0]*1.1,p.size[1]*1.15,1],p.yaw),texture:texture(p)}));
  const view=M.create(),projection=M.create(),vp=M.create();
  const hidden=new Set();
  function drawMesh(mesh,m,color,text=false,alpha=1,outline=false){gl.uniformMatrix4fv(U.uModel,false,m);gl.uniformMatrix3fv(U.uNormal,false,M.normalFrom(m));gl.uniform3fv(U.uColor,color);gl.uniform1i(U.uText,text?1:0);gl.uniform1f(U.uAlpha,alpha);gl.uniform1i(U.uOutline,outline?1:0);gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);}
  // viewport: 그리기 버퍼의 픽셀 좌표 [x,y,width,height]. 원점은 왼쪽 아래입니다.
  function drawView(camera,viewport=[0,0,canvas.width,canvas.height]){
    const [x,y,w,h]=viewport;if(w<=0||h<=0)return;
    gl.viewport(x,y,w,h);gl.enable(gl.SCISSOR_TEST);gl.scissor(x,y,w,h);D.clearColor(gl);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.SCISSOR_TEST);
    M.lookAt(view,camera.eye,camera.target,camera.up||[0,1,0]);
    if(camera.orthographic){const half=camera.halfHeight||8;M.ortho(projection,-half*w/h,half*w/h,-half,half,camera.near||.02,camera.far||180);}
    else M.perspective(projection,(camera.fov||controls.state.fov)*Math.PI/180,w/h,camera.near||.02,camera.far||180);
    M.multiply(vp,projection,view);gl.useProgram(program);gl.uniformMatrix4fv(U.uVP,false,vp);gl.uniform1i(U.uMap,0);gl.activeTexture(gl.TEXTURE0);
    gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.depthMask(true);gl.depthFunc(gl.LESS);
    const visible=parts.filter(p=>!hidden.has(p.id)&&!hidden.has(p.group));
    if(api.transparent){
      // 구조물은 멀리 있는 것부터 혼합하고 깊이를 기록하지 않습니다.
      // 명판은 이 뒤에 불투명하게 그려 가려진 표지도 식별할 수 있습니다.
      const distance=p=>p.position.reduce((sum,n,i)=>sum+(n-camera.eye[i])**2,0);
      visible.sort((a,b)=>distance(b)-distance(a));
      gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.enable(gl.CULL_FACE);
      for(const p of visible){gl.cullFace(gl.FRONT);drawMesh(cube,p.matrix,p.color,false,.13);gl.cullFace(gl.BACK);drawMesh(cube,p.matrix,p.color,false,.13);}
      gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);
    }else for(const p of visible)drawMesh(cube,p.matrix,p.color);
    // 명판의 뒷면은 어두운 무지 면으로 표시하고 앞쪽에서만 글자를 읽습니다.
    for(const s of signs)if(!hidden.has(s.id)&&!hidden.has(s.group)){
      drawMesh(plane,s.matrix,[.25,.28,.32]);gl.enable(gl.CULL_FACE);gl.depthFunc(gl.LEQUAL);gl.bindTexture(gl.TEXTURE_2D,s.texture);drawMesh(plane,s.matrix,[1,1,1],true);gl.depthFunc(gl.LESS);gl.disable(gl.CULL_FACE);
    }
    const selected=signs.find(s=>s.id===api.selectedId);
    if(selected&&!hidden.has(selected.id)&&!hidden.has(selected.group)){
      gl.depthFunc(gl.LEQUAL);drawMesh(plane,selected.outline,[0,1,0],false,1,true);gl.depthFunc(gl.LESS);
    }
  }
  gl.enable(gl.DEPTH_TEST);
  let started=null,last='';
  const api={canvas,gl,model,controls,hidden,drawView,render:null,onFrame:null,transparent:false,selectedId:null,
    pickSign:(x,y)=>picking.pick(controls.camera(),canvas.getBoundingClientRect(),x,y,model,api.transparent,hidden),
    visibleSign(id){
      const sign=model.signs.find(s=>s.id===id);if(!sign)return null;
      const camera=controls.camera(),rect=canvas.getBoundingClientRect();
      // 일부가 보이는 명판도 인식하도록 중심과 내부 모서리/변 중앙을 검사합니다.
      for(const [x,y] of [[0,0],[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4],[0,-.4],[0,.4],[-.4,0],[.4,0]]){
        const p=[sign.position[0]+Math.cos(sign.yaw)*sign.size[0]*x,sign.position[1]+sign.size[1]*y,sign.position[2]-Math.sin(sign.yaw)*sign.size[0]*x];
        const pixel=picking.project(camera,rect,p);
        if(pixel&&api.pickSign(pixel.x,pixel.y)?.id===id)return pixel;
      }
      return null;
    },
    selectSign(sign,{overview=false}={}){
      if(!model.signs.includes(sign))return;
      if(overview)api.transparent=true;
      controls.focusSign(sign,{overview});api.selectedId=sign.id;announce();
    },
    focusVisible(id){if(api.visibleSign(id))api.selectSign(model.signs.find(s=>s.id===id));},
    focusFromList(id){
      const sign=model.signs.find(s=>s.id===id);if(!sign)return;
      api.selectSign(sign,{overview:!api.visibleSign(id)});
    },
    toggleTransparency(){api.transparent=!api.transparent;controls.state.actions++;announce();}
  };window.InspectionViewer=api;
  function announce(){canvas.dispatchEvent(new CustomEvent('inspectionchange'));}
  canvas.addEventListener('camerachange',e=>{if(e.detail.reason!=='focus')api.selectedId=null;announce();});
  canvas.addEventListener('signclick',e=>{const sign=api.pickSign(e.detail.x,e.detail.y);if(sign)api.selectSign(sign);});
  document.addEventListener('keydown',e=>{
    if(e.code!=='Space'||e.ctrlKey||e.altKey||e.metaKey||e.target.closest?.('button,input,select,textarea,[contenteditable="true"]'))return;
    e.preventDefault();if(!e.repeat)api.toggleTransparency();
  });
  document.querySelector('#home').addEventListener('click',()=>{controls.home();controls.state.actions++;});
  document.querySelector('#measure').addEventListener('click',()=>{started=performance.now();controls.state.actions=0;});
  D.loop((time,dt)=>{
    const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    controls.update(dt);
    if(api.render)api.render(api);else drawView(controls.camera());
    if(api.onFrame)api.onFrame(time);
    const s=controls.state,c=controls.camera(),value=`${c.orthographic?'직교 · 세로 범위 '+(c.halfHeight*2).toFixed(2)+' m':'원근 · 거리 '+s.distance.toFixed(2)+' m · FOV '+Number(s.fov.toFixed(1))+'°'}\n중심 (${c.target.map(v=>v.toFixed(2)).join(', ')})\n측정 ${started===null?'시작 전':((performance.now()-started)/1000).toFixed(0)+'초'} · 조작 ${s.actions}회`;
    if(value!==last){read.textContent=value;last=value;}
  });
})();
