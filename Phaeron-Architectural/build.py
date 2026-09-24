from pathlib import Path
import zipfile
from draw import build

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'source'
art=build()
chapters=[
 ('information','01 / INFORMATION','Your firm knows more<br>than it can <em>see.</em>','Information sits across your systems, your people and the market. Its value is harder to see when it stays apart.'),
 ('fragmentation','02 / FRAGMENTATION','Every team sees<br>a different <em>part.</em>','Teams work from separate views. The connections that reveal an opportunity or a risk are easily missed.'),
 ('context','03 / CONTEXT','Phaeron connects<br>the <em>picture.</em>','Phaeron connects information to the clients, people and relationships it belongs to, with permissions built in.'),
 ('insight','04 / INSIGHT','See what needs<br><em>attention.</em>','Understand what a new signal means for your business, so the right opportunities and risks reach the right people.')]
sections=''
for i,(id,eyebrow,title,body) in enumerate(chapters):
 tag='h1' if i==0 else 'h2'
 cls=' intro' if i==0 else ' closing' if i==3 else ''
 sections+=f'<section class="chapter{cls}" id="{id}" aria-labelledby="title-{id}"><div class="copy"><p class="eyebrow">{eyebrow}</p><{tag} id="title-{id}">{title}</{tag}><p class="description">{body}</p>'
 if i==0:sections+='<a class="explore" href="#fragmentation"><span aria-hidden="true">↓</span>Explore the story</a>'
 if i==3:sections+='<a class="restart" href="#information">Explore again <span aria-hidden="true">↗</span></a>'
 sections+='</div></section>'
nav_items=[('information','01','Info','nav-tone-0'),('fragmentation','02','Parts','nav-tone-1'),('context','03','Context','nav-tone-2'),('insight','04','Insight','nav-tone-3')]
nav=''.join(f'<a href="#{hid}" class="{tone}"><span class="nav-index">{idx}</span><span class="nav-name">{name}</span></a>' for hid,idx,name,tone in nav_items)
favicon="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M5 10l11-6 11 6-11 6zM5 16l11 6 11-6M5 22l11 6 11-6' fill='none' stroke='%23008cff' stroke-width='2'/%3E%3C/svg%3E"
head='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="description" content="Explore how Phaeron brings information, business relationships, governed context and decisions into one connected system."><title>Phaeron Primary</title>'''+f'<link rel="icon" type="image/svg+xml" href="{favicon}"><link rel="stylesheet" href="styles.css"></head>'
body='''<body><a class="skip" href="#information">Skip to the story</a><header class="header"><a class="brand" href="#information" aria-label="Phaeron, beginning of story"><svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 10l11-6 11 6-11 6zM5 16l11 6 11-6M5 22l11 6 11-6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>PHAERON</a><span class="header-note">BUSINESS CONTEXT / FINANCIAL SERVICES</span><span class="header-count">FOUR LAYERS. ONE SYSTEM.</span></header><main class="story"><div class="chapters">'''+sections+'''</div><aside class="stage" aria-label="Phaeron architectural story"><div class="stage-top"><span>PHAERON / SYSTEM VIEW</span></div><div class="art"><span class="cross cross-a" aria-hidden="true"></span><span class="cross cross-b" aria-hidden="true"></span>'''+art+'''</div><div class="stage-caption"><div><span class="caption-index" id="caption-index">01 / 04</span><h3 id="caption-title">Information, everywhere.</h3></div><span class="caption-state" id="caption-state">ASSEMBLED</span></div><nav class="layer-nav" aria-label="Story chapters">'''+nav+'''</nav></aside></main><footer class="footer"><span>PHAERON</span><span>BUSINESS CONTEXT. HUMAN JUDGMENT.</span><a href="#information">Back to the beginning ↑</a></footer><div class="progress" aria-hidden="true"><span id="progress"></span></div><script src="story.js"></script><noscript><style>.stage{display:none}.story{display:block}.chapter{min-height:70vh;max-width:850px;margin:auto}</style></noscript></body></html>'''
page=head+body
(SOURCE/'index.html').write_text(page)
standalone=page.replace('<link rel="stylesheet" href="styles.css">','<style>'+ (SOURCE/'styles.css').read_text()+'</style>').replace('<script src="story.js"></script>','<script>'+(SOURCE/'story.js').read_text()+'</script>')
(ROOT/'Phaeron.html').write_text(standalone)
(ROOT/'README.txt').write_text('PHAERON PRIMARY ARCHITECTURAL STORY\n\nOpen Phaeron.html in a modern browser, or use pulse/tools/architectural in Studio.\n\nScroll through Value Prop chapters 01-04 on the assembled stack.\n\nFOUR LAYERS, BOTTOM TO TOP\n1. Data: crimson.\n2. Governance: navy.\n3. Ontology Context Engine: mid navy-blue.\n4. Departments: electric blue.\n\nTo rebuild, run python build.py from this directory.\n')
out=ROOT.parent/'download'/'Phaeron-Architectural-Scrollytelling.zip'
out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name in ['Phaeron.html','README.txt','build.py','draw.py']:z.write(ROOT/name,'Phaeron-Architectural/'+name)
 for p in sorted(SOURCE.rglob('*')):
  if p.is_file():z.write(p,'Phaeron-Architectural/source/'+str(p.relative_to(SOURCE)))
print(out)
