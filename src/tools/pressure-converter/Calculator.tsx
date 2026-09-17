
'use client';
import { useToolCopy } from '@/lib/i18n/tool-copy';
import copyResource from '@/lib/i18n/tool-copy/resources/pressure-converter';

import UnitConverter from '@/components/tools/UnitConverter';
import { PRESSURE_LABELS, PRESSURE_UNITS, convertPressure, type PressureUnit } from '@/lib/pressure';

const UNITS = PRESSURE_UNITS.map((unit) => ({ id: unit, label: PRESSURE_LABELS[unit] }));

export default function PressureConverter() {
  const t = useToolCopy(copyResource);
  return (
    <UnitConverter
      title={t("Pressure or vacuum")}
      resultTitle="Converted pressure"
      units={UNITS}
      headlineUnit="Torr"
      initialValue="1"
      initialUnit="atm"
      urlKeyPrefix="pressure"
      convert={(value, unit) => {
        if (!Number.isFinite(value)) return { ok: false, errors: ['Enter a pressure to convert.'] };
        if (value < 0) return { ok: false, errors: ['A pressure cannot be negative.'] };
        return { ok: true, values: convertPressure(value, unit as PressureUnit) };
      }}
      note={
        <>
          <p className="note">
            {t("The Torr is defined as exactly 1/760 atm, so 760 Torr is exactly one atmosphere. The legacy millimetre of mercury differs from the Torr in the seventh significant figure, which matters only for metrology-grade books.")}</p>
          <p className="note">
            {t("psi is derived rather than rounded: 1 lbf is exactly 4.448 221 615 260 5 N and 1 in² is exactly 645.16 mm². Process vacuum is usually quoted in Torr or mbar, where 1 mbar is exactly 100 Pa.")}</p>
        </>
      }
    />
  );
}
