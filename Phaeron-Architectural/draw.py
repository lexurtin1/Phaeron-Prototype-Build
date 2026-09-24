from pathlib import Path
from math import sin,cos,pi,hypot
import random
from html import escape
import json

ROOT=Path(__file__).resolve().parent
ART=ROOT/'source'/'assets'
ART.mkdir(parents=True,exist_ok=True)

STYLE='''
polygon,path,line,circle,ellipse{vector-effect:non-scaling-stroke}
.surface{fill:#ffffff;stroke:#5b7aab;stroke-width:.85;stroke-linejoin:round}
.edge-left{fill:#f5f8fc;stroke:#5b7aab;stroke-width:.8;stroke-linejoin:round}
.edge-right{fill:#eef3f9;stroke:#5b7aab;stroke-width:.8;stroke-linejoin:round}
.ink{fill:none;stroke:#5b7aab;stroke-width:.75;stroke-linejoin:round;stroke-linecap:round}
.faint{fill:none;stroke:#b8c7de;stroke-width:.45;stroke-linejoin:round}
.blue{fill:none;stroke:#008cff;stroke-width:1.05;stroke-linejoin:round;stroke-linecap:round}
.pale-blue{fill:#ffffff;stroke:#7ab8e8;stroke-width:.75}
.dash{fill:none;stroke:#7a92b0;stroke-width:.75;stroke-dasharray:4 5}
.boundary{fill:none;stroke:#008cff;stroke-width:.9;stroke-dasharray:5 6}
.white-node{fill:#fff;stroke:#1b3a6b;stroke-width:.85}
.port{fill:#fff;stroke:#008cff;stroke-width:1}
.solid-blue{fill:#008cff;stroke:none}
.red{fill:#9f1239;stroke:none}
.art-layer{--accent:#9f1239;--surface:#ffffff;--side:#fff1f2;--wire:#be123c}
.tone-1{--accent:#1b3a6b;--surface:#ffffff;--side:#e4eaf3;--wire:#2f5285}
.tone-2{--accent:#2f5285;--surface:#ffffff;--side:#e8eef6;--wire:#5b7aab}
.tone-3{--accent:#008cff;--surface:#ffffff;--side:#e8f4ff;--wire:#4a8ec4}
.surface{fill:var(--surface);stroke:var(--accent)}.edge-left,.edge-right{fill:var(--side);stroke:var(--accent)}
.ink{stroke:var(--wire)}.faint{stroke:var(--wire);opacity:.38}.blue,.boundary{stroke:var(--accent)}
.pale-blue{fill:#ffffff;stroke:var(--accent)}.dash{stroke:var(--accent);opacity:.65}
.port,.white-node{stroke:var(--accent)}.solid-blue{fill:var(--accent)}
.department-label{font:600 22px "Open Sans",system-ui,sans-serif;fill:#0c1a2e;text-anchor:middle}
.hub-label{font:600 13px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:1.2px;fill:#008cff;text-anchor:middle}
.label-bg{fill:#fff;stroke:none}.callout text{font:600 20px "Open Sans",system-ui,sans-serif;letter-spacing:.1px;fill:currentColor}.callout path{fill:none;stroke:currentColor;stroke-width:1}.callout circle{fill:currentColor}
.callout[data-layer="0"]{color:#9f1239}.callout[data-layer="1"]{color:#1b3a6b}.callout[data-layer="2"]{color:#2f5285}.callout[data-layer="3"]{color:#008cff}
.flow{fill:none;stroke:#008cff;stroke-width:1.15;stroke-dasharray:4 8;opacity:.55}
.spotlight .surface{stroke-width:1.15}.spotlight .edge-left,.spotlight .edge-right{stroke-width:1.15}
.final-state .department-copy{opacity:0}
'''

