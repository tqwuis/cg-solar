/* 6주차 실습 2 · 단색 태양과 얼음행성 빙각 */
(() => {
  'use strict';
  const cv = document.querySelector('#cv');
  const gl = D.context(cv);
  if (!gl) return;
  const {M4} = D;

  const VS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUV;
uniform mat4 uVP, uModel;
out vec3 vP, vN, vLocal;
out vec2 vUV;
void main() {
    vec4 world = uModel * vec4(aPos, 1.0);
    vP = world.xyz;
    // 모델은 회전과 균일 스케일만 사용하므로 정규화하면 역전치 법선과 같다.
    vN = normalize(mat3(uModel) * aNormal);
    vLocal = aPos;
    vUV = aUV;
    gl_Position = uVP * world;
}`;

  const FS = `#version 300 es
precision highp float;
const float PI=3.14159265;
in vec3 vP, vN, vLocal;
in vec2 vUV;
out vec4 outColor;
uniform sampler2D uColor, uNormal, uARM, uEnv;
uniform vec3 uEye, uSun;
uniform float uSolar, uPressure, uOrbitHeat, uTime;
uniform int uMode;

vec3 srgbToLinear(vec3 c){
 return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));
}
vec3 linearToSrgb(vec3 c){
 return mix(12.92*c,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));
}

vec3 directPBR(vec3 N,vec3 V,vec3 L,vec3 base,float rough,float metal,float power){
    float nl = max(dot(N,L),0.0), nv = max(dot(N,V),0.0);
    if (nl <= 0.0 || nv <= 0.0) return vec3(0.0);
    vec3 H = normalize(V + L);
    float nh = max(dot(N,H),0.0), vh = max(dot(V,H),0.0);
    float a = rough*rough, a2 = a*a;
    float den = nh*nh*(a2-1.0)+1.0;
    float D = a2 / max(PI*den*den, 1e-6);
    float k = (rough+1.0)*(rough+1.0)/8.0;
    float G = (nl/(nl*(1.0-k)+k)) * (nv/(nv*(1.0-k)+k));
    vec3 F0 = mix(vec3(0.04), base, metal);
    vec3 F = F0 + (1.0-F0)*pow(1.0-vh,5.0);
    vec3 kd = (1.0-F)*(1.0-metal);
    return (kd*base/PI + D*G*F/max(4.0*nl*nv,1e-4))*nl*power;
}

// Week 3 얼음행성의 3차원 잡음. 로컬 좌표로 샘플링해 무늬가 빙각에 붙어 돈다.
float hash31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// 격자 꼭짓점의 난수를 부드럽게 섞어 "덩어리진" 잡음을 만듭니다
float noise3(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);                 // 부드럽게 (smoothstep 과 같은 곡선)
  return mix(mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
                 mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
                 mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
}

// 크기가 다른 잡음을 여러 겹 더합니다 → 큰 덩어리와 잔 무늬가 함께 생깁니다
float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise3(p); p *= 2.02; a *= 0.5; }
  return v;
}

float meltMask(vec3 local, float terrain, float floes, float daylight) {
    // 공전 거리로 정해지는 열에 낮 쪽 가열을 더한다. 두꺼운 빙판은 나중에 녹는다.
    float heat = uSolar * mix(0.52, 2.15, uOrbitHeat) * mix(0.34, 1.0, daylight);
    float threshold = 0.20 + 0.38 * terrain + 0.22 * floes + 0.25 * pow(abs(local.y), 3.0);
    return smoothstep(threshold - 0.07, threshold + 0.07, heat);
}

vec3 auroraLight(vec3 local) {
    // 3주차의 남북 오로라. 경도에 따라 휘고 중위도와 극지 사이를 오간다.
    float longitude = atan(local.z, local.x);
    float noise = fbm(local * 4.0 + vec3(0.0, uTime * 0.04, 0.0));
    float center = mix(0.42, 0.86, 0.5 + 0.5 * sin(uTime * 0.24));
    center += 0.055 * sin(2.0 * longitude + uTime * 0.45)
            + 0.025 * sin(5.0 * longitude - uTime * 0.70) + 0.935 * (noise - 0.5);
    float band = 1.0 - smoothstep(0.012, 0.152, abs(abs(local.y) - center));
    float wave = 0.5 + 0.5 * sin(3.0 * longitude - uTime * 0.75 + 5.0 * noise);
    float cycle = 0.5 + 0.5 * sin(uTime * 0.38);
    float appearance = smoothstep(0.10, 0.38, cycle) * (1.0 - smoothstep(0.64, 0.90, cycle));
    vec3 tint = mix(vec3(0.01, 0.83, 0.65), vec3(0.46, 0.18, 0.94), smoothstep(0.25, 0.80, noise));
    return 3.0 * srgbToLinear(tint) * band * mix(0.12, 1.0, smoothstep(0.54, 0.90, wave)) * appearance;
}

