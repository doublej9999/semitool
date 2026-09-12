
'use client';

import { useState } from 'react';
import UnitConverter from '@/components/tools/UnitConverter';
import {
  GAS_FLOW_LABELS,
  GAS_FLOW_UNITS,
  GASES,
  REFERENCE_LABELS,
  REFERENCE_TEMPERATURES,
  convertGasFlow,
  molarVolumeCm3,
  type GasFlowUnit,
  type ReferenceTemperature,
} from '@/lib/gas-flow';
import { useUrlParamsState } from '@/lib/use-url-state';

const UNITS = GAS_FLOW_UNITS.map((unit) => ({ id: unit, label: GAS_FLOW_LABELS[unit] }));

const fmt = (value: number) => Number(value.toPrecision(6)).toString();

export default function GasFlowConverter() {
  const [state, setState] = useState({ gasId: GASES[0].id, temperature: 0 as ReferenceTemperature });
  useUrlParamsState(state, setState);
  const { gasId, temperature } = state;

  const gas = GASES.find((entry) => entry.id === gasId) ?? GASES[0];
  const molarVolume = molarVolumeCm3(temperature);

  return (
    <UnitConverter
      title="Gas flow"
      resultTitle="Converted flow"
      units={UNITS}
      headlineUnit="slm"
      initialValue="100"
      initialUnit="sccm"
      controls={
        <>
          <div className="field">
            <label htmlFor="gas-kind">Gas</label>
            <select id="gas-kind" value={gasId} onChange={(event) => setState((current) => ({ ...current, gasId: event.target.value }))}>
              {GASES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="gas-reference">Reference temperature</label>
            <select
              id="gas-reference"
              value={temperature}
              onChange={(event) => setState((current) => ({ ...current, temperature: Number(event.target.value) as ReferenceTemperature }))}
            >
              {REFERENCE_TEMPERATURES.map((entry) => (
                <option key={entry} value={entry}>
                  {REFERENCE_LABELS[entry]}
                </option>
              ))}
            </select>
          </div>
        </>
      }
      convert={(value, unit) => {
        if (!Number.isFinite(value)) return { ok: false, errors: ['Enter a flow to convert.'] };
        if (value < 0) return { ok: false, errors: ['A flow cannot be negative.'] };
        return {
          ok: true,
          values: convertGasFlow(value, unit as GasFlowUnit, {
            temperatureC: temperature,
            molarMass: gas.molarMass,
          }),
        };
      }}
      note={
        <>
          <p className="note">
            sccm and slm only mean something together with a reference, so the standard is an input here. At{' '}
            {REFERENCE_LABELS[temperature]} and 1 atm, one mole of ideal gas occupies {fmt(molarVolume)} cm³, which puts 1
            sccm at {fmt(1e6 / molarVolume)} µmol/min.
          </p>
          <p className="note">
            Every volumetric row is referenced to that standard, not to your chamber. For the actual flow at process
            pressure P and temperature T, multiply the standard flow by (1 atm / P) x (T / 273.15 K or 298.15 K to match
            the reference you chose).
          </p>
          <p className="note">
            The g/min row uses {gas.name} at {fmt(gas.molarMass)} g/mol, built from IUPAC conventional atomic weights.
            Molar flow comes from the ideal gas law, which is within a few parts in a thousand of real-gas behaviour at
            1 atm.
          </p>
        </>
      }
    />
  );
}