# Explicit colours also render consistently in SVG viewers without CSS variables.
# L0 crimson, L1 navy, L2 mid navy-blue, L3 electric blue (top). White surfaces, distinct sides/wires.
for i,(accent,surface,side,wire) in enumerate([
    ('#9f1239','#ffffff','#fff1f2','#be123c'),
    ('#1b3a6b','#ffffff','#e4eaf3','#2f5285'),
    ('#2f5285','#ffffff','#e8eef6','#5b7aab'),
    ('#008cff','#ffffff','#e8f4ff','#4a8ec4')]):
    tone=f'.tone-{i}'
    STYLE+=f'{tone} .surface{{fill:{surface};stroke:{accent}}}{tone} .edge-left,{tone} .edge-right{{fill:{side};stroke:{accent}}}{tone} .ink{{stroke:{wire}}}{tone} .faint{{stroke:{wire}}}{tone} .blue,{tone} .boundary,{tone} .dash{{stroke:{accent}}}{tone} .pale-blue{{fill:#ffffff;stroke:{accent}}}{tone} .port,{tone} .white-node{{stroke:{accent}}}{tone} .solid-blue{{fill:{accent}}}'
STYLE+=' .lowlight .surface{fill:#f8fafc!important}.lowlight .edge-left,.lowlight .edge-right{fill:#e9eff5!important}.lowlight .ink,.lowlight .blue,.lowlight .faint{opacity:.35}.spotlight .surface,.spotlight .edge-left,.spotlight .edge-right{stroke-width:1.25}'

def n(v):return f'{v:.2f}'
def p(u,v,z=0):return (600+.9*(u-v),290+.52*(u+v)-z)
def pts(a):return ' '.join(n(x)+','+n(y) for x,y in a)
def poly(a,c='surface',extra=''):return f'<polygon class="{c}" points="{pts(a)}" {extra}/>'
def path(d,c='ink',extra=''):return f'<path class="{c}" d="{d}" {extra}/>'
def line(a,b,c='ink'):return path(f'M{n(a[0])},{n(a[1])}L{n(b[0])},{n(b[1])}',c)
def circle(a,r,c='white-node'):return f'<circle cx="{n(a[0])}" cy="{n(a[1])}" r="{r}" class="{c}"/>'
def ellipse(a,rx,ry,c='white-node'):return f'<ellipse cx="{n(a[0])}" cy="{n(a[1])}" rx="{rx}" ry="{ry}" class="{c}"/>'
def plane(u,v,w,h,z=0,c='surface'):return poly([p(u,v,z),p(u+w,v,z),p(u+w,v+h,z),p(u,v+h,z)],c)
def prism(u,v,w,h,z=0,depth=7,top='surface'):
    a,b,c,d=[p(u,v,z),p(u+w,v,z),p(u+w,v+h,z),p(u,v+h,z)]
    down=lambda x:(x[0],x[1]+depth)
    return poly([d,c,down(c),down(d)],'edge-left')+poly([c,b,down(b),down(c)],'edge-right')+poly([a,b,c,d],top)
def grid():
    s=''
    for i in range(20,431,18):
        for j in range(20,431,18):
            a=p(i,j);s+=path(f'M{n(a[0]-1.6)},{n(a[1])}h3.2','faint')
    return '<g opacity=".72">'+s+'</g>'
def base():
    return '<ellipse cx="600" cy="791" rx="290" ry="12" fill="#0c1a2e" opacity=".04" style="filter:blur(10px)"/>'+prism(0,0,450,450,depth=16)+grid()
def stroke_uv(a,b,z=0,c='ink'):return line(p(*a,z),p(*b,z),c)
def detail_record(u,v,w,h,z=0,kind=0):
    s=prism(u,v,w,h,z,4)
    if kind%3==0:
        for i in range(3):s+=stroke_uv((u+4,v+5+i*5),(u+w-5-(i%2)*6,v+5+i*5),z+.2,'faint')
    elif kind%3==1:
        for i in range(3):s+=plane(u+4+i*6,v+5,3,h-10,z+.3,'pale-blue')
    else:
        s+=stroke_uv((u+4,v+h-5),(u+w-5,v+5),z+.3,'faint')
    return s

