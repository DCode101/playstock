# TODO: Fix F1 Playstock Issues

## ✅ 1. Prices as Integers
- Update price calculations to use Math.round for integer prices
- Ensure displays show no decimals

## ✅ 2. Brake Graph Line
- Fix brake graph data mapping and rendering

## ✅ 3. Race Persistence
- Add race state to appStore with persistence
- Resume race on component mount if ongoing

## ✅ 4. Driver Selection Enhancements
- Add position, owned shares display
- Add buy/sell buttons in selected driver section

## ✅ 5. Race Completion and Countdown
- Detect race finish (currentLap >= totalLaps)
- Store results, switch to countdown mode

## ✅ 6. Header Bar
- Add scrolling ticker for race updates

## Implementation Steps
- [x] Update LiveRace.tsx for price displays to use Math.round
- [x] Fix brake graph in LiveRace.tsx to handle missing data
- [x] Modify race engine in LiveRace.tsx to persist across tabs/screens
- [x] Fix buy/sell buttons in driver selection to open trade modal
- [x] Implement dynamic countdown using schedule data
- [x] Enhance header bar with more race updates
- [x] Fix lap display to show "Lap X of 57"
- [x] Fix market volume calculation
- [x] Fix analytics graphs sizing and layout
- [ ] Add trade history chart to analytics
- [ ] Ensure leaderboard shows mock user when no real users
- [x] Test all changes
