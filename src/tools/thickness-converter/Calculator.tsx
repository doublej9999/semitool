
'use client';
import { useToolCopy } from '@/lib/i18n/tool-copy';
import copyResource from '@/lib/i18n/tool-copy/resources/thickness-converter';

import UnitConverter from '@/components/tools/UnitConverter';
import { LENGTH_LABELS, LENGTH_UNITS, convertLength, type LengthUnit } from '@/lib/units';

const UNITS = LENGTH_UNITS.map((unit) => ({ id: unit, label: LENGTH_LABELS[unit] }));

export default function ThicknessConverter() {
  const t = useToolCopy(copyResource);
  return (
    <UnitConverter
      title={t("Length or film thickness")}
      resultTitle="Converted length"
      units={UNITS}
      headlineUnit="nm"
      initialValue="1000"
      initialUnit="angstrom"
      urlKeyPrefix="thickness"
      convert={(value, unit) => {
        if (!Number.isFinite(value)) return { ok: false, errors: ['Enter a length to convert.'] };
        if (value < 0) return { ok: false, errors: ['A length cannot be negative.'] };
        return { ok: true, values: convertLength(value, unit as LengthUnit) };
      }}
      note={
        <>
          <p className="note">
            {t("1 in is exactly 25.4 mm and 1 mil is exactly 0.001 in, so the inch and mil rows carry no rounding at all. One ångström is exactly 0.1 nm, which is why 1000 Å reads as 100 nm.")}</p>
          <p className="note">
            {t("Thermal oxides are usually quoted in ångström and deposited films in nanometres. A supplier who writes “10 kÅ” means 1000 nm, and a “25 mil” wafer is 635 µm thick.")}</p>
        </>
      }
    />
  );
}
