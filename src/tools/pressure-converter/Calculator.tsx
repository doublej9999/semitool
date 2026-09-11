
'use client';

import UnitConverter from '@/components/tools/UnitConverter';
import { PRESSURE_LABELS, PRESSURE_UNITS, convertPressure, type PressureUnit } from '@/lib/pressure';

const UNITS = PRESSURE_UNITS.map((unit) => ({ id: unit, label: PRESSURE_LABELS[unit] }));

export default function PressureConverter() {
  return (
    <UnitConverter
      title="Pressure or vacuum"
      resultTitle="Converted pressure"
      units={UNITS}
      headlineUnit="Torr"
      initialValue="1"
      initialUnit="atm"
      convert={(value, unit) => {
        if (!Number.isFinite(value)) return { ok: false, errors: ['Enter a pressure to convert.'] };
        if (value < 0) return { ok: false, errors: ['A pressure cannot be negative.'] };
        return { ok: true, values: convertPressure(value, unit as PressureUnit) };
      }}
      note={
        <>
          <p className="note">
            The Torr is defined as exactly 1/760 atm, so 760 Torr is exactly one atmosphere. The legacy millimetre of
            mercury differs from the Torr in the seventh significant figure, which matters only for metrology-grade
            books.
          </p>
          <p className="note">
            psi is derived rather than rounded: 1 lbf is exactly 4.448 221 615 260 5 N and 1 in² is exactly 645.16 mm².
            Process vacuum is usually quoted in Torr or mbar, where 1 mbar is exactly 100 Pa.
          </p>
        </>
      }
    />
  );
}
