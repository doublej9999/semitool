
'use client';

import UnitConverter from '@/components/tools/UnitConverter';
import {
  POWER_LABELS,
  POWER_UNITS,
  belowZeroPower,
  convertPower,
  type PowerUnit,
} from '@/lib/power';

const units = POWER_UNITS.map((unit) => ({ id: unit, label: POWER_LABELS[unit] }));

export default function PowerConverter() {
  return (
    <UnitConverter
      title="Power"
      resultTitle="Converted power"
      units={units}
      headlineUnit="dBm"
      initialValue="1"
      initialUnit="W"
      convert={(value, unit) => {
        if (!Number.isFinite(value)) return { ok: false, errors: ['Enter a power to convert.'] };
        if (belowZeroPower(value, unit as PowerUnit)) {
          return {
            ok: false,
            errors: ['A linear power reading cannot be negative. A negative decibel reading is fine; a negative watt is not.'],
          };
        }
        return { ok: true, values: convertPower(value, unit as PowerUnit) };
      }}
      note={
        <>
          <p className="note">
            1 hp = 550 ft·lbf/s = 745.6998715822702 W exactly; 1 BTU(IT) = 1055.05585262 J and 1 cal(th) = 4.184 J
            exactly, so the thermal units follow from their definitions rather than from a rounded table.
          </p>
          <p className="note">
            dBm and dBW are logarithmic: 0 dBm is 1 mW and 0 dBW is 1 W. A linear reading of zero watts has no finite
            decibel value, so the dBm and dBW rows show a dash instead of a large negative number that looks like an
            answer.
          </p>
        </>
      }
    />
  );
}