def information():
    rng=random.Random(19);s=base()
    # Structured internal records and a looser, varied external field.
    rows=[]
    for i in range(12):
        for j in range(12):
            u,v=35+i*31,35+j*31
            if u+v>785 or u+v<85:continue
            if u<v-18:rows.append((u,v,23,21,6+(i+j)%4*3,(i+j)%3))
            elif u>v+24 and rng.random()>.47:rows.append((u+rng.uniform(-4,4),v+rng.uniform(-3,3),rng.choice([20,26]),20,6+rng.randrange(3)*5,i%3))
    for row in sorted(rows,key=lambda x:x[0]+x[1]):s+=detail_record(*row)
    s+=stroke_uv((29,29),(419,419),1,'blue')
    for t in [100,210,320]:
        s+=stroke_uv((t-10,t+45),(t+35,t),1,'faint')
        s+=circle(p(t,t,1),2.4,'solid-blue')
    return s

def wired(a,b,c='ink'):
    x,y=a;xx,yy=b
    return path(f'M{n(x)},{n(y)} C{n(x)},{n(y+22)} {n(xx)},{n(yy+22)} {n(xx)},{n(yy)}',c)

def node(u,v,z=14,r=7,active=False):
    a=p(u,v,z);b=p(u,v,1)
    s=line(a,b,'faint')+ellipse(b,4,2,'faint')
    s+=ellipse((a[0],a[1]+4),r,r*.6,'white-node')+ellipse(a,r,r*.6,'port' if active else 'white-node')
    if active:s+=circle(a,2,'solid-blue')
    return s

def ontology():
    s=base();rng=random.Random(24);nodes=[];clusters=[]
    for k,(u,v) in enumerate([(105,112),(319,99),(322,321),(105,318)]):
        ids=[]
        for j in range(7):
            angle=j*2*pi/7+.4*k
            a=u+48*cos(angle);b=v+44*sin(angle);ids.append(len(nodes));nodes.append((a,b,15+rng.randrange(28),7 if j%3 else 10))
        clusters.append(ids)
    # Wire clusters have a few deliberate bridges, rather than an all-to-all mesh.
    edges=[]
    for ids in clusters:
        edges +=[(ids[j],ids[(j+1)%7]) for j in range(7)]
        edges +=[(ids[0],ids[3]),(ids[0],ids[5]),(ids[2],ids[5])]
    for a,b in [(2,9),(12,15),(19,23),(26,4)]:edges.append((a,b))
    for a,b in edges:s+=wired(p(*nodes[a][:3]),p(*nodes[b][:3]),'ink')
    for k,ids in enumerate(clusters):
        a=nodes[ids[0]];s+=wired(p(*a[:3]),p(225,225,30),'blue' if k in [0,2] else 'ink')
    for i,(u,v,z,r) in sorted(enumerate(nodes),key=lambda t:sum(t[1][:2])):s+=node(u,v,z,r,i in [0,14])
    # A small junction, not an oversized orb.
    s+=prism(203,203,44,44,28,9,'pale-blue')
    for t in range(5):s+=stroke_uv((209,209+t*7),(239,209+t*7),29,'faint')
    s+=circle(p(225,225,29),3,'solid-blue')
    return s

def context():
    s=base()
    for inset in [24,43,65]:s+=plane(inset,inset,450-2*inset,450-2*inset,1,'dash')
    # Four bounded regions share the same physical plate.
    for u,v in [(87,87),(252,87),(87,252),(252,252)]:
        s+=plane(u,v,111,111,1,'faint')
        for a in range(4):
            for b in range(4):s+=plane(u+11+a*24,v+11+b*24,13,10,1,'faint')
    for u,v in [(198,142),(252,142),(142,198),(142,252),(307,198),(307,252),(198,307),(252,307)]:s+=ellipse(p(u,v,2),3,1.7,'port')
    # Fine paths enter at explicit gateways.
    for a,b in [((198,142),(252,142)),((142,198),(142,252)),((307,198),(307,252)),((198,307),(252,307))]:s+=stroke_uv(a,b,2,'blue')
    for i,(u,v) in enumerate([(252,87),(87,252)]):
        g=plane(u-7,v-7,125,125,2,'pale-blue')+plane(u-7,v-7,125,125,3,'boundary')
        for a in range(3):
            for b in range(3):g+=detail_record(u+13+a*28,v+13+b*28,19,17,7,(a+b)%3)
        s+=f'<g>{g}</g>'
    s+=prism(205,205,40,40,9,5,'pale-blue')
    s+=stroke_uv((212,212),(238,238),10,'blue')+stroke_uv((212,238),(238,212),10,'blue')
    return s

