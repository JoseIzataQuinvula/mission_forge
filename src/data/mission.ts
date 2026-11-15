import type { Mission } from '../types';

/**
 * Primary mission of the game.
 *
 * Context values (polar illumination, temperatures) follow published NASA
 * descriptions of the lunar south polar region in broad terms, but every
 * number used by the simulation is simplified for gameplay. See
 * docs/SCIENCE_SOURCES.md.
 */
export const LUNAR_ICE_EXPLORER: Mission = {
  id: 'lunar-ice-explorer',
  name: 'LUNAR ICE EXPLORER',
  codename: 'MF-01',
  destination: 'Moon — south polar region',
  objective:
    'Investigate signs of water ice in the lunar south polar regolith and characterise its distribution down to 1 metre depth.',
  description:
    'The Moon has permanently shadowed regions near the south pole where water ice may have accumulated over billions of years. A small robotic lander must touch down on a partially illuminated ridge, analyse the soil and transmit the results to Earth. Your engineering decisions determine whether the mission arrives, survives and produces useful science.',
  budgetUsdM: 450,
  maxMassKg: 2000,
  opsSteps: 7,
  stepHours: 24,
  surfaceHours: 168,
  illuminationFraction: 0.8,
  contactWindowSeconds: 120,
  objectives: [
    {
      id: 'ice-detection',
      title: 'Confirm water ice in the regolith',
      description:
        'Measure hydrogen abundance in the soil to confirm the presence of water ice near the surface.',
      instrumentIds: ['inst-neutron'],
    },
    {
      id: 'subsurface-ice-mapping',
      title: 'Map subsurface ice down to 1 m',
      description:
        'Identify ice-rich layers and the structure of the regolith down to one metre depth.',
      instrumentIds: ['inst-radar'],
    },
    {
      id: 'sample-analysis',
      title: 'Characterise sample composition',
      description:
        'Chemically analyse collected samples and identify volatiles and water molecules.',
      instrumentIds: ['inst-massspec', 'inst-drill'],
    },
    {
      id: 'context-imaging',
      title: 'Document the landing site',
      description:
        'Capture panoramic images that provide geological context for every measurement.',
      instrumentIds: ['inst-camera'],
    },
  ],
  requiredObjectives: ['ice-detection', 'subsurface-ice-mapping'],
  requiredScienceScore: 45,
  requiredDataMbit: 380,
  environment: {
    dayTemperatureC: 60,
    nightTemperatureC: -180,
    description:
      'Partially illuminated polar ridge. Surface temperatures between -180 °C and +60 °C, intermittent solar exposure and abrasive dust. The surrounding region contains permanently shadowed craters.',
  },
};

export const MISSIONS: Mission[] = [LUNAR_ICE_EXPLORER];

export const DEFAULT_MISSION = LUNAR_ICE_EXPLORER;
