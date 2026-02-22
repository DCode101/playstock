import fastf1
import json

fastf1.Cache.enable_cache('cache')

session = fastf1.get_session(2024, 1, 'R')
session.load()

laps = session.laps

data = []

for lap in laps.iterlaps():
    data.append({
        "driver": lap[1]['Driver'],
        "lap": int(lap[1]['LapNumber']),
        "position": int(lap[1]['Position']) if lap[1]['Position'] else None,
        "time": str(lap[1]['LapTime'])
    })

with open('../public/telemetry.json', 'w') as f:
    json.dump(data, f)

print("Bahrain 2024 data generated.")