def ui_tile(u,v,w,h,z,kind):
    s=prism(u,v,w,h,z,5)
    s+=plane(u+8,v+8,w-16,h-16,z+.2,'faint')
    s+=stroke_uv((u+8,v+22),(u+w-8,v+22),z+.3,'ink')
    for a in range(3):s+=ellipse(p(u+14+a*7,v+15,z+.4),1.6,1,'port')
    if kind=='chart':
        for i,hh in enumerate([18,32,25,46,38]):s+=plane(u+15+i*12,v+h-16-hh,7,hh,z+.5,'pale-blue')
        s+=stroke_uv((u+12,v+h-14),(u+w-12,v+h-14),z+.7,'faint')
    elif kind=='globe':
        x,y=p(u+w/2,v+h/2+9,z+21)
        s+=f'<circle cx="{n(x)}" cy="{n(y)}" r="25" class="white-node"/>'
        s+=ellipse((x,y),12,25,'faint')+ellipse((x,y),25,9,'faint')+line((x-25,y),(x+25,y),'faint')
        s+=circle((x+15,y-9),2.5,'solid-blue')+circle((x-10,y+7),2,'solid-blue')
    elif kind=='brief':
        for i,wid in enumerate([58,48,58,38]):
            s+=stroke_uv((u+15,v+34+i*13),(u+15+wid,v+34+i*13),z+.4,'blue' if i==0 else 'ink')
            s+=stroke_uv((u+15,v+39+i*13),(u+15+wid-8,v+39+i*13),z+.4,'faint')
    elif kind=='matrix':
        for i in range(3):
            for j in range(3):s+=plane(u+16+i*20,v+32+j*19,13,11,z+.3,'pale-blue' if (i+j)%3==0 else 'faint')
    else:
        for a,b in [((20,35),(53,52)),((53,52),(78,76)),((53,52),(22,78))]:s+=stroke_uv((u+a[0],v+a[1]),(u+b[0],v+b[1]),z+.3,'ink')
        for a,b in [(20,35),(53,52),(78,76),(22,78)]:s+=plane(u+a-5,v+b-4,10,8,z+.4,'pale-blue')
    return s

def outcomes():
    s=base();hub=p(225,225,24)
    departments=[]
    for i,name in enumerate(['Legal','Operations','Finance','Product','Commercial']):
        a=-pi/2+i*2*pi/5;u=225+158*cos(a);v=225+158*sin(a)
        departments.append((u,v,name,i))
        end=p(u,v,24);s+=line(hub,end,'blue')
        d=f'M{n(hub[0])},{n(hub[1])}L{n(end[0])},{n(end[1])}'
        s+=path(d,'flow')
        s+=line(p(u,v,0),end,'ink')+ellipse(p(u,v,1),4,2,'port')
    # Five restrained, distinct profiles around one shared context hub.
    for u,v,name,i in sorted(departments,key=lambda x:x[0]+x[1]):
        if name=='Commercial':s+=prism(u-39,v-30,78,60,24,9,'pale-blue')
        elif name=='Operations':
            s+=prism(u-35,v-31,70,62,24,9)
            for j in range(3):s+=prism(u-24+j*16,v-20,10,40,29+j*3,4,'pale-blue')
        elif name=='Product':
            a=p(u,v,24);s+=ellipse((a[0],a[1]+7),45,25,'pale-blue')+ellipse(a,45,25,'white-node')+ellipse(a,27,15,'port')
        else:
            count=6 if name=='Legal' else 8
            corners=[p(u+42*cos(j*2*pi/count),v+42*sin(j*2*pi/count),24) for j in range(count)]
            s+=poly([(x,y+7) for x,y in corners],'pale-blue')+poly(corners,'surface')
        if name in ['Commercial','Finance']:
            for j,h in enumerate([14,28,21]):s+=plane(u-20+j*13,v+16-h,7,h,25,'pale-blue')
        elif name=='Legal':s+=stroke_uv((u-16,v),(u+16,v),25,'blue')+stroke_uv((u,v-16),(u,v+16),25,'blue')
        x,y=p(u,v,24)
        yy=y+62 if name=='Finance' else y-46
        s+=f'<g class="department-copy"><rect x="{n(x-84)}" y="{n(yy-22)}" width="168" height="31" rx="2" class="label-bg"/><text x="{n(x)}" y="{n(yy)}" class="department-label">{name}</text></g>'
    s+=prism(188,188,74,74,25,10,'pale-blue')
    for a,b in [((206,211),(237,218)),((237,218),(225,242)),((225,242),(206,211))]:s+=stroke_uv(a,b,26,'blue')
    for u,v in [(206,211),(237,218),(225,242)]:s+=circle(p(u,v,27),3,'red')
    x,y=hub;s+=f'<rect x="{n(x-87)}" y="{n(y+39)}" width="174" height="27" class="label-bg"/><text x="{n(x)}" y="{n(y+57)}" class="hub-label">SHARED CONTEXT</text>'
    return s

