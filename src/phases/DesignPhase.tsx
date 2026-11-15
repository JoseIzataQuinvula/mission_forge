import { useState } from 'react';
import {
  BatteryCharging,
  CircleDollarSign,
  Cog,
  FlaskConical,
  Layers,
  Radio,
  Scale,
  ShieldCheck,
  Sun,
  Trash2,
  Zap,
} from 'lucide-react';
import { COMPONENTS_BY_ID, CATEGORY_LABELS, CATEGORY_ORDER, SPACECRAFT_COMPONENTS } from '../data/spacecraftComponents';
import { LUNAR_ICE_EXPLORER } from '../data/mission';
import { useMetrics, useMissionStore } from '../store/missionStore';
import { SectionTitle, Stat } from '../components/ui';
import type { ComponentCategory } from '../types';

const CATEGORY_ICONS: Record<ComponentCategory, typeof Layers> = {
  structure: Layers,
  power: Sun,
  propulsion: Cog,
  communication: Radio,
  instruments: FlaskConical,
  thermal: BatteryCharging,
};

export function DesignPhase() {
  const [category, setCategory] = useState<ComponentCategory>('structure');
  const config = useMissionStore((state) => state.config);
  const toggleComponent = useMissionStore((state) => state.toggleComponent);
  const resetConfiguration = useMissionStore((state) => state.resetConfiguration);
  const setPhase = useMissionStore((state) => state.setPhase);
  const lastError = useMissionStore((state) => state.lastError);
  const metrics = useMetrics();

  const components = SPACECRAFT_COMPONENTS.filter((item) => item.category === category);
  const selected = config.componentIds
    .map((id) => COMPONENTS_BY_ID[id])
    .filter(Boolean);

  return (
    <div className="phase design">
      <header className="phase-head">
        <div>
          <span className="eyebrow">Phase 02 · engineering</span>
          <h1>Spacecraft Design</h1>
          <p>Choose the subsystems. Every decision changes mass, power, science and cost.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setPhase('validation')}>
          <ShieldCheck size={16} aria-hidden="true" />
          Validate mission
        </button>
      </header>

      <div className="metric-bar">
        <Stat label="Mass" value={metrics.mass.totalMassKg} unit={` / ${LUNAR_ICE_EXPLORER.maxMassKg} kg`} tone={metrics.mass.totalMassKg > LUNAR_ICE_EXPLORER.maxMassKg ? 'danger' : 'default'} />
        <Stat label="Cost" value={metrics.cost.totalUsdM.toFixed(1)} unit={` / ${LUNAR_ICE_EXPLORER.budgetUsdM} M`} tone={metrics.cost.overBudget ? 'danger' : 'accent'} />
        <Stat label="Power" value={metrics.power.nominalMarginW} unit=" W free" tone={metrics.power.nominalMarginW < 0 ? 'danger' : 'ok'} />
        <Stat label="Science" value={metrics.science.score} unit="/100" tone={metrics.science.score >= LUNAR_ICE_EXPLORER.requiredScienceScore ? 'ok' : 'warn'} />
        <Stat label="Readiness" value={metrics.readiness} unit="%" tone="accent" />
      </div>

      <div className="readiness-track" aria-hidden="true">
        <span style={{ width: `${metrics.readiness}%` }} />
      </div>

      {lastError && <div className="alert alert-warn">{lastError}</div>}

      <div className="design-grid">
        <section className="catalog">
          <div className="category-tabs" role="tablist" aria-label="Component categories">
            {CATEGORY_ORDER.map((item) => {
              const Icon = CATEGORY_ICONS[item];
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={category === item}
                  className={`tab ${category === item ? 'is-active' : ''}`}
                  onClick={() => setCategory(item)}
                >
                  <Icon size={15} aria-hidden="true" />
                  {CATEGORY_LABELS[item]}
                  <span className="tab-count">{metrics.countsByCategory[item]}</span>
                </button>
              );
            })}
          </div>

          <div className="component-list">
            {components.map((component) => {
              const isSelected = config.componentIds.includes(component.id);
              return (
                <article key={component.id} className={`component-card ${isSelected ? 'is-selected' : ''}`}>
                  <div className="component-head">
                    <div>
                      <h3>{component.name}</h3>
                      <span className={`data-kind kind-${component.dataKind}`}>
                        {component.dataKind === 'heritage-based' ? 'Heritage-based' : 'Illustrative'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`btn btn-small ${isSelected ? 'btn-ghost' : 'btn-outline'}`}
                      onClick={() => toggleComponent(component.id)}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? 'Remove' : 'Add'}
                    </button>
                  </div>

                  <p className="component-desc">{component.description}</p>

                  <div className="component-stats">
                    <span><Scale size={13} aria-hidden="true" />{component.massKg} kg</span>
                    <span><CircleDollarSign size={13} aria-hidden="true" />{component.costUsdM} M</span>
                    {component.powerProductionW > 0 && (
                      <span className="positive"><Zap size={13} aria-hidden="true" />+{component.powerProductionW} W</span>
                    )}
                    {component.powerConsumptionW > 0 && (
                      <span className="negative"><Zap size={13} aria-hidden="true" />−{component.powerConsumptionW} W</span>
                    )}
                    {component.batteryCapacityWh ? (
                      <span><BatteryCharging size={13} aria-hidden="true" />{component.batteryCapacityWh} Wh</span>
                    ) : null}
                    {component.downlinkMbps ? (
                      <span><Radio size={13} aria-hidden="true" />{component.downlinkMbps} Mbps</span>
                    ) : null}
                    {component.scienceCapability > 0 && (
                      <span><FlaskConical size={13} aria-hidden="true" />{component.scienceCapability} science</span>
                    )}
                    {component.thermalProtection ? (
                      <span>thermal {component.thermalProtection}</span>
                    ) : null}
                    {component.structuralRating ? (
                      <span>structure {component.structuralRating}</span>
                    ) : null}
                  </div>

                  <div className="pros-cons">
                    <ul className="pros">
                      {component.advantages.slice(0, 2).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    <ul className="cons">
                      {component.disadvantages.slice(0, 2).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="manifest panel">
          <div className="manifest-head">
            <SectionTitle title="Configuration" hint={`${selected.length} components`} />
            {selected.length > 0 && (
              <button className="icon-btn" type="button" onClick={resetConfiguration} title="Clear configuration">
                <Trash2 size={15} aria-hidden="true" />
              </button>
            )}
          </div>

          {selected.length === 0 ? (
            <p className="empty-note">No components selected. Start with the structure.</p>
          ) : (
            <ul className="manifest-list">
              {CATEGORY_ORDER.map((cat) => {
                const items = selected.filter((item) => item.category === cat);
                if (items.length === 0) return null;
                return (
                  <li key={cat}>
                    <span className="manifest-cat">{CATEGORY_LABELS[cat]}</span>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="manifest-item"
                        onClick={() => toggleComponent(item.id)}
                        title="Remove component"
                      >
                        <span>{item.name}</span>
                        <Trash2 size={12} aria-hidden="true" />
                      </button>
                    ))}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="manifest-summary">
            <div><span>Total mass</span><strong>{metrics.mass.totalMassKg} kg</strong></div>
            <div><span>Budget used</span><strong>{metrics.cost.totalUsdM.toFixed(1)} M</strong></div>
            <div><span>Available power</span><strong>{metrics.power.productionW} W</strong></div>
            <div><span>Science load</span><strong>{metrics.power.scienceLoadW} W</strong></div>
          </div>

          <div className="manifest-objectives">
            <span className="mini-label">Objectives covered</span>
            {LUNAR_ICE_EXPLORER.objectives.map((objective) => {
              const covered = objective.instrumentIds.some((id) => config.componentIds.includes(id));
              return (
                <span key={objective.id} className={`objective-pill ${covered ? 'is-covered' : ''}`}>
                  {covered ? '✓' : '—'} {objective.title}
                </span>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
