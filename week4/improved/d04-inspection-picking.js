/* 화면 픽셀 → 원근/직교 ray → 명판 사각형 및 구조물 AABB 교차 검사. */
window.InspectionPicking = (()=>{
  const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
  const sub=(a,b)=>a.map((n,i)=>n-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const n=Math.hypot(...a);return a.map(v=>v/(n||1));};
  function basis(camera) {
    const f=norm(sub(camera.target,camera.eye)),r=norm(cross(f,camera.up));
    return {f,r,u:cross(r,f)};
  }
  function ray(camera,rect,x,y) {
    const {f,r,u}=basis(camera),nx=2*(x-rect.left)/rect.width-1,ny=1-2*(y-rect.top)/rect.height;
    const half=camera.orthographic?camera.halfHeight:Math.tan(camera.fov*Math.PI/360);
    const offset=r.map((v,i)=>v*nx*half*rect.width/rect.height+u[i]*ny*half);
    return camera.orthographic?{origin:camera.eye.map((v,i)=>v+offset[i]),direction:f}
      :{origin:camera.eye,direction:norm(f.map((v,i)=>v+offset[i]))};
  }
  function intersectSign(ray,sign) {
    const normal=[Math.sin(sign.yaw),0,Math.cos(sign.yaw)],denom=dot(ray.direction,normal);
    if(Math.abs(denom)<1e-8)return null;
    const t=dot(sub(sign.position,ray.origin),normal)/denom;if(t<=0)return null;
    const local=ray.origin.map((v,i)=>v+t*ray.direction[i]-sign.position[i]);
    const x=dot(local,[Math.cos(sign.yaw),0,-Math.sin(sign.yaw)]);
    return Math.abs(x)<=sign.size[0]/2+1e-7&&Math.abs(local[1])<=sign.size[1]/2+1e-7?t:null;
  }
  function intersectBox(ray,box) {
    let lo=0,hi=Infinity;
    for(let i=0;i<3;i++) {
      const min=box.position[i]-box.size[i]/2,max=box.position[i]+box.size[i]/2;
      if(Math.abs(ray.direction[i])<1e-9){if(ray.origin[i]<min||ray.origin[i]>max)return null;continue;}
      const a=(min-ray.origin[i])/ray.direction[i],b=(max-ray.origin[i])/ray.direction[i];
      lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return null;
    }
    return hi>0?lo:null;
  }
  function pick(camera,rect,x,y,model,transparent,hidden=new Set()) {
    if(rect.width<=0||rect.height<=0||x<rect.left||x>rect.left+rect.width||y<rect.top||y>rect.top+rect.height)return null;
    const sight=ray(camera,rect,x,y),{f}=basis(camera),depth=t=>t*dot(sight.direction,f);
    const near=camera.near||.02,far=camera.far||180;
    let hit=null,closest=Infinity;
    for(const sign of model.signs) {
      if(hidden.has(sign.id)||hidden.has(sign.group))continue;
      const t=intersectSign(sight,sign);
      if(t!==null&&depth(t)>=near&&depth(t)<=far&&t<closest){hit=sign;closest=t;}
    }
    if(!hit)return null;
    if(!transparent)for(const box of model.boxes) {
      if(hidden.has(box.id)||hidden.has(box.group))continue;
      const t=intersectBox(sight,box);
      if(t!==null&&t<closest-1e-4)return null;
    }
    return hit;
  }
  function project(camera,rect,point) {
    const {f,r,u}=basis(camera),delta=sub(point,camera.eye),z=dot(delta,f);
    if(z<(camera.near||.02)||z>(camera.far||180))return null;
    const half=camera.orthographic?camera.halfHeight:z*Math.tan(camera.fov*Math.PI/360);
    const nx=dot(delta,r)/(half*rect.width/rect.height),ny=dot(delta,u)/half;
    if(Math.abs(nx)>1||Math.abs(ny)>1)return null;
    return {x:rect.left+(nx+1)*rect.width/2,y:rect.top+(1-ny)*rect.height/2};
  }
  return {pick,project,ray,intersectSign,intersectBox};
})();