BUILDERS=[information,context,ontology,outcomes]
NAMES=['Data, Logic & Action Services','Security & Governance','Ontology Context Engine','Ontology Language & Toolchain']

# Assembled top-layer transform (matches story.js pose for scene >= 4)
TOP_Y=-185
TOP_SCALE=.96

def assembled_xy(u,v,z=0):
    """Map plate UV into final architecture viewBox coords (top layer assembled)."""
    lx,ly=p(u,v,z)
    ax=600+TOP_SCALE*(lx-600)
    ay=(540+TOP_Y)+TOP_SCALE*(ly-540)
    return ax,ay

TILE_STYLE='''
.tile-edge{fill:#fff;stroke:#008cff;stroke-width:1;stroke-linejoin:round}
.tile-side{fill:#f5faff;stroke:#7ab8e8;stroke-width:.85;stroke-linejoin:round}
.tile-line{fill:none;stroke:#008cff;stroke-width:.9;stroke-linecap:round;stroke-linejoin:round}
.tile-soft{fill:none;stroke:#7ab8e8;stroke-width:.75}
.tile-faint{fill:#e8f4ff;stroke:#7ab8e8;stroke-width:.7}
.tile-dot{fill:#008cff;fill-opacity:.55}
.tile-label{font:600 10px "Open Sans",system-ui,sans-serif;letter-spacing:.02em;fill:#0c1a2e;text-anchor:middle}
.tile-micro{font:7.5px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.04em;fill:#3d4f66;text-anchor:middle}
.tile-port{fill:#008cff;fill-opacity:.35;stroke:none}
'''

def iso_tile_paths(s=.55):
    """Presentation-style isometric diamond scaled into architecture space."""
    # Original tile roughly 240×138; scale keeps four tiles on the top-plate ridge
    w,h=120*s,64*s
    tip=132*s
    edge=f'M0 0 {n(w)} {n(h)} 0 {n(tip)} {n(-w)} {n(h)}Z'
    side=f'M{n(-w)} {n(h)} 0 {n(tip)} {n(w)} {n(h)}v{n(6*s)}L0 {n(tip+6*s)} {n(-w)} {n(h+6*s)}Z'
    soft=f'M{n(-104*s)} {n(h)} 0 {n(12*s)} {n(104*s)} {n(h)} 0 {n(120*s)}Z'
    return edge,side,soft,tip

