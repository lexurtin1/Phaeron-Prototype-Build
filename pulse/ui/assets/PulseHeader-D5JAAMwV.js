import{r as s,j as e}from"./pulse-ui-DSJt-J6e.js";import{R as V,T as O,P as W,M as X}from"./Triangle-DsNpnrqg.js";import{P as Y}from"./PillNav-DW4yV0pt.js";import{a as J}from"./tools-CoUPWk-J.js";function D(d){const o=d.replace("#","");return[parseInt(o.slice(0,2),16)/255,parseInt(o.slice(2,4),16)/255,parseInt(o.slice(4,6),16)/255]}const K=`
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`,Q=`
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
`;function se({speed:d=.6,scale:o=1.5,brightness:v=1,color1:c="#f7f7f7",color2:z="#e100ff",noiseFrequency:S=2.5,noiseAmplitude:n=1,bandHeight:x=.5,bandSpread:C=1,octaveDecay:b=.1,layerOffset:y=0,colorSpeed:w=1,enableMouseInteraction:m=!0,mouseInfluence:$=.25,lightMode:j=!1}){const l=s.useRef(null);return s.useEffect(()=>{if(!l.current)return;const r=l.current,h=new V({alpha:!0,premultipliedAlpha:!1}),t=h.gl;t.clearColor(0,0,0,0);let u,p=[.5,.5],R=[.5,.5];function G(g){const M=t.canvas.getBoundingClientRect();R=[(g.clientX-M.left)/M.width,1-(g.clientY-M.top)/M.height]}function N(){R=[.5,.5]}function B(){h.setSize(r.offsetWidth,r.offsetHeight),u&&(u.uniforms.uResolution.value=[t.canvas.width,t.canvas.height,t.canvas.width/t.canvas.height])}window.addEventListener("resize",B),B();const T=new O(t);u=new W(t,{vertex:K,fragment:Q,uniforms:{uTime:{value:0},uResolution:{value:[t.canvas.width,t.canvas.height,t.canvas.width/t.canvas.height]},uSpeed:{value:d},uScale:{value:o},uBrightness:{value:v},uColor1:{value:D(c)},uColor2:{value:D(z)},uNoiseFreq:{value:S},uNoiseAmp:{value:n},uBandHeight:{value:x},uBandSpread:{value:C},uOctaveDecay:{value:b},uLayerOffset:{value:y},uColorSpeed:{value:w},uMouse:{value:new Float32Array([.5,.5])},uMouseInfluence:{value:$},uEnableMouse:{value:m},uLightMode:{value:j?1:0}}});const A=new X(t,{geometry:T,program:u});r.appendChild(t.canvas),m&&(t.canvas.addEventListener("mousemove",G),t.canvas.addEventListener("mouseleave",N));let E;function F(g){E=requestAnimationFrame(F),u.uniforms.uTime.value=g*.001,m?(p[0]+=.05*(R[0]-p[0]),p[1]+=.05*(R[1]-p[1]),u.uniforms.uMouse.value[0]=p[0],u.uniforms.uMouse.value[1]=p[1]):(u.uniforms.uMouse.value[0]=.5,u.uniforms.uMouse.value[1]=.5),h.render({scene:A})}return E=requestAnimationFrame(F),()=>{var g;cancelAnimationFrame(E),window.removeEventListener("resize",B),m&&(t.canvas.removeEventListener("mousemove",G),t.canvas.removeEventListener("mouseleave",N)),r.removeChild(t.canvas),(g=t.getExtension("WEBGL_lose_context"))==null||g.loseContext()}},[d,o,v,c,z,S,n,x,C,b,y,w,m,$,j]),e.jsx("div",{ref:l,className:"soft-aurora-container"})}const re=({patternSize:d=250,patternScaleX:o=1,patternScaleY:v=1,patternRefreshInterval:c=2,patternAlpha:z=15})=>{const S=s.useRef(null);return s.useEffect(()=>{const n=S.current;if(!n)return;const x=n.getContext("2d",{alpha:!0});if(!x)return;let C=0,b;const y=1024,w=()=>{n&&(n.width=y,n.height=y,n.style.width="100vw",n.style.height="100vh")},m=()=>{const j=x.createImageData(y,y),l=j.data;for(let r=0;r<l.length;r+=4){const h=Math.random()*255;l[r]=h,l[r+1]=h,l[r+2]=h,l[r+3]=z}x.putImageData(j,0,0)},$=()=>{C%c===0&&m(),C++,b=window.requestAnimationFrame($)};return window.addEventListener("resize",w),w(),$(),()=>{window.removeEventListener("resize",w),window.cancelAnimationFrame(b)}},[d,o,v,c,z]),e.jsx("canvas",{className:"noise-overlay",ref:S,style:{imageRendering:"pixelated"}})},Z=({children:d,width:o=200,height:v=80,borderRadius:c=20,borderWidth:z=.07,brightness:S=50,opacity:n=.93,blur:x=11,displace:C=0,backgroundOpacity:b=0,saturation:y=1,distortionScale:w=-180,redOffset:m=0,greenOffset:$=10,blueOffset:j=20,xChannel:l="R",yChannel:r="G",mixBlendMode:h="difference",className:t="",style:u={}})=>{const p=s.useId(),R=`glass-filter-${p}`,G=`red-grad-${p}`,N=`blue-grad-${p}`,[B,T]=s.useState(!1),A=s.useRef(null),E=s.useRef(null),F=s.useRef(null),g=s.useRef(null),M=s.useRef(null),H=s.useRef(null),k=()=>{var P;const a=(P=A.current)==null?void 0:P.getBoundingClientRect(),i=(a==null?void 0:a.width)||400,f=(a==null?void 0:a.height)||200,L=Math.min(i,f)*(z*.5),U=`
      <svg viewBox="0 0 ${i} ${f}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${G}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${N}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${i}" height="${f}" fill="black"></rect>
        <rect x="0" y="0" width="${i}" height="${f}" rx="${c}" fill="url(#${G})" />
        <rect x="0" y="0" width="${i}" height="${f}" rx="${c}" fill="url(#${N})" style="mix-blend-mode: ${h}" />
        <rect x="${L}" y="${L}" width="${i-L*2}" height="${f-L*2}" rx="${c}" fill="hsl(0 0% ${S}% / ${n})" style="filter:blur(${x}px)" />
      </svg>
    `;return`data:image/svg+xml,${encodeURIComponent(U)}`},q=()=>{var a;(a=E.current)==null||a.setAttribute("href",k())};s.useEffect(()=>{var a;q(),[{ref:F,offset:m},{ref:g,offset:$},{ref:M,offset:j}].forEach(({ref:i,offset:f})=>{i.current&&(i.current.setAttribute("scale",(w+f).toString()),i.current.setAttribute("xChannelSelector",l),i.current.setAttribute("yChannelSelector",r))}),(a=H.current)==null||a.setAttribute("stdDeviation",C.toString())},[o,v,c,z,S,n,x,C,w,m,$,j,l,r,h]),s.useEffect(()=>{if(!A.current)return;const a=new ResizeObserver(()=>{setTimeout(q,0)});return a.observe(A.current),()=>{a.disconnect()}},[]),s.useEffect(()=>{setTimeout(q,0)},[o,v]),s.useEffect(()=>{T(I())},[]);const I=()=>{if(typeof window>"u"||typeof document>"u")return!1;const a=/Safari/.test(navigator.userAgent)&&!/Chrome/.test(navigator.userAgent),i=/Firefox/.test(navigator.userAgent);if(a||i)return!1;const f=document.createElement("div");return f.style.backdropFilter=`url(#${R})`,f.style.backdropFilter!==""},_={...u,width:typeof o=="number"?`${o}px`:o,height:typeof v=="number"?`${v}px`:v,borderRadius:`${c}px`,"--glass-frost":b,"--glass-saturation":y,"--filter-id":`url(#${R})`};return e.jsxs("div",{ref:A,className:`glass-surface ${B?"glass-surface--svg":"glass-surface--fallback"} ${t}`,style:_,children:[e.jsx("svg",{className:"glass-surface__filter",xmlns:"http://www.w3.org/2000/svg",children:e.jsx("defs",{children:e.jsxs("filter",{id:R,colorInterpolationFilters:"sRGB",x:"0%",y:"0%",width:"100%",height:"100%",children:[e.jsx("feImage",{ref:E,x:"0",y:"0",width:"100%",height:"100%",preserveAspectRatio:"none",result:"map"}),e.jsx("feDisplacementMap",{ref:F,in:"SourceGraphic",in2:"map",id:"redchannel",result:"dispRed"}),e.jsx("feColorMatrix",{in:"dispRed",type:"matrix",values:`1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0`,result:"red"}),e.jsx("feDisplacementMap",{ref:g,in:"SourceGraphic",in2:"map",id:"greenchannel",result:"dispGreen"}),e.jsx("feColorMatrix",{in:"dispGreen",type:"matrix",values:`0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0`,result:"green"}),e.jsx("feDisplacementMap",{ref:M,in:"SourceGraphic",in2:"map",id:"bluechannel",result:"dispBlue"}),e.jsx("feColorMatrix",{in:"dispBlue",type:"matrix",values:`0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0`,result:"blue"}),e.jsx("feBlend",{in:"red",in2:"green",mode:"screen",result:"rg"}),e.jsx("feBlend",{in:"rg",in2:"blue",mode:"screen",result:"output"}),e.jsx("feGaussianBlur",{ref:H,in:"output",stdDeviation:"0.7"})]})})}),e.jsx("div",{className:"glass-surface__content",children:d})]})};function ne({activeHref:d="/ui/",compact:o=!1}){return e.jsx("div",{className:"pulse-header-wrap",children:e.jsx(Z,{width:"100%",height:"auto",borderRadius:18,backgroundOpacity:.12,blur:12,brightness:78,opacity:.92,className:"pulse-glass-header",style:{width:"100%",maxWidth:1264,margin:"0 auto"},children:e.jsxs("div",{className:"pulse-header-inner",children:[e.jsxs("a",{className:"pulse-header-brand",href:"/ui/",children:[e.jsx("img",{src:"/assets/phaeron-wordmark.png",alt:"Phaeron"}),e.jsx("span",{className:"pulse-label",children:"Pulse"})]}),!o&&e.jsx("div",{className:"pulse-header-nav",children:e.jsx(Y,{logo:"/assets/phaeron-wordmark.png",logoAlt:"Phaeron",items:J,activeHref:d,baseColor:"#2d9a8e",pillColor:"#ffffff",pillTextColor:"#22323d",hoveredPillTextColor:"#ffffff",initialLoadAnimation:!1,className:"pulse-pill-nav"})}),e.jsxs("div",{className:"pulse-header-user",children:[e.jsxs("div",{className:"meta",children:[e.jsx("strong",{children:"Alex Curtin"}),e.jsx("span",{children:"Sales · EMEA"})]}),e.jsx("img",{src:"/assets/Headshot.png",alt:"Alex Curtin"})]})]})})})}export{re as N,ne as P,se as S};
