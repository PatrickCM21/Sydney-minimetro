import urllib.request
import re

title = 'Leppington_%26_Inner_West_Line'
url = f"https://en.wikipedia.org/wiki/{title}?action=raw"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'SydneyTrainsScraper/1.0 (patrick@example.com)'}
)
with urllib.request.urlopen(req) as response:
    text = response.read().decode('utf-8')

# Find redirects
redirect_match = re.match(r'#REDIRECT\s*\[\[(.*?)\]\]', text, re.IGNORECASE)
if redirect_match:
    target = redirect_match.group(1).replace(' ', '_')
    url = f"https://en.wikipedia.org/wiki/{target}?action=raw"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'SydneyTrainsScraper/1.0 (patrick@example.com)'}
    )
    with urllib.request.urlopen(req) as response:
        text = response.read().decode('utf-8')

idx = text.find('{|class="wikitable"')
if idx == -1:
    idx = text.find('{| class="wikitable"')
    
if idx != -1:
    print(text[idx:idx+8000])
else:
    print("Table not found!")