def tile_detail(kind,s=.55):
    g=''
    if kind=='chart':
        g+=f'<path class="tile-line" d="m{n(-64*s)} {n(72*s)} {n(14*s)} {n(-8*s)} {n(10*s)} {n(5*s)} {n(14*s)} {n(-8*s)} {n(12*s)} {n(7*s)} {n(16*s)} {n(-9*s)} {n(10*s)} {n(5*s)}"/>'
        g+=f'<circle cx="{n(22*s)}" cy="{n(66*s)}" r="{n(2.5*s)}" class="tile-dot"/>'
    elif kind=='profile':
        g+=f'<circle cx="{n(-22*s)}" cy="{n(66*s)}" r="{n(14*s)}" class="tile-edge"/>'
        g+=f'<circle cx="{n(-22*s)}" cy="{n(62*s)}" r="{n(5*s)}" class="tile-faint"/>'
        g+=f'<path class="tile-line" d="M{n(-32*s)} {n(76*s)}q{n(10*s)} {n(-10*s)} {n(20*s)} 0"/>'
        g+=f'<path class="tile-line" d="M{n(6*s)} {n(52*s)} {n(62*s)} {n(90*s)}"/>'
        g+=f'<circle cx="{n(54*s)}" cy="{n(84*s)}" r="{n(2.5*s)}" class="tile-dot"/>'
    elif kind=='radar':
        g+=f'<ellipse cx="0" cy="{n(68*s)}" rx="{n(58*s)}" ry="{n(32*s)}" class="tile-soft"/>'
        g+=f'<ellipse cx="0" cy="{n(68*s)}" rx="{n(38*s)}" ry="{n(21*s)}" class="tile-soft"/>'
        g+=f'<ellipse cx="0" cy="{n(68*s)}" rx="{n(16*s)}" ry="{n(9*s)}" class="tile-soft"/>'
        g+=f'<path class="tile-line" d="M{n(-58*s)} {n(68*s)}h{n(116*s)}M0 {n(36*s)}v{n(64*s)}"/>'
        g+=f'<circle cx="{n(32*s)}" cy="{n(54*s)}" r="{n(3*s)}" class="tile-dot"/>'
    elif kind=='workflow':
        for dx in (-66,-26,14):
            g+=f'<path class="tile-line" d="m{n(dx*s)} {n(50*s)} {n(28*s)} {n(15*s)} {n(-14*s)} {n(9*s)} {n(-28*s)} {n(-16*s)}Z"/>'
        g+=f'<circle cx="{n(16*s)}" cy="{n(60*s)}" r="{n(2.5*s)}" class="tile-dot"/>'
    elif kind=='globe':
        g+=f'<ellipse cx="0" cy="{n(68*s)}" rx="{n(54*s)}" ry="{n(30*s)}" class="tile-line"/>'
        g+=f'<ellipse cx="0" cy="{n(68*s)}" rx="{n(20*s)}" ry="{n(30*s)}" class="tile-soft"/>'
        g+=f'<path class="tile-soft" d="M{n(-50*s)} {n(56*s)}h{n(100*s)}M{n(-52*s)} {n(70*s)}h{n(104*s)}M0 {n(38*s)}v{n(60*s)}"/>'
        g+=f'<circle cx="{n(24*s)}" cy="{n(56*s)}" r="{n(2.5*s)}" class="tile-dot"/>'
    elif kind=='bars':
        g+=f'<path class="tile-line" d="M{n(-60*s)} {n(78*s)}V{n(52*s)}h{n(22*s)}v{n(26*s)}ZM{n(-28*s)} {n(78*s)}V{n(44*s)}h{n(22*s)}v{n(34*s)}ZM{n(4*s)} {n(78*s)}V{n(56*s)}h{n(22*s)}v{n(22*s)}ZM{n(36*s)} {n(78*s)}V{n(40*s)}h{n(22*s)}v{n(38*s)}Z"/>'
        g+=f'<circle cx="{n(50*s)}" cy="{n(44*s)}" r="{n(2.5*s)}" class="tile-dot"/>'
    elif kind=='brief':
        g+=f'<path class="tile-line" d="m{n(-46*s)} {n(48*s)} {n(34*s)} {n(-18*s)} {n(58*s)} {n(32*s)} {n(-34*s)} {n(18*s)}Z"/>'
        g+=f'<path class="tile-faint" d="m{n(-28*s)} {n(58*s)} {n(34*s)} {n(-18*s)} {n(44*s)} {n(24*s)} {n(-34*s)} {n(18*s)}Z"/>'
        g+=f'<path class="tile-line" d="m{n(-32*s)} {n(62*s)} {n(22*s)} {n(-12*s)}M{n(-24*s)} {n(72*s)}l{n(22*s)} {n(-12*s)}"/>'
        g+=f'<circle cx="{n(42*s)}" cy="{n(56*s)}" r="{n(2.5*s)}" class="tile-dot"/>'
    else:  # pack
        g+=f'<path class="tile-edge" d="m{n(-42*s)} {n(50*s)} {n(30*s)} {n(-16*s)} {n(52*s)} {n(28*s)} {n(-30*s)} {n(16*s)}Z"/>'
        g+=f'<path class="tile-faint" d="m{n(-32*s)} {n(60*s)} {n(30*s)} {n(-16*s)} {n(42*s)} {n(23*s)} {n(-30*s)} {n(16*s)}Z"/>'
        g+=f'<path class="tile-line" d="m{n(-24*s)} {n(64*s)} {n(16*s)} {n(-9*s)}M{n(-16*s)} {n(74*s)}l{n(16*s)} {n(-9*s)}"/>'
    return g

