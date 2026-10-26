"""Decode the saved bundle into reviewable files.

Usage: python scripts/unpack_bundle.py [path-to-html]
"""
from pathlib import Path
import base64, gzip, json, re, sys

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parents[1] / 'WiseOrganise — aplikacja.html'
out = source.parent / 'unpacked'
out.mkdir(exist_ok=True)
text = source.read_text(encoding='utf-8', errors='replace')
manifest_match = re.search(r'<script type="__bundler/manifest"[^>]*>(.*?)</script>', text, re.S)
if not manifest_match:
    raise SystemExit('Manifest not found')
manifest = json.loads(manifest_match.group(1).strip())
extensions = {'text/html': '.html', 'text/css': '.css', 'text/javascript': '.js', 'application/javascript': '.js', 'application/json': '.json'}
for key, entry in manifest.items():
    payload = base64.b64decode(entry['data'])
    if entry.get('compressed'):
        payload = gzip.decompress(payload)
    (out / f"{key}{extensions.get(entry.get('mime'), '.bin')}").write_bytes(payload)
template_match = re.search(r'<script type="__bundler/template"[^>]*>(.*?)</script>', text, re.S)
if template_match:
    (out / 'template.txt').write_text(template_match.group(1).strip(), encoding='utf-8')
print(f'Unpacked {len(manifest)} entries into {out}')
