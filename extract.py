import re
import json

with open('c:/Users/DELL/Desktop/lociones/Gmaestra/js/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

acordes = set()
matches = re.findall(r'\[\"(.*?)\"\s*,\s*\d+\s*,\s*\"(.*?)\"\]', content)
for name, color in matches:
    acordes.add((name, color))

sorted_acordes = sorted(list(acordes))
for name, color in sorted_acordes:
    print(f'{name}: {color}')
