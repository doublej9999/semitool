
'use client';

import { useState } from 'react';
import UnitConverter from '@/components/tools/UnitConverter';
import {
  TEMPERATURE_DIFFERENCE_LABELS,
  TEMPERATURE_LABELS,
  TEMPERATURE_UNITS,
  belowAbsoluteZero,
  convertTemperature,
  type TemperatureMode,
  type TemperatureUnit,
} from '@/lib/temperature';
import { useUrlParamsState } from '@/lib/use-url-state';

const MODE_LABELS: Record<TemperatureMode, string> = {
  absolute: 'An absolute temperature',
  difference: 'A temperature difference (ΔT)',
};

export default function TemperatureConverter() {
  const [modeState, setModeState] = useState({ mode: 'absolute' as TemperatureMode });
  useUrlParamsState(modeState, setModeState);
  const { mode } = modeState;
  const setMode = (next: TemperatureMode) => setModeState({ mode: next });

  const labelSet = mode === 'absolute' ? TEMPERATURE_LABELS : TEMPERATURE_DIFFERENCE_LABELS;
  const units = TEMPERATURE_UNITS.map((unit) => ({ id: unit, label: labelSet[unit] }));

  return (
    <UnitConverter
      title="Temperature"
      resultTitle="Converted temperature"
      units={units}
      headlineUnit="F"
      initialValue="25"
      initialUnit="C"
      controls={
        <div className="field">
          <label htmlFor="temperature-mode">What are you converting?</label>
          <select
            id="temperature-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as TemperatureMode)}
          >
            {(Object.keys(MODE_LABELS) as TemperatureMode[]).map((entry) => (
              <option key={entry} value={entry}>
                {MODE_LABELS[entry]}
              </option>
            ))}
          </select>
        </div>
      }
      convert={(value, unit) => {
        if (!Number.isFinite(value)) return { ok: false, errors: ['Enter a temperature to convert.'] };
        if (mode === 'absolute' && belowAbsoluteZero(value, unit as TemperatureUnit)) {
          return {
            ok: false,
            errors: [
              `${value} ${TEMPERATURE_LABELS[unit as TemperatureUnit]} is below absolute zero (0 K), so it is not a physical temperature.`,
            ],
          };
        }
        return { ok: true, values: convertTemperature(value, unit as TemperatureUnit, mode) };
      }}
      note={
        <>
          <p className="note">
            The offsets are exact: T(K) = T(°C) + 273.15 and T(°F) = T(°C) x 9/5 + 32. That is why the Celsius and
            Fahrenheit readings meet at exactly -40.
          </p>
          <p className="note">
            A difference carries no offset, so it converts differently: a 10 °C rise is an 18 °F rise, while a reading of
            10 °C is 50 °F. Switch the mode above when you are converting a tolerance or a ramp rather than a reading.
          </p>
          <p className="note">Absolute zero is 0 K, which is -273.15 °C and -459.67 °F.</p>
        </>
      }
    />
  );
}
