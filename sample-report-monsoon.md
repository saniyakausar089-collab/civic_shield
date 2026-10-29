# CIVICSHIELD Incident Brief: Monsoon flood

*Hyderabad Urban Sector (Synthetic Testbed). Narrative: template from engine facts.*

**Situation.** In the Hyderabad Urban Sector (Synthetic Testbed), the "Monsoon flood" scenario starts with the loss of Main Pipeline, South Water Works, East Underpass.

**Cascade.** The failure spreads across connected utilities. By the end of the 24-hour horizon, 7 of 26 assets are out of service.

**Impact.** Service loss peaks at T+5h, affecting 5,68,000 of 7,10,000 residents (80%). The hardest-hit areas are Malakpet, Chandrayangutta, Tarnaka.

**Hospitals.** 1 of 2 hospitals go offline: City General Hospital (from T+2h).

**Recommended action.** The best-ranked response is "Water works first": Prioritise supply: WT2 T+6h, PIPE1 T+8h, UJ1 T+10h. It reduces affected population-hours by 68.8% and avoids 14 hospital-downtime hours compared with taking no action.

**Limitations.** All infrastructure, populations and dependencies are synthetic. This is a simulation prototype, not a prediction for the real city.

## Key figures

- Peak affected residents: 5,68,000 of 7,10,000 (80%) at T+5h
- Assets failed by T+24h: 7 of 26
- Hospitals offline at peak: 1 of 2 (first: T+2h)

## Timeline

- T+0h: Main Pipeline went offline — flood damage to the trunk main
- T+0h: South Water Works inundated — treatment halted
- T+0h: East Underpass flooded — road closed
- T+1h: Pumping Station A failed (loss of Main Pipeline)
- T+1h: City General Hospital degraded (loss of East Underpass)
- T+2h: City General Hospital failed (loss of Pumping Station A)
- T+13h: Northwest Medical Center degraded (loss of Pumping Station B)

## Most affected neighborhoods

- Malakpet: peak service loss 55%, population 83,000, 24 hours affected
- Chandrayangutta: peak service loss 55%, population 69,000, 24 hours affected
- Tarnaka: peak service loss 48%, population 71,000, 23 hours affected

## Response plans compared

- RECOMMENDED Water works first: 68.8% population-hours saved, 14 hospital hours avoided
- Pump out underpass first: 25.6% population-hours saved, 13 hospital hours avoided
- Hospital shield: 18% population-hours saved, 16 hospital hours avoided

## Vulnerability context

- Main Pipeline: weak-link rank #3 of 26 (score 61.2)
- South Water Works: weak-link rank #5 of 26 (score 51)
- East Underpass: weak-link rank #14 of 26 (score 30.3)

## Limitations

- All infrastructure, populations and dependencies are synthetic. This is a simulation prototype, not a prediction for the real city.
- Real-world accuracy would require validated utility data and rigorous testing.
- Response-plan timings are illustrative assumptions.