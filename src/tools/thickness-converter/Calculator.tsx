
'use client';

import UnitConverter from '@/components/tools/UnitConverter';
import { LENGTH_LABELS, LENGTH_UNITS, convertLength, type LengthUnit } from '@/lib/units';

const UNITS = LENGTH_UNITS.map((unit) => ({ id: unit, label: LENGTH_LABELS[unit] }));

export default function ThicknessConverter() {
  return (
    <UnitConverter
      title="Length or film thickness"
      resultTitle="Converted length"
      units={UNITS}
      headlineUnit="nm"
      initialValue="1000"
      initialUnit="angstrom"
      convert={(value, unit) => {
        if (!Number.isFinite(value)) return { ok: false, errors: ['Enter a length to convert.'] };
        if (value < 0) return { ok: false, errors: ['A length cannot be negative.'] };
        return { ok: true, values: convertLength(value, unit as LengthUnit) };
      }}
      note={
        <>
          <p className="note">
            1 in is exactly 25.4 mm and 1 mil is exactly 0.001 in, so the inch and mil rows carry no rounding at all. One
            ångström is exactly 0.1 nm, which is why 1000 Å reads as 100 nm.
          </p>
          <p className="note">
            Thermal oxides are usually quoted in ångström and deposited films in nanometres. A supplier who writes
            &ldquo;10 kÅ&rdquo; means 1000 nm, and a &ldquo;25 mil&rdquo; wafer is 635 µm thick.
          </p>
        </>
      }
    />
  );
}
