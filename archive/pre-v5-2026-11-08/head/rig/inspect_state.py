import json
d = json.load(open('/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision/rig/.tv-state.json'))
print('cookies:', len(d.get('cookies', [])))
print('origins:', len(d.get('origins', [])))
tv = [c for c in d.get('cookies', []) if 'tradingview' in c.get('domain', '')]
print('tradingview cookies:', len(tv))
for c in tv[:10]:
    print('  ', c.get('name'), c.get('domain'))