def place_tile(cx,cy,label,micro,kind,s=.55):
    edge,side,soft,tip=iso_tile_paths(s)
    port_y=cy+tip
    body=f'<g class="surf-tile" data-port-x="{n(cx)}" data-port-y="{n(port_y)}" transform="translate({n(cx)} {n(cy)})">'
    body+=f'<text class="tile-label" x="0" y="{n(-18*s)}">{escape(label)}</text>'
    body+=f'<text class="tile-micro" x="0" y="{n(-5*s)}">{escape(micro)}</text>'
    body+=f'<path class="tile-side" d="{side}"/><path class="tile-edge" d="{edge}"/><path class="tile-soft" d="{soft}"/>'
    body+=tile_detail(kind,s)
    body+=f'<circle class="tile-port" cx="0" cy="{n(tip)}" r="{n(2.2*s)}"/>'
    body+='</g>'
    return body,(cx,port_y)

def ridge_positions(bank='a'):
    """Four LTR seats on the far ridge of the assembled top plate.

    Anchors sit on a tip-side u+v contour (behind the department ring).
    Seats fan wider in screen-x so diamonds clear each other, with short
    non-crossing spokes back to the ridge ports.
    """
    # Contour behind the dept ring (Commercial ~sumuv 251). Seats mildly
    # fanned so four diamonds clear each other; dept labels hide in final-state.
    if bank=='a':
        sumuv=175
        s=.40
        gap=10
        fan=1.42
        stagger=(6,0,0,6)
    else:
        # One step further toward the tip / higher on screen
        sumuv=118
        s=.36
        gap=14
        fan=1.62
        stagger=(5,0,0,5)
    tip=132*s
    lift=tip+gap
    left=assembled_xy(0,sumuv,z=3)
    right=assembled_xy(sumuv,0,z=3)
    midx=(left[0]+right[0])/2
    seats=[]
    anchors=[]
    for i,t in enumerate((0.05,0.35,0.65,0.95)):
        ax=left[0]+(right[0]-left[0])*t
        # recover u from screen-x on the contour
        u=(sumuv+(ax-600)/0.864)/2
        v=sumuv-u
        ax,ay=assembled_xy(u,v,z=3)
        anchors.append((ax,ay))
        sx=midx+(ax-midx)*fan
        seats.append((sx,ay-lift+stagger[i],s))
    return seats,anchors