float fractureMask(vec3 local, float terrain) {
    // 서로 다른 방향의 두 단층군. 압력이 오르면 가는 틈부터 넓어진다.
    vec2 faults = vec2(dot(local, vec3(1.6, 3.4, -0.9)),
                       dot(local, vec3(-2.4, 0.6, 2.2)));
    vec2 bands = abs(sin(faults + vec2(1.6, 1.2) * (terrain - 0.5)));
    float ridge = min(bands.x, bands.y + 0.045);
    float width = 0.16 * uPressure;
    return uPressure * (1.0 - smoothstep(width, width + 0.055, ridge));
}

void main() {
    vec3 local = normalize(vLocal);
    vec3 N = normalize(vN), V = normalize(uEye - vP);
    vec3 toSun = uSun - vP;
    vec3 L = normalize(toSun);
    float falloff = 1.0 / (0.72 + 0.040 * dot(toSun, toSun));
    float terrain = fbm(local * 3.0);
    float detail = fbm(local * 5.0 + vec3(0.0, uTime * 0.015, 0.0));
    float floes = smoothstep(0.48, 0.54, detail) * (1.0 - smoothstep(0.52, 0.68, terrain));
    float melt = meltMask(local, terrain, floes, max(dot(N, L), 0.0));
    float fracture = fractureMask(local, terrain);
    if (uMode >= 2) {
        outColor = vec4(vec3(uMode == 2 ? melt : fracture), 1.0);
        return;
    }
    if (uMode == 1) { melt = 0.0; fracture = 0.0; }

    vec2 uv = vUV * vec2(4.0, 2.0);
    vec3 iceMap = srgbToLinear(texture(uColor, uv).rgb);
    vec3 arm = texture(uARM, uv).rgb;
    float grain = dot(iceMap, vec3(0.2126, 0.7152, 0.0722));
    // Week 3이 화면에 출력하던 색을 먼저 조합한 뒤 PBR용 선형 색으로 변환한다.
    vec3 ice = mix(vec3(0.035, 0.22, 0.34), vec3(0.20, 0.60, 0.72),
                   smoothstep(0.20, 0.58, terrain));
    float snow = smoothstep(0.58, 0.82, terrain);
    ice = mix(ice, vec3(0.82, 0.94, 0.96), snow);
    ice = mix(ice, vec3(0.52, 0.85, 0.99), 0.92 * floes);
    float cap = smoothstep(0.67, 0.90, abs(local.y) + 0.12 * terrain);
    ice = mix(ice, vec3(0.88, 0.98, 1.0), 0.55 * cap);
    vec3 base = srgbToLinear(ice) * (0.81 + 0.90 * grain);
    float rough = clamp(0.26 + 0.66 * arm.g + 0.26 * max(snow, cap), 0.045, 1.0);
    float metal = 0.0; // 얼음과 염수는 비금속
    // 날이 따뜻해지면 빙판 가장자리에 얕은 청록 물이 고이고 깊은 곳은 남색이 된다.
    vec3 water = mix(vec3(0.014, 0.26, 0.30), vec3(0.003, 0.028, 0.065), melt);
    base = mix(base, water, melt);
    rough = mix(rough, 0.10, melt);
    base = mix(base, vec3(0.016, 0.46, 0.43), fracture);
    rough = mix(rough, 0.21, fracture); // 겹치면 노출된 염수가 가장 위에 있다.

    // 실습 1의 미분 기반 TBN. 녹은 물과 염수에서는 미세 요철도 잦아든다.
    vec3 dp1 = dFdx(vP), dp2 = dFdy(vP);
    vec2 du1 = dFdx(uv), du2 = dFdy(uv);
    vec3 T = cross(dp2, N)*du1.x + cross(N, dp1)*du2.x;
    vec3 B = cross(dp2, N)*du1.y + cross(N, dp1)*du2.y;
    float inv = inversesqrt(max(max(dot(T,T), dot(B,B)), 1e-20));
    vec3 mapN = texture(uNormal, uv).xyz * 2.0 - 1.0;
    mapN.xy *= mix(1.25, 0.07, max(melt, fracture));
    N = normalize(mat3(T*inv, B*inv, N) * mapN);

    float power = (2.2 + 8.0 * uSolar) * falloff;
    vec3 color = directPBR(N, V, L, base, rough, metal, power);
    float ao = arm.r;
    color += 0.22 * ao * base;
    vec3 reflected = reflect(-V, N);
    vec2 envUV = vec2(atan(reflected.z, reflected.x)/(2.0*PI)+0.5,
                      asin(clamp(reflected.y,-1.0,1.0))/PI+0.5);
    vec3 env = srgbToLinear(textureLod(uEnv, envUV, 1.5 + rough*5.5).rgb);
    float fresnel = mix(0.04, max(1.0 - rough, 0.04), pow(1.0 - max(dot(N,V), 0.0), 5.0));
    color += ao * env * fresnel;
    float rim = pow(1.0 - max(dot(normalize(vN), V), 0.0), 3.0);
    color += vec3(0.022, 0.075, 0.11) * rim + auroraLight(local);
    outColor = vec4(linearToSrgb(color/(1.0+color)), 1.0);
}`;

  const program = D.program(gl, VS, FS);
  const U = D.uniforms(gl, program, ['uVP', 'uModel', 'uEye', 'uSun', 'uSolar',
    'uPressure', 'uOrbitHeat', 'uTime', 'uMode', 'uColor', 'uNormal', 'uARM', 'uEnv']);
  // 태양은 광원의 위치를 보여 주는 단색 구 메시다. 궤도선도 조명 없이 그린다.
  const flat = D.program(gl, `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uVP, uModel;
