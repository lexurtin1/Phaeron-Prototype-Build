import{r as L,j as e}from"./pulse-ui-CfVif2ID.js";import{R as k,T,P as F,M as P}from"./Triangle-DsNpnrqg.js";import{R as b}from"./RadialNav-DowfT708.js";function q(i){const r=i.replace("#","");return[parseInt(r.slice(0,2),16)/255,parseInt(r.slice(2,4),16)/255,parseInt(r.slice(4,6),16)/255]}const G=`
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`,_=`
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;
uniform float uLightMode;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t, vec2 shift) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv += shift;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - uBandHeight * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  vec2 shift = vec2(0.0);
  if (uEnableMouse) {
    shift = (uMouse - 0.5) * uMouseInfluence;
  }

  float glow1 = auroraGlow(t, shift);
  float glow2 = auroraGlow(t + uLayerOffset, shift);
  vec3 gradient1 = cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20));
  vec3 gradient2 = cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25));

  vec3 col = 0.99 * glow1 * gradient1 * uColor1;
  col += 0.99 * glow2 * gradient2 * uColor2;

  col *= uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  if (uLightMode > 0.5) {
    float phase1 = dot(gradient1, vec3(0.299, 0.587, 0.114));
    float phase2 = dot(gradient2, vec3(0.299, 0.587, 0.114));
    float weight1 = pow(max(glow1 * (0.62 + 0.38 * phase1), 0.0), 1.35);
    float weight2 = pow(max(glow2 * (0.62 + 0.38 * phase2), 0.0), 1.35);
    float weightSum = max(weight1 + weight2, 0.0001);
    vec3 chroma = (weight1 * uColor1 + weight2 * uColor2) / weightSum;
    float neutral = min(chroma.r, min(chroma.g, chroma.b));
    chroma = max(chroma - vec3(neutral * 0.78), vec3(0.0));
    float peak = max(chroma.r, max(chroma.g, chroma.b));
    chroma = pow(clamp(chroma / max(peak, 0.0001), 0.0, 1.0), vec3(1.08));
    float ink = clamp((weight1 + weight2) * uBrightness * 1.55, 0.0, 0.82);
    gl_FragColor = vec4(mix(vec3(1.0), chroma, ink), 1.0);
  } else {
    gl_FragColor = vec4(col, alpha);
  }
}
`;function V({speed:i=.6,scale:r=1.5,brightness:h=1,color1:x="#f7f7f7",color2:p="#e100ff",noiseFrequency:g=2.5,noiseAmplitude:y=1,bandHeight:w=.5,bandSpread:z=1,octaveDecay:S=.1,layerOffset:j=0,colorSpeed:C=1,enableMouseInteraction:s=!0,mouseInfluence:N=.25,lightMode:M=!1}){const f=L.useRef(null);return L.useEffect(()=>{if(!f.current)return;const c=f.current,v=new k({alpha:!0,premultipliedAlpha:!1}),a=v.gl;a.clearColor(0,0,0,0);let o,l=[.5,.5],n=[.5,.5];function E(t){const u=a.canvas.getBoundingClientRect();n=[(t.clientX-u.left)/u.width,1-(t.clientY-u.top)/u.height]}function A(){n=[.5,.5]}function m(){v.setSize(c.offsetWidth,c.offsetHeight),o&&(o.uniforms.uResolution.value=[a.canvas.width,a.canvas.height,a.canvas.width/a.canvas.height])}window.addEventListener("resize",m),m();const H=new T(a);o=new F(a,{vertex:G,fragment:_,uniforms:{uTime:{value:0},uResolution:{value:[a.canvas.width,a.canvas.height,a.canvas.width/a.canvas.height]},uSpeed:{value:i},uScale:{value:r},uBrightness:{value:h},uColor1:{value:q(x)},uColor2:{value:q(p)},uNoiseFreq:{value:g},uNoiseAmp:{value:y},uBandHeight:{value:w},uBandSpread:{value:z},uOctaveDecay:{value:S},uLayerOffset:{value:j},uColorSpeed:{value:C},uMouse:{value:new Float32Array([.5,.5])},uMouseInfluence:{value:N},uEnableMouse:{value:s},uLightMode:{value:M?1:0}}});const R=new P(a,{geometry:H,program:o});c.appendChild(a.canvas),s&&(a.canvas.addEventListener("mousemove",E),a.canvas.addEventListener("mouseleave",A));let d;function B(t){d=requestAnimationFrame(B),o.uniforms.uTime.value=t*.001,s?(l[0]+=.05*(n[0]-l[0]),l[1]+=.05*(n[1]-l[1]),o.uniforms.uMouse.value[0]=l[0],o.uniforms.uMouse.value[1]=l[1]):(o.uniforms.uMouse.value[0]=.5,o.uniforms.uMouse.value[1]=.5),v.render({scene:R})}return d=requestAnimationFrame(B),()=>{var t;cancelAnimationFrame(d),window.removeEventListener("resize",m),s&&(a.canvas.removeEventListener("mousemove",E),a.canvas.removeEventListener("mouseleave",A)),c.removeChild(a.canvas),(t=a.getExtension("WEBGL_lose_context"))==null||t.loseContext()}},[i,r,h,x,p,g,y,w,z,S,j,C,s,N,M]),e.jsx("div",{ref:f,className:"soft-aurora-container"})}function W(){return e.jsxs("header",{className:"pulse-header module-chrome",children:[e.jsxs("div",{className:"module-chrome-left",children:[e.jsxs("div",{className:"module-chrome-brand",children:[e.jsx("img",{src:"/assets/phaeron-wordmark.png",alt:"Phaeron",className:"module-chrome-logo"}),e.jsx("span",{className:"module-chrome-divider","aria-hidden":!0}),e.jsx("span",{className:"module-chrome-title",children:"Pulse"})]}),e.jsx("a",{href:"/tools/system-architecture/index.html",className:"module-chrome-arch",children:"System Architecture"})]}),e.jsxs("div",{className:"ph-search",children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none","aria-hidden":!0,children:[e.jsx("circle",{cx:"11",cy:"11",r:"7",stroke:"#9aa6b0",strokeWidth:"2"}),e.jsx("line",{x1:"16.5",y1:"16.5",x2:"21",y2:"21",stroke:"#9aa6b0",strokeWidth:"2",strokeLinecap:"round"})]}),e.jsx("input",{type:"search",placeholder:"Search workspaces, accounts, markets…","aria-label":"Search"})]}),e.jsxs("div",{className:"module-chrome-right",children:[e.jsxs("div",{className:"ph-user",children:[e.jsxs("div",{className:"ph-user-name",children:[e.jsx("strong",{children:"Alex Curtin"}),e.jsx("span",{children:"Sales · EMEA"})]}),e.jsx("div",{className:"ph-avatar",children:e.jsx("img",{src:"/assets/Headshot.png",alt:"Alex Curtin"})})]}),e.jsx(b,{})]})]})}export{W as P,V as S};
