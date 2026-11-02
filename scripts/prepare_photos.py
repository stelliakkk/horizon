from pathlib import Path
from PIL import Image, ImageOps
import argparse, hashlib, json, re
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Prepare HORIZON gallery assets without changing source photographs.')
parser.add_argument('--archive', type=Path, default=ROOT.parent, help='Directory containing the three categorized photo folders')
parser.add_argument('--selected', type=Path, default=Path('D:/LSPhoto/Selected'), help='Directory containing selected photographs')
args = parser.parse_args()
WORKSPACE = args.archive
SELECTED = args.selected
OUT = ROOT / 'dist'
(OUT / 'photos').mkdir(parents=True, exist_ok=True)
EXT = {'.jpg', '.jpeg', '.png', '.webp'}
def images(root):
    if not root.is_dir():
        raise FileNotFoundError(f'Photo directory not found: {root}')
    return sorted(p for p in root.rglob('*') if p.suffix.lower() in EXT)
def entry(p, base, selected=False):
    digest = hashlib.sha256(p.read_bytes()).hexdigest()[:20]
    with Image.open(p) as source:
        im = ImageOps.exif_transpose(source).convert('RGB')
        w,h = im.size
        for suffix,size,quality in [('thumb',640,80),('full',2400,92)]:
            target = OUT/'photos'/f'{digest}-{suffix}.webp'
            if not target.exists():
                copy=im.copy(); copy.thumbnail((size,size));copy.save(target,quality=quality,method=4)
    parts=p.relative_to(base).parts
    group=re.sub(r'^\d+_', '', parts[0])
    title=re.sub(r'^精选_\d+_', '', p.stem).replace('_',' ')
    return dict(id=digest,title=title,category=group,collection=re.sub(r'^\d+_', '', p.parent.name),width=w,height=h,thumb=f'photos/{digest}-thumb.webp',src=f'photos/{digest}-full.webp',selected=selected)
selected=list(ThreadPoolExecutor(6).map(lambda p:entry(p,SELECTED,True),images(SELECTED)))
archive=[]
for folder in ['01_汽车摄影','02_车型专题','03_AI视觉与海报']:
    base=WORKSPACE/folder
    archive.extend(ThreadPoolExecutor(6).map(lambda p:entry(p,base),images(base)))
seen=set();unique=[]
for item in archive:
    if item['id'] not in seen: unique.append(item);seen.add(item['id'])
data=dict(selected=selected,archive=unique)
(OUT/'photos.js').write_text('window.PHOTOS = '+json.dumps(data,ensure_ascii=False)+';',encoding='utf-8')
print(f'Prepared {len(selected)} selected; {len(unique)} archive photographs.')