void main() { gl_Position = uVP * uModel * vec4(aPos, 1.0); gl_PointSize = 1.5; }`,
    `#version 300 es
precision highp float;
uniform vec3 uColor;
out vec4 outColor;
void main() { outColor = vec4(uColor, 1.0); }`);
  const F = D.uniforms(gl, flat, ['uVP', 'uModel', 'uColor']);
  const sphere = D.upload(gl, D.revolution(D.profiles.sphere(1, 48), 96));

  // 태양을 한 초점에 둔다. 궤도 표시와 행성 위치는 같은 식을 쓴다.
  const major = 3.45, eccentricity = 0.43;
  const minor = major * Math.sqrt(1 - eccentricity ** 2);
  const focus = major * eccentricity;
  // 1/r²을 원일점 0, 근일점 1로 정규화해 궤도 중간에서도 변화를 읽을 수 있게 한다.
  const farFlux = 1 / (major + focus) ** 2, nearFlux = 1 / (major - focus) ** 2;
  function orbitPosition(angle) {
    return [focus + major * Math.cos(angle), 0, minor * Math.sin(angle)];
  }
  const orbitPoints = Array.from({length: 256}, (_, i) => orbitPosition(2 * Math.PI * i / 256));
  function pointMesh(points) {
    return D.upload(gl, {pos: new Float32Array(points.flat()),
      idx: Uint16Array.from(points, (_, i) => i)});
  }
  const orbit = pointMesh(orbitPoints);
  // 작은 배경별은 두 천체보다 멀리 놓아 카메라 회전 시에도 하늘에 머물게 한다.
  const stars = pointMesh(Array.from({length: 1750}, (_, i) => {
    const y = 1 - 2 * (i + 0.5) / 1750;
    const r = Math.sqrt(1 - y*y);
    const angle = i * 2.39996 + 0.2 * Math.sin(i * 37.1);
    return [42*r*Math.cos(angle), 42*y, 42*r*Math.sin(angle)];
  }));

  function loadMap(file, fallback) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([...fallback, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    const ready = new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        resolve(null);
      };
      img.onerror = () => resolve(file);
      img.src = 'assets/week06/' + file;
    });
    return {tex, ready};
  }
  const maps = [loadMap('ice003_color.jpg', [73,89,90]),
    loadMap('ice003_nor_gl.jpg', [128,128,255]),
    loadMap('ice003_arm.png', [255,36,0]),
    loadMap('studio_small_09_tonemapped.jpg', [90,105,125])];
  Promise.all(maps.map(map => map.ready)).then(results => {
    const missing = results.filter(Boolean);
    document.querySelector('#status').textContent = missing.length
      ? '재질 맵 로딩 실패 · ' + missing.join(', ') + ' · HTTP 서버에서 실행해 주세요.'
      : '재질 맵 4개 로딩 완료';
  });

  const solar = document.querySelector('#solar'), pressure = document.querySelector('#pressure');
  for (const input of [solar, pressure]) {
    const output = document.querySelector('#' + input.id + 'Value');
    input.addEventListener('input', () => { output.value = input.value + '%'; });
  }
  const surface = document.querySelector('#surface'), camera = document.querySelector('#camera');
  const distance = document.querySelector('#distance'), pause = document.querySelector('#pause');
  let playing = true;
  function setPlaying(value) {
    playing = value;
    pause.textContent = playing ? '일시 정지' : '공전 재생';
  }
  pause.addEventListener('click', () => setPlaying(!playing));
  const cam = D.orbit(cv, {yaw: -0.22, pitch: 0.50, dist: 11.6, min: 1.3, max: 25});
  function resetCamera() {
    cam.yaw = camera.value === 'system' ? -0.22 : -0.88;
    cam.pitch = 0.50;
    cam.dist = camera.value === 'system' ? 11.6 : 2.65;
  }
  document.querySelector('#reset').onclick = resetCamera;
  camera.onchange = resetCamera;

  let orbitAngle = -0.96, elapsed = 0;
  function inspectDistance(angle) {
    setPlaying(false);
    orbitAngle = angle;
    if (camera.value !== 'planet') {
      camera.value = 'planet';
      resetCamera();
    }
  }
  document.querySelector('#perihelion').onclick = () => inspectDistance(Math.PI);
  document.querySelector('#aphelion').onclick = () => inspectDistance(0);

  const view = M4.create(), proj = M4.create(), vp = M4.create();
  const identity = M4.create(), sunModel = M4.create(), planetModel = M4.create();
  M4.scale(sunModel, identity, [0.94, 0.94, 0.94]);
  const sun = [0, 0, 0], orbitCenter = [focus, 0, 0];
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.031, 0.055, 0.10, 1);
  gl.useProgram(program);
  ['uColor','uNormal','uARM','uEnv'].forEach((name, i) => gl.uniform1i(U[name], i));

  function drawFlat(mesh, primitive, model, color) {
    gl.uniformMatrix4fv(F.uModel, false, model);
    gl.uniform3fv(F.uColor, color);
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(primitive, mesh.count, gl.UNSIGNED_SHORT, 0);
  }

  let visible = true;
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(cv);
  D.loop((_, dt) => {
    if (!visible || document.hidden) return;
    if (playing) {
      const step = Math.min(dt, 0.1);
      elapsed += step;
      orbitAngle = (orbitAngle + step * 2 * Math.PI / 38) % (2 * Math.PI);
    }
    const position = orbitPosition(orbitAngle);
    const radius = Math.hypot(...position);
    const flux = 1 / (radius * radius);
    const orbitHeat = Math.sqrt(Math.max(0, Math.min(1, (flux - farFlux) / (nearFlux - farFlux))));
    // 태양-행성 축 기준의 자전과 확대 시점. 거리만 바꾸어도 같은 지역을 관찰한다.
    const heading = Math.atan2(-position[2], position[0]);
    M4.translate(planetModel, identity, position);
    M4.rotateY(planetModel, planetModel, heading);
    M4.rotateZ(planetModel, planetModel, 0.22);
    M4.rotateY(planetModel, planetModel, elapsed * 0.22);
    M4.scale(planetModel, planetModel, [0.78, 0.78, 0.78]);
    const distanceText = radius.toFixed(2);
    if (distance.textContent !== distanceText) distance.textContent = distanceText;

    D.fit(cv);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const systemView = camera.value === 'system';
    const target = systemView ? orbitCenter : position;
    const azimuth = systemView ? 0 : heading;
    const c = Math.cos(azimuth), s = Math.sin(azimuth);
    const [x, y, z] = cam.eye();
    const eye = [target[0] + x*c + z*s, target[1] + y, target[2] - x*s + z*c];
    M4.lookAt(view, eye, target, [0,1,0]);
    const aspect = cv.width / cv.height;
    const fov = 2 * Math.atan(Math.tan(Math.PI/8) / Math.min(1, aspect));
    M4.perspective(proj, fov, aspect, 0.08, 90);
    M4.multiply(vp, proj, view);

    const activity = solar.valueAsNumber / 100;
    gl.useProgram(flat);
    gl.uniformMatrix4fv(F.uVP, false, vp);
    drawFlat(stars, gl.POINTS, identity, [0.30,0.37,0.47]);
    if (systemView) {
      drawFlat(orbit, gl.LINE_LOOP, identity, [0.23,0.34,0.43]);
      const glow = 0.70 + 0.30 * activity;
      drawFlat(sphere, gl.TRIANGLES, sunModel, [glow, 0.78*glow, 0.40*glow]);
    }

    gl.useProgram(program);
    gl.uniformMatrix4fv(U.uVP, false, vp);
    gl.uniformMatrix4fv(U.uModel, false, planetModel);
    gl.uniform3fv(U.uEye, eye);
    gl.uniform3fv(U.uSun, sun);
    gl.uniform1f(U.uSolar, activity);
    gl.uniform1f(U.uOrbitHeat, orbitHeat);
    gl.uniform1f(U.uTime, elapsed);
    gl.uniform1f(U.uPressure, pressure.valueAsNumber / 100);
    gl.uniform1i(U.uMode, Number(surface.value));
    maps.forEach(({tex}, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, tex);
    });
    gl.bindVertexArray(sphere.vao);
    gl.drawElements(gl.TRIANGLES, sphere.count, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  });
})();
