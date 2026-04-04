import urllib.request
try:
    req = urllib.request.Request("https://anonyto.com/assets/index-CWUm0nr6.css", headers={'User-Agent': 'Mozilla/5.0'})
    css = urllib.request.urlopen(req).read().decode('utf-8')
    with open('out.css', 'w', encoding='utf-8') as f:
        f.write(css)
except Exception as e:
    print("Error:", e)
