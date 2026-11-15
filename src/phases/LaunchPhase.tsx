import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleDollarSign, Rocket, ShieldAlert, TrendingUp, Weight } from 'lucide-react';
import { LAUNCH_VEHICLES, LAUNCH_VEHICLES_BY_ID } from '../data/launchVehicles';
import { LUNAR_ICE_EXPLORER } from '../data/mission';
import { useMetrics, useMissionStore, useValidation } from '../store/missionStore';
import { SectionTitle, Stat } from '../components/ui';

export function LaunchPhase() {
  const config = useMissionStore((state) => state.config);
  const selectVehicle = useMissionStore((state) => state.selectVehicle);
  const startLaunch = useMissionStore((state) => state.startLaunch);
  const setPhase = useMissionStore((state) => state.setPhase);
  const lastError = useMissionStore((state) => state.lastError);
  const metrics = useMetrics();
  const validation = useValidation();

  const [launching, setLaunching] = useState(false);
  const launchTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (launchTimer.current !== null) window.clearTimeout(launchTimer.current);
    },
    [],
  );

  const vehicle = config.launchVehicleId ? LAUNCH_VEHICLES_BY_ID[config.launchVehicleId] : null;
  const capacityRatio = vehicle
    ? Math.min(100, Math.round((metrics.mass.totalMassKg / vehicle.payloadCapacityKg) * 100))
    : 0;

  const handleLaunch = () => {
    if (launching) return;
    setLaunching(true);
    launchTimer.current = window.setTimeout(() => {
      startLaunch();
      setLaunching(false);
    }, 2600);
  };

  const checks = [
    { label: 'Engineering review', ok: validation.canLaunch },
    { label: 'Launch vehicle selected', ok: Boolean(vehicle) },
    { label: 'Payload within capacity', ok: Boolean(vehicle) && metrics.mass.totalMassKg <= vehicle!.payloadCapacityKg },
    { label: 'Total mass within limit', ok: metrics.mass.totalMassKg <= LUNAR_ICE_EXPLORER.maxMassKg },
    { label: 'Budget within limit', ok: !metrics.cost.overBudget },
  ];

  return (
    <div className="phase launch">
      <header className="phase-head">
        <div>
          <span className="eyebrow">Phase 04 · launch campaign</span>
          <h1>Launch Control</h1>
          <p>Choose the launcher and confirm the spacecraft identity before the countdown.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => setPhase('validation')}>
          <ArrowLeft size={16} aria-hidden="true" />
          Review validation
        </button>
      </header>

      {lastError && <div className="alert alert-danger">{lastError}</div>}

      <div className="launch-grid">
        <section>
          <SectionTitle title="Available vehicles" hint="Simplified lunar-transfer capacity" />
          <div className="vehicle-list">
            {LAUNCH_VEHICLES.map((item) => {
              const isSelected = item.id === config.launchVehicleId;
              const fits = metrics.mass.totalMassKg <= item.payloadCapacityKg;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`vehicle-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => selectVehicle(item.id)}
                  aria-pressed={isSelected}
                >
                  <div className="vehicle-head">
                    <Rocket size={18} aria-hidden="true" />
                    <h3>{item.name}</h3>
                    {isSelected && <CheckCircle2 size={16} aria-hidden="true" />}
                  </div>
                  <p>{item.description}</p>
                  <div className="vehicle-stats">
                    <span><Weight size={13} aria-hidden="true" />{item.payloadCapacityKg} kg</span>
                    <span><CircleDollarSign size={13} aria-hidden="true" />{item.costUsdM} M USD</span>
                    <span><TrendingUp size={13} aria-hidden="true" />{Math.round(item.reliability * 100)}% reliability</span>
                  </div>
                  <span className={`fit-tag ${fits ? 'fit-ok' : 'fit-no'}`}>
                    {fits ? 'Compatible with the spacecraft' : 'Payload exceeded'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="launch-panel panel">
          <SectionTitle title="Go / No-Go" hint="Final check" />
          <ul className="check-list">
            {checks.map((check) => (
              <li key={check.label} className={check.ok ? 'is-ok' : 'is-no'}>
                {check.ok ? <CheckCircle2 size={15} aria-hidden="true" /> : <ShieldAlert size={15} aria-hidden="true" />}
                <span>{check.label}</span>
                <strong>{check.ok ? 'GO' : 'NO-GO'}</strong>
              </li>
            ))}
          </ul>

          {vehicle && (
            <div className="capacity-block">
              <div className="capacity-head">
                <span>Payload vs capacity</span>
                <strong>{metrics.mass.totalMassKg} / {vehicle.payloadCapacityKg} kg</strong>
              </div>
              <div className={`capacity-track ${capacityRatio > 100 ? 'is-over' : ''}`}>
                <span style={{ width: `${capacityRatio}%` }} />
              </div>
              <p className="mini-note">
                {capacityRatio > 100
                  ? 'The spacecraft exceeds the launcher capacity. Choose another vehicle or reduce mass.'
                  : capacityRatio > 90
                    ? 'Very tight margin: any surprise could make the trajectory unfeasible.'
                    : 'Acceptable payload margin for the lunar transfer.'}
              </p>
            </div>
          )}

          <div className="stat-grid mini">
            <Stat label="Mass" value={metrics.mass.totalMassKg} unit=" kg" />
            <Stat label="Total cost" value={metrics.cost.totalUsdM.toFixed(1)} unit=" M" tone={metrics.cost.overBudget ? 'danger' : 'default'} />
          </div>

          <button
            className="btn btn-primary btn-launch"
            type="button"
            onClick={handleLaunch}
            disabled={launching || !validation.canLaunch || !vehicle || checks.some((check) => !check.ok)}
          >
            <Rocket size={17} aria-hidden="true" />
            {launching ? 'Launch in progress…' : 'Start mission'}
          </button>
          <p className="mini-note center">
            The countdown is simulated. No real telemetry is used.
          </p>
        </aside>
      </div>

      {launching && (
        <div className="launch-overlay" role="status" aria-live="assertive">
          <div className="launch-sequence">
            <span className="eyebrow">Countdown · T−00:00:03</span>
            <Rocket className="launch-rocket" size={64} aria-hidden="true" />
            <h2>Ignition and separation</h2>
            <p>
              The spacecraft is being placed on the trans-lunar trajectory. Operations telemetry
              becomes available at the end of the sequence.
            </p>
            <div className="launch-progress" aria-hidden="true"><span /></div>
          </div>
        </div>
      )}
    </div>
  );
}
