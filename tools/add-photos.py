#!/usr/bin/env python3
"""Tony's photo pipeline: drop pictures into ~/Dropbox/TRIBEAWAKEN-PHOTOS,
double-click ADD-NEW-PHOTOS. Camera-EXIF originals only; AI files are refused.
Originals never touched; sized copies land in the site; the gallery rotation
learns them automatically."""
import glob, os, subprocess, json, re
HOME=os.path.expanduser('~')
DROP=HOME+'/Dropbox/TRIBEAWAKEN-PHOTOS'
SITE=HOME+'/Documents/TribeAwaken-V2-DAYLIGHT-2026-10/site-final'
DEST=SITE+'/assets/img/drop'
os.makedirs(DEST,exist_ok=True)
R=json.load(open(SITE+'/js/rotations.json'))
have={g['src'] for g in R['gallery']}
added,refused=[],[]
for p in sorted(glob.glob(DROP+'/*')):
    if not p.lower().endswith(('.jpg','.jpeg','.png','.heic','.webp')): continue
    out=subprocess.run(['sips','-g','make','-g','model',p],capture_output=True,text=True).stdout
    cam=('make:' in out and '<nil>' not in out.split('make:')[1].split('\n')[0]) or \
        ('model:' in out and '<nil>' not in out.split('model:')[1].split('\n')[0])
    base=re.sub(r'[^A-Za-z0-9]+','-',os.path.splitext(os.path.basename(p))[0]).strip('-').lower()
    if not cam:
        refused.append(os.path.basename(p)); continue
    name=f'{base}-1800px.jpg'; web=f'/assets/img/drop/{name}'
    if web in have: continue
    subprocess.run(['sips','-s','format','jpeg','-Z','1800',p,'--out',DEST+'/'+name],capture_output=True)
    cap=base.replace('-',' ').title()
    R['gallery'].append({"src":web,"cap":cap})
    added.append(name)
json.dump(R,open(SITE+'/js/rotations.json','w'),indent=2,ensure_ascii=False)
print(f'added {len(added)} photo(s) to the gallery rotation')
for a in added: print('  +',a)
if refused:
    print(f'refused {len(refused)} (no camera data — possibly AI/screenshot):')
    for r in refused: print('  ✗',r)
print('\nDrop folder:', DROP)
