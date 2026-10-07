#!/usr/bin/env python3
"""The magazine cover, generated rather than patched.

Tony drew the cover; this rebuilds it as vector so it scales, so each edition
can put its own title over it, and so the things in it can move. After three
rounds of hand-editing the SVG and breaking its stylesheet each time, it is
generated from here and the file is never touched by hand again.

What moves, and how fast — slowest first, so nothing pulls at a reader:
  the sun     150s   rises out of the ridge, crosses, goes down the far side
  the beams    90s   turning inside the sun, which travels as one body
  the eagle    54s   high over everything, wings beating every 3.6s
  the runner   18s   the ridge, at a runner's cadence, already going on arrival

Run:  python3 _tools/build-cover.py
"""
import math, os

W, H = 1600, 760
GOLD, CREAM, INK = "#D7A738", "#FEF7E7", "#17150E"
BACK, MID, FRONT, BLUE = "#55915A", "#488448", "#376D3B", "#2F59A3"
CX, CY, R = 470, 250, 118           # where the sun sits before it travels

def ridge(points):
    return ("M -20,%d " % H) + " ".join("L %d,%d" % p for p in points) + " L %d,%d Z" % (W + 20, H)

back  = [(-20,430),(150,300),(300,400),(470,250),(640,380),(820,260),(1000,390),(1180,290),(1360,400),(1620,310)]
mid   = [(-20,520),(170,380),(330,490),(520,330),(700,470),(900,350),(1090,480),(1300,370),(1620,470)]
front = [(-20,640),(200,500),(420,610),(640,470),(880,600),(1120,490),(1380,610),(1620,520)]
RUN   = "M -40,640 " + " ".join("L %d,%d" % p for p in front[1:])

rays = "".join(
    '<line x1="%.0f" y1="%.0f" x2="%.0f" y2="%.0f"/>' % (
        math.cos(math.radians(i*30-90))*(R+34), math.sin(math.radians(i*30-90))*(R+34),
        math.cos(math.radians(i*30-90))*(R+78), math.sin(math.radians(i*30-90))*(R+78))
    for i in range(12))

FIGURE = '''<g transform="scale(2.35) translate(0,-2)">
  <g class="cv-b" stroke="%s" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <g class="cv-hair" stroke-width="2.5">
      <path d="M-1.0 -39.4 Q-10 -43.2 -19.4 -40.4"/><path d="M-1.8 -37.2 Q-11 -39.8 -21.0 -35.6"/>
      <path d="M-2.2 -34.8 Q-11.4 -36.2 -21.2 -30.6"/><path d="M-2.0 -32.4 Q-10.4 -32.6 -18.6 -26.2"/>
    </g>
    <circle cx="4.2" cy="-35" r="6.4" fill="%s" stroke="none"/>
    <path d="M2.6 -29 Q-1.6 -21 -6 -13"/>
    <g class="cv-leg cv-leg--f"><path d="M-6 -13 Q1 -11.4 5.4 -13.6 M5.4 -13.6 Q8.6 -8 6.6 -2.6"/></g>
    <g class="cv-leg cv-leg--b"><path d="M-6 -13 Q-12.4 -10 -16.4 -5.4 M-16.4 -5.4 Q-20.6 -3.4 -24.4 -4.6"/></g>
    <g class="cv-arm cv-arm--f"><path d="M1 -27 Q7 -25 8.8 -20.4 M8.8 -20.4 Q10.4 -24.4 9.6 -28"/></g>
    <g class="cv-arm cv-arm--b"><path d="M1 -27 Q-5.4 -25.6 -8.6 -21.6 M-8.6 -21.6 Q-12.6 -23.6 -13.6 -27.4"/></g>
  </g></g>''' % (BLUE, BLUE)

SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A sun crossing a gold sky over green mountains, an eagle above, and the far messenger running the ridge"><defs><style>
.rays{{stroke:{CREAM};stroke-width:13;stroke-linecap:round}}
.eagle__b,.eagle__t{{fill:#3B5E3B;opacity:.78}}

.sunbody{{transform-box:view-box;transform-origin:0 0;animation:sun-cross 150s ease-in-out infinite}}
.rays{{transform-box:view-box;transform-origin:0 0;animation:ray-turn 90s linear infinite}}
@keyframes sun-cross{{
  0%   {{transform:translate({CX-330}px,{CY+210}px)}}
  22%  {{transform:translate({CX-170}px,{CY+30}px)}}
  50%  {{transform:translate({CX+130}px,{CY-58}px)}}
  78%  {{transform:translate({CX+420}px,{CY+30}px)}}
  100% {{transform:translate({CX+600}px,{CY+210}px)}}
}}
@keyframes ray-turn{{to{{rotate:360deg}}}}

.eagle{{offset-path:path("M -80,150 C 300,70 620,210 960,110 C 1240,30 1480,140 1760,90");
  offset-rotate:auto;offset-distance:0%;animation:eagle-cross 54s linear infinite;animation-delay:-14s}}
.eagle > g{{animation:eagle-beat 3.6s ease-in-out infinite}}
@keyframes eagle-cross{{0%{{offset-distance:0%;opacity:0}}4%{{opacity:1}}94%{{opacity:1}}100%{{offset-distance:100%;opacity:0}}}}
@keyframes eagle-beat{{0%,100%{{transform:scale(1.9,1.9)}}50%{{transform:scale(1.8,1.32)}}}}

.cv-run{{offset-path:path("{RUN}");offset-rotate:0deg;offset-distance:0%;
  animation:cv-cross 18s linear infinite;animation-delay:-5s}}
.cv-b{{animation:cv-bob .44s ease-in-out infinite}}
.cv-leg{{transform-box:view-box;transform-origin:-6px -13px}}
.cv-arm{{transform-box:view-box;transform-origin:1px -27px}}
.cv-leg--f,.cv-arm--b{{animation:cv-fwd .44s ease-in-out infinite}}
.cv-leg--b,.cv-arm--f{{animation:cv-back .44s ease-in-out infinite}}
.cv-hair{{transform-box:view-box;transform-origin:0 -36px;animation:cv-mane .44s ease-in-out infinite}}
@keyframes cv-cross{{0%{{offset-distance:0%;opacity:0}}3%{{opacity:1}}95%{{opacity:1}}100%{{offset-distance:100%;opacity:0}}}}
@keyframes cv-bob{{0%,100%{{transform:translateY(0)}}50%{{transform:translateY(-2.6px)}}}}
@keyframes cv-fwd{{0%,100%{{transform:rotate(26deg)}}50%{{transform:rotate(-24deg)}}}}
@keyframes cv-back{{0%,100%{{transform:rotate(-24deg)}}50%{{transform:rotate(26deg)}}}}
@keyframes cv-mane{{0%,100%{{transform:rotate(-5deg)}}50%{{transform:rotate(6deg)}}}}

@media (prefers-reduced-motion:reduce){{
  .sunbody{{animation:none!important;transform:translate({CX+130}px,{CY-58}px)!important}}
  .rays,.eagle,.eagle > g,.cv-run,.cv-run *{{animation:none!important}}
  .eagle{{offset-distance:38%;opacity:1}} .cv-run{{offset-distance:46%;opacity:1}}
}}
</style></defs>
<rect width="{W}" height="{H}" fill="{GOLD}"/>
<g class="sunbody"><g class="rays">{rays}</g><circle r="{R}" fill="{CREAM}"/></g>
<path d="{ridge(back)}"  fill="{BACK}"/>
<path d="{ridge(mid)}"   fill="{MID}"/>
<path d="{ridge(front)}" fill="{FRONT}"/>
<g class="eagle" aria-hidden="true"><g>
  <path class="eagle__b" d="M0,0 C-16,-12 -34,-16 -52,-9 C-36,-5 -22,-1 -8,3 L0,6 L8,3 C22,-1 36,-5 52,-9 C34,-16 16,-12 0,0 Z"/>
  <path class="eagle__t" d="M-5,5 L0,16 L5,5 Z"/>
</g></g>
<g class="cv-run" aria-hidden="true">{FIGURE}</g>
</svg>'''

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "art", "amm-cover.svg")
open(os.path.normpath(out), "w", encoding="utf-8").write(SVG)
print("  amm-cover.svg rebuilt — %d bytes" % len(SVG))

if __name__ == "__main__":
    pass
