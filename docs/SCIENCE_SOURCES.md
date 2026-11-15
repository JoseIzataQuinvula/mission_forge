# Scientific sources and simplifications

This document explains which MISSION FORGE data has a scientific basis, which
values are engineering approximations and which are purely illustrative gameplay
values. The goal is for the player to learn correct orders of magnitude without
mistaking the simulator for a mission analysis tool.

> MISSION FORGE is an independent project created for the NASA Space Apps
> Challenge 2026. It is not a NASA product, has not been reviewed by NASA and does
> not represent an approved mission architecture.

## 1. Mission and environment

| Parameter | In-game value | Status | Basis |
| --- | --- | --- | --- |
| Destination | Lunar south pole, permanently shadowed zone beside an illuminated ridge | Plausible scenario | Lunar polar regions with grazing illumination and permanently shadowed craters are studied targets for water ice. |
| Night temperature | −180 °C | Approximation | Temperatures in permanently shadowed regions are below −170 °C; exact values vary with location and season. |
| Day temperature | +60 °C | Approximation | Sunlit surfaces at the south pole warm far less than the lunar equator, but still experience severe thermal cycles. |
| Usable illumination | 80% of the day | Simplification | The real fraction depends on topography. 80% is a playable value for a partially illuminated ridge. |
| Mission duration | 7 steps of 24 h | Simplification | A real polar operation would have to manage lunar nights of about 14 Earth days; the game compresses the cycle. |
| Gravity | 1.62 m/s² | Real | Mean lunar surface gravity. |

Water ice at the south pole is supported by several lines of evidence: hydrogen
measurements by the LEND instrument on the Lunar Reconnaissance Orbiter,
water/OH observations by the Moon Mineralogy Mapper (Chandrayaan-1), and water
detected in the impact plume of the LCROSS mission. The game uses that basis to
justify the mission, but does not reproduce any real instrument.

## 2. Instruments and components marked "heritage-based"

| In-game component | Real reference | What was simplified |
| --- | --- | --- |
| Neutron Spectrometer | Lunar Exploration Neutron Detector (LEND), LRO | Mass, power, data volume and science capability are gameplay estimates. The physical principle (detecting hydrogen through neutrons) is real. |
| Radioisotope Power System (110 W, ~45 kg) | Multi-Mission Radioisotope Thermoelectric Generator (MMRTG) | The order of magnitude of power and mass is close to real; cost, reliability and the degradation curve are simplified. |
| High-Gain Antenna (8 Mbps) | High-gain lunar links | Capacity is a pedagogical simplification. The real rate depends on power, distance, band and pointing. |

Every other component (structures, engines, batteries, antennas, camera, radar,
mass spectrometer, drill, thermal systems and launch vehicles) is marked in the
catalogue as **Illustrative**: they are internally consistent engineering
estimates, not specifications of existing hardware.

## 3. Engine formulas

### Mass

```
dry mass        = sum of component masses
propellant      = sum of engine propellant
total mass      = dry mass + propellant
```

### Power

```
instantaneous production = Σ production power (W)
nominal load             = housekeeping + communications + thermal + propulsion standby (W)
science load             = Σ active instruments (W)
peak margin              = production − (nominal load + science load)
daily generation (Wh)    = RTG × 24 h + solar × illuminated fraction × 24 h
daily consumption (Wh)   = nominal load × 24 h
night need               = nominal load × dark fraction × 24 h
```

The distinction between **W** (instantaneous power) and **Wh** (energy integrated
over time) is applied throughout the engine and the tests.

### Science and data

```
science capability     = Σ instrument capability (capped at 100)
data per step          = Σ data from active instruments (Mbit)
downlink per contact   = Σ bandwidth (Mbps) × contact window (s)
```

The scenario contact window is 120 s per step. A 0.4 Mbps antenna delivers only
48 Mbit per contact; an 8 Mbps antenna delivers 960 Mbit. This difference is
intentional and creates a real engineering decision.

## 4. What the game does NOT model

- Orbital mechanics (patched conics, Hohmann transfer, real insertion).
- Delta-v, specific impulse and step-by-step propellant burn.
- Ionising radiation, solar wind and panel degradation.
- Topography, terrain slope and dust raised during descent.
- Detailed thermodynamics (conductivity, radiation, heater hysteresis).
- Telecommunications protocols, encoding and packet loss.
- Real procurement costs, schedule and supply chain.

These simplifications are declared in the interface whenever a value is presented
as an estimate.

## 5. Further reading

- NASA — Lunar Reconnaissance Orbiter / LEND: <https://www.nasa.gov/mission/lro/>
- NASA — LCROSS: <https://science.nasa.gov/mission/lcross/>
- NASA — Moon Mineralogy Mapper (M³): <https://science.nasa.gov/mission/moon-mineralogy-mapper/>
- NASA — Artemis and south polar exploration: <https://www.nasa.gov/artemis/>
- NASA — Radioisotope Power Systems: <https://rps.nasa.gov/>

The references provide context for the scenario. No NASA text, image or logo is
included in the game.