def build_tile_bank(bank):
    if bank=='a':
        meta=[
            ('Commercial Analytics','PIPELINE · REVENUE','chart'),
            ('Client Intelligence','PROFILE · HISTORY','profile'),
            ('Opportunity Radar','SIGNALS · PRIORITY','radar'),
            ('Service Operations','WORKFLOW · EXCEPTIONS','workflow'),
        ]
        title='Phaeron Layer 08A front-end system tiles'
    else:
        meta=[
            ('Market Globe','MARKETS · EVENTS','globe'),
            ('Executive Dashboard','KPI · EXPOSURE','bars'),
            ('Research & Insights','BRIEFING · EVIDENCE','brief'),
            ('Reporting Packs','BOARD · CLIENT','pack'),
        ]
        title='Phaeron Layer 08B executive surfaces'
    seats,anchors=ridge_positions(bank)
    body=''
    ports=[]
    for (cx,cy,s),(label,micro,kind),anchor in zip(seats,meta,anchors):
        g,(px,py)=place_tile(cx,cy,label,micro,kind,s)
        body+=g
        ports.append((px,py,anchor[0],anchor[1]))
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 75 1280 960" role="img" aria-label="{escape(title)}"><title>{escape(title)}</title><style>{TILE_STYLE}</style>{body}</svg>'
    return svg,ports

def callouts():
    s='<g id="stack-labels">'
    for i,(right,words) in enumerate([(True,['DATA, LOGIC','& ACTION SERVICES']),(False,['SECURITY','& GOVERNANCE']),(True,['ONTOLOGY','CONTEXT ENGINE']),(False,['ONTOLOGY','LANGUAGE &','TOOLCHAIN'])]):
        y=584+[160,45,-70,-185][i];x=1035 if right else 20;anchor=885 if right else 315;end=1020 if right else 220
        s+=f'<g class="callout" data-layer="{i}"><path d="M{anchor},{y}H{end}"/><circle cx="{anchor}" cy="{y}" r="3"/>'
        for j,w in enumerate(words):s+=f'<text x="{x}" y="{y-10+j*25}">{escape(w)}</text>'
        s+='</g>'
    return s+'</g>'
def wrap(body,title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 75 1280 960" role="img" aria-label="{escape(title)}"><title>{escape(title)}</title><style>{STYLE}</style>{body}</svg>'

def build():
    for old in ART.glob('0*.svg'):old.unlink()
    layers=[f'<g id="layer-{i}" class="art-layer tone-{i}">{fn()}</g>' for i,fn in enumerate(BUILDERS)]
    for i,body in enumerate(layers):(ART/f'0{i+1}-{["information","governance","ontology","departments"][i]}.svg').write_text(wrap(body,NAMES[i]))
    shadow='<ellipse cx="600" cy="963" rx="320" ry="17" fill="#0c1a2e" opacity=".07" style="filter:blur(12px)"/>'
    assembled=''
    for i,body in enumerate(layers):
        assembled+=f'<g transform="translate(600 {540+[160,45,-70,-185][i]}) scale(.96) translate(-600 -540)">{body}</g>'
    (ART/'Phaeron-complete.svg').write_text(wrap(shadow+assembled+callouts(),'Phaeron complete architecture'))
    # Architecture-native 8a / 8b tiles (same viewBox as the stack)
    svg_a,ports_a=build_tile_bank('a')
    svg_b,ports_b=build_tile_bank('b')
    (ART/'tiles-8a.svg').write_text(svg_a)
    (ART/'tiles-8b.svg').write_text(svg_b)
    # Port map for story.js (viewBox absolute coords)
    port_map={
        'a':[{'port':[round(px,1),round(py,1)],'anchor':[round(ax,1),round(ay,1)]} for px,py,ax,ay in ports_a],
        'b':[{'port':[round(px,1),round(py,1)],'anchor':[round(ax,1),round(ay,1)]} for px,py,ax,ay in ports_b],
    }
    (ART/'tile-ports.js').write_text('/* generated by draw.py */\nwindow.PHAERON_TILE_PORTS='+json.dumps(port_map)+';\n')
    return '<svg xmlns="http://www.w3.org/2000/svg" id="architecture" viewBox="0 75 1280 960" role="img" aria-label="Phaeron complete architecture"><title id="art-title">Phaeron complete architecture</title><style>'+STYLE+'</style>'+shadow+''.join(layers)+callouts()+'</svg>'

if __name__=='__main__':build()

