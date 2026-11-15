import { ArrowRight, CheckCircle2, CircleDot, Coins, Gauge, Scale, ThermometerSnowflake, Timer, Waves } from 'lucide-react';
import { LUNAR_ICE_EXPLORER } from '../data/mission';
import { useMissionStore } from '../store/missionStore';
import { SectionTitle, Stat } from '../components/ui';

export function BriefingPhase() {
  const setPhase = useMissionStore((state) => state.setPhase);
  const mission = LUNAR_ICE_EXPLORER;

  return (
    <div className="phase briefing">
      <div className="hero">
        <span className="eyebrow">
          <CircleDot size={14} aria-hidden="true" />
          NASA Space Apps Challenge 2026 · lunar exploration challenge
        </span>
        <h1>
          Lunar Ice <span>Explorer</span>
        </h1>
        <p className="hero-lead">{mission.objective}</p>
        <p className="hero-body">{mission.description}</p>
        <div className="hero-actions">
          <button className="btn btn-primary" type="button" onClick={() => setPhase('design')}>
            Start spacecraft design
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <span className="hero-note">7 operational steps · 1 launch opportunity</span>
        </div>
      </div>

      <SectionTitle index="01" title="What is at stake" hint="Mission objectives" />
      <div className="objective-grid">
        {mission.objectives.map((objective) => {
          const required = mission.requiredObjectives.includes(objective.id);
          return (
            <article key={objective.id} className={`objective-card ${required ? 'is-required' : ''}`}>
              <div className="objective-head">
                <CheckCircle2 size={16} aria-hidden="true" />
                <h3>{objective.title}</h3>
                <span className={`tag ${required ? 'tag-required' : ''}`}>
                  {required ? 'Required' : 'Optional'}
                </span>
              </div>
              <p>{objective.description}</p>
            </article>
          );
        })}
      </div>

      <SectionTitle index="02" title="Mission constraints" hint="Limits you cannot exceed" />
      <div className="stat-grid">
        <Stat label="Total budget" value={mission.budgetUsdM} unit=" M USD" tone="accent" hint="Hardware + launch" />
        <Stat label="Maximum mass" value={mission.maxMassKg} unit=" kg" hint="Integrated spacecraft, with propellant" />
        <Stat label="Surface duration" value={mission.opsSteps} unit=" steps" hint={`${mission.stepHours} h per step`} />
        <Stat label="Minimum data" value={mission.requiredDataMbit} unit=" Mbit" hint="Transmitted to Earth" />
        <Stat label="Night temperature" value={mission.environment.nightTemperatureC} unit=" °C" tone="danger" hint={`Day: ${mission.environment.dayTemperatureC} °C`} />
        <Stat label="Recommended science" value={mission.requiredScienceScore} unit="/100" tone="warn" hint="Sensor capability" />
      </div>

      <div className="briefing-columns">
        <section className="panel">
          <SectionTitle title="How it works" />
          <ol className="flow-list">
            <li><strong>Spacecraft Design</strong><span>Choose structure, power, propulsion, communications, instruments and thermal control.</span></li>
            <li><strong>Mission Validation</strong><span>The engineering engine checks mass, power, data and compatibility.</span></li>
            <li><strong>Launch Control</strong><span>Select the launcher and authorise the countdown.</span></li>
            <li><strong>Lunar Operations</strong><span>Live through 7 steps with events and decisions that change the outcome.</span></li>
            <li><strong>Mission Debrief</strong><span>Report with objectives, efficiency and lessons learned.</span></li>
          </ol>
        </section>

        <section className="panel">
          <SectionTitle title="Landing environment" />
          <p className="panel-text">
            A plain beside an illuminated ridge at the lunar south pole. The low Sun casts
            long shadows and creates zones of permanent darkness. Water ice, if present,
            is mixed into the regolith and the immediate subsurface.
          </p>
          <div className="env-facts">
            <span><Scale size={15} aria-hidden="true" /> Gravity 1.62 m/s²</span>
            <span><ThermometerSnowflake size={15} aria-hidden="true" /> Extreme thermal cycling</span>
            <span><Waves size={15} aria-hidden="true" /> Solar wind and radiation</span>
            <span><Timer size={15} aria-hidden="true" /> Intermittent contact</span>
            <span><Gauge size={15} aria-hidden="true" /> No room for error</span>
            <span><Coins size={15} aria-hidden="true" /> Every kg costs budget</span>
          </div>
          <p className="disclaimer">
            Values marked as illustrative are gameplay simplifications, not flight
            specifications. See <code>docs/SCIENCE_SOURCES.md</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
