import{r as s,g as D,j as g,c as V}from"../assets/pulse-ui-DSJt-J6e.js";import{R as X,T as Y,P as $,V as N,M as O}from"../assets/Triangle-DsNpnrqg.js";import{G as J}from"../assets/GlareHover-zkn32NPC.js";const Q=({text:t,as:a="div",typingSpeed:n=50,initialDelay:l=0,pauseDuration:c=2e3,deletingSpeed:u=30,loop:x=!0,className:b="",showCursor:o=!0,hideCursorWhileTyping:m=!1,cursorCharacter:e="|",cursorClassName:v="",cursorBlinkDuration:d=.5,textColors:j=[],variableSpeed:y,onSentenceComplete:R,startOnVisible:z=!1,reverseMode:E=!1,...K})=>{const[T,q]=s.useState(""),[C,k]=s.useState(0),[r,f]=s.useState(!1),[i,S]=s.useState(0),[L,_]=s.useState(!z),I=s.useRef(null),M=s.useRef(null),p=s.useMemo(()=>Array.isArray(t)?t:[t],[t]),H=s.useCallback(()=>{if(!y)return n;const{min:h,max:A}=y;return Math.random()*(A-h)+h},[y,n]),B=()=>j.length===0?"inherit":j[i%j.length];s.useEffect(()=>{if(!z||!M.current)return;const h=new IntersectionObserver(A=>{A.forEach(F=>{F.isIntersecting&&_(!0)})},{threshold:.1});return h.observe(M.current),()=>h.disconnect()},[z]),s.useEffect(()=>{o&&I.current&&(D.set(I.current,{opacity:1}),D.to(I.current,{opacity:0,duration:d,repeat:-1,yoyo:!0,ease:"power2.inOut"}))},[o,d]),s.useEffect(()=>{if(!L)return;let h;const A=p[i],F=E?A.split("").reverse().join(""):A,W=()=>{if(r)if(T===""){if(f(!1),i===p.length-1&&!x)return;R&&R(p[i],i),S(w=>(w+1)%p.length),k(0),h=setTimeout(()=>{},c)}else h=setTimeout(()=>{q(w=>w.slice(0,-1))},u);else if(C<F.length)h=setTimeout(()=>{q(w=>w+F[C]),k(w=>w+1)},y?H():n);else if(p.length>=1){if(!x&&i===p.length-1)return;h=setTimeout(()=>{f(!0)},c)}};return C===0&&!r&&T===""?h=setTimeout(W,l):W(),()=>clearTimeout(h)},[C,T,r,n,u,c,p,i,x,l,L,E,y,R]);const U=m&&(C<p[i].length||r);return s.createElement(a,{ref:M,className:`text-type ${b}`,...K},g.jsx("span",{className:"text-type__content",style:{color:B()||"inherit"},children:T}),o&&g.jsx("span",{ref:I,className:`text-type__cursor ${v} ${U?"text-type__cursor--hidden":""}`,children:e}))};function Z({hue:t=0,hoverIntensity:a=.2,rotateOnHover:n=!0,forceHoverState:l=!1,backgroundColor:c="#000000"}){const u=s.useRef(null),x=`
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
  `;return s.useEffect(()=>{const o=u.current;if(!o)return;const m=new X({alpha:!0,premultipliedAlpha:!1}),e=m.gl;e.clearColor(0,0,0,0),o.appendChild(e.canvas);const v=new Y(e),d=new $(e,{vertex:x,fragment:b,uniforms:{iTime:{value:0},iResolution:{value:new N(e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height)},hue:{value:t},hover:{value:0},rot:{value:0},hoverIntensity:{value:a},backgroundColor:{value:G(c)}}}),j=new O(e,{geometry:v,program:d});function y(){if(!o)return;const r=window.devicePixelRatio||1,f=o.clientWidth,i=o.clientHeight;m.setSize(f*r,i*r),e.canvas.style.width=f+"px",e.canvas.style.height=i+"px",d.uniforms.iResolution.value.set(e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height)}window.addEventListener("resize",y),y();let R=0,z=0,E=0;const K=.3,T=r=>{const f=o.getBoundingClientRect(),i=r.clientX-f.left,S=r.clientY-f.top,L=f.width,_=f.height,I=Math.min(L,_),M=L/2,p=_/2,H=(i-M)/I*2,B=(S-p)/I*2;Math.sqrt(H*H+B*B)<.8?R=1:R=0},q=()=>{R=0};o.addEventListener("mousemove",T),o.addEventListener("mouseleave",q);let C;const k=r=>{C=requestAnimationFrame(k);const f=(r-z)*.001;z=r,d.uniforms.iTime.value=r*.001,d.uniforms.hue.value=t,d.uniforms.hoverIntensity.value=a;const i=l?1:R;d.uniforms.hover.value+=(i-d.uniforms.hover.value)*.1,n&&i>.5&&(E+=f*K),d.uniforms.rot.value=E,d.uniforms.backgroundColor.value=G(c),m.render({scene:j})};return C=requestAnimationFrame(k),()=>{var r;cancelAnimationFrame(C),window.removeEventListener("resize",y),o.removeEventListener("mousemove",T),o.removeEventListener("mouseleave",q),o.removeChild(e.canvas),(r=e.getExtension("WEBGL_lose_context"))==null||r.loseContext()}},[t,a,n,l,c]),g.jsx("div",{ref:u,className:"orb-container"})}function ee(t,a,n){let l,c,u;if(a===0)l=c=u=n;else{const x=(m,e,v)=>(v<0&&(v+=1),v>1&&(v-=1),v<.16666666666666666?m+(e-m)*6*v:v<.5?e:v<.6666666666666666?m+(e-m)*(.6666666666666666-v)*6:m),b=n<.5?n*(1+a):n+a-n*a,o=2*n-b;l=x(o,b,t+1/3),c=x(o,b,t),u=x(o,b,t-1/3)}return new N(l,c,u)}function G(t){if(t.startsWith("#")){const l=parseInt(t.slice(1,3),16)/255,c=parseInt(t.slice(3,5),16)/255,u=parseInt(t.slice(5,7),16)/255;return new N(l,c,u)}const a=t.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(a)return new N(parseInt(a[1])/255,parseInt(a[2])/255,parseInt(a[3])/255);const n=t.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);if(n){const l=parseInt(n[1])/360,c=parseInt(n[2])/100,u=parseInt(n[3])/100;return ee(l,c,u)}return new N(0,0,0)}function te(){return g.jsxs("div",{className:"intel-empty-enhance",children:[g.jsx("div",{className:"intel-orb-wrap",children:g.jsx(Z,{hue:160,hoverIntensity:.35,rotateOnHover:!0,backgroundColor:"#eef8f6"})}),g.jsx(Q,{text:["Ask Atlas about products, markets, or accounts…","Generate a relationship snapshot for any CTN…","Surface billing, stage, and RM context in seconds…"],typingSpeed:38,pauseDuration:2200,deletingSpeed:22,className:"intel-type",cursorCharacter:"▍",cursorClassName:"intel-cursor",textColors:["#22323d"],loop:!0}),g.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:6},children:["Digital TA stage","BlackRock charging","CTN 303 snapshot"].map(t=>g.jsx(J,{width:"auto",height:"auto",background:"#ffffff",borderColor:"#dcefec",borderRadius:"999px",glareColor:"#2d9a8e",glareOpacity:.22,style:{padding:"8px 14px",fontSize:12,fontWeight:600,color:"#26867d"},children:t},t))})]})}const P=document.getElementById("pulse-react-intelligence");P&&V.createRoot(P).render(g.jsx(s.StrictMode,{children:g.jsx(te,{})}));
