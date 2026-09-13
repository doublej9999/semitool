import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import EsdEstimatorCalculator from '@/tools/esd-estimator-calculator/Calculator';
import { tool } from '@/tools/esd-estimator-calculator';
import { ACCURACY_NOTES, ESD_DISCLAIMER } from '@/lib/esd-estimator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function EsdEstimatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      notes={[
        ESD_DISCLAIMER,
        ...ACCURACY_NOTES.slice(1),
        'The catalog covers 3 stress models — HBM (100 pF / 1500 Ω, classes 1A–2: 250 / 500 / 1000 / 2000 V), MM (200 pF / ~0 Ω, 200 V target) and CDM (device-charged, pin-level 250 / 500 V targets) — and 3 device families: input pad diode pair (0.012 kV/µm of junction perimeter), grounded-gate NMOS (0.008 kV/µm of gate width) and chip-level supply clamp (0.003 kV/µm of total clamp width).',
        'Sizing math: HBM level ≈ constant × size. MM and CDM levels are derived from that HBM number through empirical severity correlations (≈1/10 and ≈1/8 of the HBM level in volts), so every MM/CDM digit inherits a very wide literature spread on top of the ±30%+ device spread.',
        'Suggested sizing is the inverse rule, rounded UP to 0.1 µm so it never undersizes the target — it is a starting point for a protection sketch, not a final device width.',
        'Pin type does not change the scaling; it changes the warnings. Power-pin robustness is set by the supply clamp network and rail resistance, output pins often get free self-protection from the driver, and inputs are what the diode-pair rule was calibrated on.',
        'This tool deliberately answers only "is the device size in the right ballpark for the target class?". Latch-up, safe-operating-area, domain-crossing, inter-domain and cable-discharge issues are out of scope.',
      ]}
      faq={[
        {
          question: 'If the calculator says my diode passes 2 kV HBM, will the chip pass qualification?',
          answer:
            'Not necessarily — and the tool never claims it will. The estimate is a rule-of-thumb scaling from literature-typical constants. Qualification means building packaged parts on your foundry process and stressing them per ANSI/ESDA-JEDEC JS-001 (HBM) / JS-002 (CDM) at an ESD lab, plus checking the foundry ESD library guidelines that ship with your PDK. The estimate is for early architecture and sizing sanity checks only.',
        },
        {
          question: 'Why do the MM and CDM numbers feel so much less trustworthy than the HBM ones?',
          answer:
            'Because they are correlations, not physics of the same kind. Device-size scaling is calibrated on HBM. MM and CDM passing levels are then estimated through empirical severity ratios (MM ≈ 1/10 of HBM in volts, CDM ≈ 1/8) whose literature spreads span a factor of several. CDM is worse still: robustness is dominated by package capacitance, pin interconnect and gate-oxide integrity, so a bigger protection diode does not buy CDM margin the way it buys HBM margin.',
        },
        {
          question: 'What do the class targets mean (Class 1A, 1B, 1C, 2)?',
          answer:
            'JEDEC-style HBM classification bands: Class 0 is below 250 V, 1A is 250–<500 V, 1B is 500–<1000 V, 1C is 1000–<2000 V, 2 is 2000–<4000 V and so on. The tool offers 250 / 500 / 1000 / 2000 V as the four most common datasheet targets; passing an estimate at exactly a limit counts as meeting that class (boundary passes). Common product targets are 2 kV HBM and 500 V CDM for general-purpose I/O.',
        },
        {
          question: 'Why does the suggested size for a 200 V MM target look bigger than for a 2 kV HBM target divided by ten?',
          answer:
            'Because MM is more severe per volt: 200 pF discharging through ~0 Ω delivers far more current than 100 pF through 1500 Ω. Empirically, silicon that survives 200 V MM corresponds to roughly 2 kV HBM capability, so the inverse sizing ends up similar in scale — the tool makes that conversion explicit instead of hiding it. Note that MM has been dropped from most modern qualification suites; it is kept for datasheet comparisons.',
        },
        {
          question: 'What is TLP, and why does every caveat here mention it?',
          answer:
            'Transmission-line pulsing measures the actual I–V behaviour of a protection structure under square pulses of increasing current — including It2, the failure current. It is the standard way ESD engineers characterize and tune devices before committing to silicon. Where a rule of thumb gives you "≈1.2 kV for 100 µm", a TLP curve gives you the real snapback, holding voltage and failure point of your foundry structure. If you are sizing anything beyond a first sketch, ask your foundry for the ESD library and TLP data.',
        },
        {
          question: 'My foundry ESD guideline quotes different kV/µm numbers. Which is right?',
          answer:
            'The foundry, always. Effective robustness per µm depends on junction engineering, silicide blocking, ballast layout, failure criteria and the qualification flow of that exact process. The constants here (0.012 / 0.008 / 0.003 kV/µm) are order-of-magnitude references for generic logic I/O. Treat any disagreement within ±50 % as expected, and treat this tool as the sanity check that catches a 10× sizing mistake before it reaches review.',
        },
      ]}
    >
      <EsdEstimatorCalculator />
    </ToolPageShell>
  );
}
