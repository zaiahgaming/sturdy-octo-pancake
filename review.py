import json, urllib.request

try:
    req = urllib.request.Request('http://127.0.0.1:49993/api/review', data=json.dumps({}).encode(), headers={'Content-Type': 'application/json'})
    print(urllib.request.urlopen(req).read().decode('utf-8'))
except Exception as e:
    print(e)
