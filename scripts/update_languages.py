"""Build an accessible language card using only public GitHub repository metadata."""
import json
import math
import re
import subprocess
from collections import Counter
from datetime import datetime, timezone
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
USER = 'Tendo505'
COLORS = {'Kotlin': '#a78bfa', 'Java': '#fb923c', 'C++': '#f472b6',
          'PHP': '#818cf8', 'JavaScript': '#facc15', 'Python': '#60a5fa',
          'HTML': '#f97316', 'CSS': '#38bdf8', 'Shell': '#4ade80'}

def api(endpoint):
    return json.loads(subprocess.check_output(['gh', 'api', endpoint], text=True, encoding='utf-8'))

def main():
    repos = []
    page = 1
    while True:
        batch = api(f'users/{USER}/repos?type=owner&per_page=100&page={page}')
        repos.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    counts = Counter()
    included = []
    for repo in repos:
        if repo['private'] or repo['fork'] or repo['name'].lower() == USER.lower():
            continue
        languages = api(f"repos/{USER}/{repo['name']}/languages")
        if any(not isinstance(n, int) or n < 0 for n in languages.values()):
            raise ValueError('Unexpected GitHub language byte count')
        counts.update(languages)
        included.append(repo['name'])
    total = sum(counts.values())
    if not total:
        raise ValueError('No language data available; retaining the last successful card')
    items = counts.most_common()
    # Largest remainders make displayed values sum to exactly 100.0%.
    raw = [n / total * 1000 for _, n in items]
    units = [math.floor(n) for n in raw]
    for i in sorted(range(len(raw)), key=lambda i: raw[i] - units[i], reverse=True)[:1000-sum(units)]:
        units[i] += 1
    rows = math.ceil(len(items) / 3)
    height = 174 + rows * 43
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="960" height="{height}" viewBox="0 0 960 {height}" role="img" aria-labelledby="title desc">',
           '<title id="title">Languages in my public code</title>',
           '<desc id="desc">' + escape(', '.join(f'{name} {units[i]/10:.1f}%' for i,(name,_) in enumerate(items))) + '</desc>',
           f'<rect width="960" height="{height}" rx="20" fill="#0d1728"/>',
           '<g font-family="Segoe UI,Arial,sans-serif">',
           '<text x="36" y="46" fill="#f8fafc" font-size="23" font-weight="600">Languages in my public code</text>',
           f'<text x="36" y="73" fill="#94a3b8" font-size="14">{len(included)} public repositories · measured by code bytes</text>',
           '<defs><clipPath id="bar"><rect x="36" y="96" width="888" height="17" rx="8"/></clipPath></defs><g clip-path="url(#bar)">']
    x = 36
    for i, (name, count) in enumerate(items):
        width = count / total * 888
        color = COLORS.get(name, '#2dd4bf')
        svg.append(f'<rect x="{x:.3f}" y="96" width="{width:.3f}" height="17" fill="{color}"/>')
        x += width
    svg.append('</g>')
    for i, (name, _) in enumerate(items):
        x, y = 36 + (i % 3) * 296, 151 + (i // 3) * 43
        svg.extend([f'<circle cx="{x+5}" cy="{y-5}" r="5" fill="{COLORS.get(name, "#2dd4bf")}"/>',
                    f'<text x="{x+20}" y="{y}" fill="#e2e8f0" font-size="16">{escape(name)}</text>',
                    f'<text x="{x+259}" y="{y}" fill="#cbd5e1" font-size="16" text-anchor="end">{units[i]/10:.1f}%</text>'])
    date = datetime.now(timezone.utc).strftime('%d %b %Y')
    svg.append(f'<text x="36" y="{height-20}" fill="#94a3b8" font-size="12">Public code mix · includes archived coursework · updated {date} UTC</text></g></svg>')
    readme = ROOT / 'README.md'
    text = readme.read_text(encoding='utf-8')
    breakdown = ' · '.join(f'**{name} {units[i]/10:.1f}%**' for i,(name,_) in enumerate(items))
    text, replaced = re.subn(r'<!-- LANGUAGE_DATA_START -->.*?<!-- LANGUAGE_DATA_END -->',
                           f'<!-- LANGUAGE_DATA_START -->\n{breakdown}\n<!-- LANGUAGE_DATA_END -->', text, flags=re.S)
    if replaced != 1:
        raise ValueError('README requires exactly one language marker pair')
    (ROOT / 'assets/languages.svg').write_text('\n'.join(svg), encoding='utf-8')
    readme.write_text(text, encoding='utf-8')
    print(breakdown)

if __name__ == '__main__':
    main()
