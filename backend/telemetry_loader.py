import fastf1
import fastf1.plotting
import os

# Create cache directory if it doesn't exist
if not os.path.exists("cache"):
    os.makedirs("cache")

fastf1.Cache.enable_cache("cache")

def load_bahrain_2024():
    session = fastf1.get_session(2024, 1, 'R')
    session.load()

    laps = session.laps

    # Laps data for positions
    laps_data = laps[['Driver', 'LapNumber', 'Position', 'LapTime', 'Sector1Time', 'Sector2Time', 'Sector3Time']].to_dict('records')

    # Telemetry data from fastest laps
    data = []

    for driver in session.drivers:
        d = session.get_driver(driver)
        code = d["Abbreviation"]

        fastest = laps.pick_drivers(code).pick_fastest()
        if fastest is None:
            continue

        tel = fastest.get_telemetry()

        data.append({
            "driver": code,
            "speed": tel["Speed"].tolist(),
            "throttle": tel["Throttle"].tolist(),
            "brake": tel["Brake"].tolist(),
            "gear": tel["nGear"].tolist()
        })

    return {'laps': laps_data, 'telemetry': data}
