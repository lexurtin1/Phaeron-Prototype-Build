import{r as l,j as y,c as G}from"../assets/pulse-ui-C3zM0ghE.js";import{g as W}from"../assets/index-CzGW6FVa.js";import{R as V,T as X,P as Y,V as M,M as O}from"../assets/Triangle-DsNpnrqg.js";const J=({text:t,as:s="div",typingSpeed:n=50,initialDelay:u=0,pauseDuration:i=2e3,deletingSpeed:v=30,loop:g=!0,className:b="",showCursor:o=!0,hideCursorWhileTyping:h=!1,cursorCharacter:e="|",cursorClassName:f="",cursorBlinkDuration:d=.5,textColors:A=[],variableSpeed:r,onSentenceComplete:m,startOnVisible:w=!1,reverseMode:R=!1,...z})=>{const[C,$]=l.useState(""),[T,k]=l.useState(0),[a,p]=l.useState(!1),[c,K]=l.useState(0),[L,N]=l.useState(!w),E=l.useRef(null),F=l.useRef(null),I=l.useMemo(()=>Array.isArray(t)?t:[t],[t]),_=l.useCallback(()=>{if(!r)return n;const{min:x,max:q}=r;return Math.random()*(q-x)+x},[r,n]),B=()=>A.length===0?"inherit":A[c%A.length];l.useEffect(()=>{if(!w||!F.current)return;const x=new IntersectionObserver(q=>{q.forEach(H=>{H.isIntersecting&&N(!0)})},{threshold:.1});return x.observe(F.current),()=>x.disconnect()},[w]),l.useEffect(()=>{o&&E.current&&(W.set(E.current,{opacity:1}),W.to(E.current,{opacity:0,duration:d,repeat:-1,yoyo:!0,ease:"power2.inOut"}))},[o,d]),l.useEffect(()=>{if(!L)return;let x;const q=I[c],H=R?q.split("").reverse().join(""):q,S=()=>{if(a)if(C===""){if(p(!1),c===I.length-1&&!g)return;m&&m(I[c],c),K(j=>(j+1)%I.length),k(0),x=setTimeout(()=>{},i)}else x=setTimeout(()=>{$(j=>j.slice(0,-1))},v);else if(T<H.length)x=setTimeout(()=>{$(j=>j+H[T]),k(j=>j+1)},r?_():n);else if(I.length>=1){if(!g&&c===I.length-1)return;x=setTimeout(()=>{p(!0)},i)}};return T===0&&!a&&C===""?x=setTimeout(S,u):S(),()=>clearTimeout(x)},[T,C,a,n,v,i,I,c,g,u,L,R,r,m]);const U=h&&(T<I[c].length||a);return l.createElement(s,{ref:F,className:`text-type ${b}`,...z},y.jsx("span",{className:"text-type__content",style:{color:B()||"inherit"},children:C}),o&&y.jsx("span",{ref:E,className:`text-type__cursor ${f} ${U?"text-type__cursor--hidden":""}`,children:e}))};function Q({hue:t=0,hoverIntensity:s=.2,rotateOnHover:n=!0,forceHoverState:u=!1,backgroundColor:i="#000000"}){const v=l.useRef(null),g=`
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `,b=`
    precision highp float;

    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float hover;
    uniform float rot;
    uniform float hoverIntensity;
    uniform vec3 backgroundColor;
    varying vec2 vUv;

    vec3 rgb2yiq(vec3 c) {
      float y = dot(c, vec3(0.299, 0.587, 0.114));
      float i = dot(c, vec3(0.596, -0.274, -0.322));
      float q = dot(c, vec3(0.211, -0.523, 0.312));
      return vec3(y, i, q);
    }
    
    vec3 yiq2rgb(vec3 c) {
      float r = c.x + 0.956 * c.y + 0.621 * c.z;
      float g = c.x - 0.272 * c.y - 0.647 * c.z;
      float b = c.x - 1.106 * c.y + 1.703 * c.z;
      return vec3(r, g, b);
    }
    
    vec3 adjustHue(vec3 color, float hueDeg) {
      float hueRad = hueDeg * 3.14159265 / 180.0;
      vec3 yiq = rgb2yiq(color);
      float cosA = cos(hueRad);
      float sinA = sin(hueRad);
      float i = yiq.y * cosA - yiq.z * sinA;
      float q = yiq.y * sinA + yiq.z * cosA;
      yiq.y = i;
      yiq.z = q;
      return yiq2rgb(yiq);
    }
    
    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
      p3 += dot(p3, p3.yxz + 19.19);
      return -1.0 + 2.0 * fract(vec3(
        p3.x + p3.y,
        p3.x + p3.z,
        p3.y + p3.z
      ) * p3.zyx);
    }
    
    float snoise3(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      vec3 i = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      vec4 h = max(0.6 - vec4(
        dot(d0, d0),
        dot(d1, d1),
        dot(d2, d2),
        dot(d3, d3)
      ), 0.0);
      vec4 n = h * h * h * h * vec4(
        dot(d0, hash33(i)),
        dot(d1, hash33(i + i1)),
        dot(d2, hash33(i + i2)),
        dot(d3, hash33(i + 1.0))
      );
      return dot(vec4(31.316), n);
    }
    
    vec4 extractAlpha(vec3 colorIn) {
      float a = max(max(colorIn.r, colorIn.g), colorIn.b);
      return vec4(colorIn.rgb / (a + 1e-5), a);
    }
    
    const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
    const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
    const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
    const float innerRadius = 0.6;
    const float noiseScale = 0.65;
    
    float light1(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * attenuation);
    }
    
    float light2(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * dist * attenuation);
    }
    
    vec4 draw(vec2 uv) {
      vec3 color1 = adjustHue(baseColor1, hue);
      vec3 color2 = adjustHue(baseColor2, hue);
      vec3 color3 = adjustHue(baseColor3, hue);
      
      float ang = atan(uv.y, uv.x);
      float len = length(uv);
      float invLen = len > 0.0 ? 1.0 / len : 0.0;
      
      float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));
      
      float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
      float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
      float d0 = distance(uv, (r0 * invLen) * uv);
      float v0 = light1(1.0, 10.0, d0);

      v0 *= smoothstep(r0 * 1.05, r0, len);
      float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
      v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
      float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
      
      float a = iTime * -1.0;
      vec2 pos = vec2(cos(a), sin(a)) * r0;
      float d = distance(uv, pos);
      float v1 = light2(1.5, 5.0, d);
      v1 *= light1(1.0, 50.0, d0);
      
      float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
      float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
      
      vec3 colBase = mix(color1, color2, cl);
      float fadeAmount = mix(1.0, 0.1, bgLuminance);
      
      vec3 darkCol = mix(color3, colBase, v0);
      darkCol = (darkCol + v1) * v2 * v3;
      darkCol = clamp(darkCol, 0.0, 1.0);
      
      vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
      lightCol = mix(backgroundColor, lightCol, v0);
      lightCol = clamp(lightCol, 0.0, 1.0);
      
      vec3 finalCol = mix(darkCol, lightCol, bgLuminance);
      
      return extractAlpha(finalCol);
    }
    
    vec4 mainImage(vec2 fragCoord) {
      vec2 center = iResolution.xy * 0.5;
      float size = min(iResolution.x, iResolution.y);
      vec2 uv = (fragCoord - center) / size * 2.0;
      
      float angle = rot;
      float s = sin(angle);
      float c = cos(angle);
      uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
      
      uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
      uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);
      
      return draw(uv);
    }
    
    void main() {
      vec2 fragCoord = vUv * iResolution.xy;
      vec4 col = mainImage(fragCoord);
      gl_FragColor = vec4(col.rgb * col.a, col.a);
    }
  `;return l.useEffect(()=>{const o=v.current;if(!o)return;const h=new V({alpha:!0,premultipliedAlpha:!1}),e=h.gl;e.clearColor(0,0,0,0),o.appendChild(e.canvas);const f=new X(e),d=new Y(e,{vertex:g,fragment:b,uniforms:{iTime:{value:0},iResolution:{value:new M(e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height)},hue:{value:t},hover:{value:0},rot:{value:0},hoverIntensity:{value:s},backgroundColor:{value:D(i)}}}),A=new O(e,{geometry:f,program:d});function r(){if(!o)return;const a=window.devicePixelRatio||1,p=o.clientWidth,c=o.clientHeight;h.setSize(p*a,c*a),e.canvas.style.width=p+"px",e.canvas.style.height=c+"px",d.uniforms.iResolution.value.set(e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height)}window.addEventListener("resize",r),r();let m=0,w=0,R=0;const z=.3,C=a=>{const p=o.getBoundingClientRect(),c=a.clientX-p.left,K=a.clientY-p.top,L=p.width,N=p.height,E=Math.min(L,N),F=L/2,I=N/2,_=(c-F)/E*2,B=(K-I)/E*2;Math.sqrt(_*_+B*B)<.8?m=1:m=0},$=()=>{m=0};o.addEventListener("mousemove",C),o.addEventListener("mouseleave",$);let T;const k=a=>{T=requestAnimationFrame(k);const p=(a-w)*.001;w=a,d.uniforms.iTime.value=a*.001,d.uniforms.hue.value=t,d.uniforms.hoverIntensity.value=s;const c=u?1:m;d.uniforms.hover.value+=(c-d.uniforms.hover.value)*.1,n&&c>.5&&(R+=p*z),d.uniforms.rot.value=R,d.uniforms.backgroundColor.value=D(i),h.render({scene:A})};return T=requestAnimationFrame(k),()=>{var a;cancelAnimationFrame(T),window.removeEventListener("resize",r),o.removeEventListener("mousemove",C),o.removeEventListener("mouseleave",$),o.removeChild(e.canvas),(a=e.getExtension("WEBGL_lose_context"))==null||a.loseContext()}},[t,s,n,u,i]),y.jsx("div",{ref:v,className:"orb-container"})}function Z(t,s,n){let u,i,v;if(s===0)u=i=v=n;else{const g=(h,e,f)=>(f<0&&(f+=1),f>1&&(f-=1),f<.16666666666666666?h+(e-h)*6*f:f<.5?e:f<.6666666666666666?h+(e-h)*(.6666666666666666-f)*6:h),b=n<.5?n*(1+s):n+s-n*s,o=2*n-b;u=g(o,b,t+1/3),i=g(o,b,t),v=g(o,b,t-1/3)}return new M(u,i,v)}function D(t){if(t.startsWith("#")){const u=parseInt(t.slice(1,3),16)/255,i=parseInt(t.slice(3,5),16)/255,v=parseInt(t.slice(5,7),16)/255;return new M(u,i,v)}const s=t.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(s)return new M(parseInt(s[1])/255,parseInt(s[2])/255,parseInt(s[3])/255);const n=t.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);if(n){const u=parseInt(n[1])/360,i=parseInt(n[2])/100,v=parseInt(n[3])/100;return Z(u,i,v)}return new M(0,0,0)}const ee=({width:t="500px",height:s="500px",background:n="#000",borderRadius:u="10px",borderColor:i="#333",children:v,glareColor:g="#ffffff",glareOpacity:b=.5,glareAngle:o=-45,glareSize:h=250,transitionDuration:e=650,playOnce:f=!1,className:d="",style:A={}})=>{const r=g.replace("#","");let m=g;if(/^[0-9A-Fa-f]{6}$/.test(r)){const R=parseInt(r.slice(0,2),16),z=parseInt(r.slice(2,4),16),C=parseInt(r.slice(4,6),16);m=`rgba(${R}, ${z}, ${C}, ${b})`}else if(/^[0-9A-Fa-f]{3}$/.test(r)){const R=parseInt(r[0]+r[0],16),z=parseInt(r[1]+r[1],16),C=parseInt(r[2]+r[2],16);m=`rgba(${R}, ${z}, ${C}, ${b})`}const w={"--gh-width":t,"--gh-height":s,"--gh-bg":n,"--gh-br":u,"--gh-angle":`${o}deg`,"--gh-duration":`${e}ms`,"--gh-size":`${h}%`,"--gh-rgba":m,"--gh-border":i};return y.jsx("div",{className:`glare-hover ${f?"glare-hover--play-once":""} ${d}`,style:{...w,...A},children:v})};function te(){return y.jsxs("div",{className:"intel-empty-enhance",children:[y.jsx("div",{className:"intel-orb-wrap",children:y.jsx(Q,{hue:350,hoverIntensity:.35,rotateOnHover:!0,backgroundColor:"#F2F5FA"})}),y.jsx(J,{text:["Ask Atlas about products, markets, or accounts…","Generate a relationship snapshot for any CTN…","Surface billing, stage, and RM context in seconds…"],typingSpeed:38,pauseDuration:2200,deletingSpeed:22,className:"intel-type",cursorCharacter:"▍",cursorClassName:"intel-cursor",textColors:["#22323d"],loop:!0}),y.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:6},children:["Digital TA stage","BlackRock charging","CTN 303 snapshot"].map(t=>y.jsx(ee,{width:"auto",height:"auto",background:"#ffffff",borderColor:"#E4EAF3",borderRadius:"999px",glareColor:"#1B3A6B",glareOpacity:.22,style:{padding:"8px 14px",fontSize:12,fontWeight:600,color:"#1A3558"},children:t},t))})]})}const P=document.getElementById("pulse-react-intelligence");P&&G.createRoot(P).render(y.jsx(l.StrictMode,{children:y.jsx(te,{})}));
