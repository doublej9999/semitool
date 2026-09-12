import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import StdfKlarfExplorer from '@/tools/stdf-klarf-explorer/Calculator';
import { tool } from '@/tools/stdf-klarf-explorer';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function StdfKlarfExplorerPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p>
            For each test, the PTR results of a lot are summarized with the sample mean <strong>μ</strong> and the
            sample standard deviation (n − 1 divisor) <strong>σ</strong>. The process capability index is:
          </p>
          <MathFormula
            block
            label="Cpk (two-sided)"
            math="C_{pk} = \min\!\left( \frac{USL - \mu}{3\sigma},\; \frac{\mu - LSL}{3\sigma} \right)"
          />
          <p>
            For one-sided tests only the existing spec side is used — an upper-only test reports{' '}
            <MathFormula math="(USL - \mu)/3\sigma" /> and a lower-only test reports{' '}
            <MathFormula math="(\mu - LSL)/3\sigma" />. Cpk is only computed when at least one limit is available and
            σ &gt; 0: a zero-σ sample cannot bound the tail behaviour, so an infinite Cpk would be misleading.
          </p>
          <MathFormula
            block
            label="Die yield (from PRR part records)"
            math="Y = \frac{N_{\text{pass}}}{N_{\text{total}}} \times 100\%"
          />
          <ul className="info-list">
            <li>
              <strong>P95</strong> — the 95th percentile of the results, interpolated linearly between closest ranks
              (Type 7), the same estimator used across this site.
            </li>
            <li>
              <strong>Out of spec</strong> — results below the LSL and/or above the USL, counted only on the sides
              where a limit is provided.
            </li>
            <li>
              <strong>Defect density</strong> (KLARF) — total defects divided by the wafer area in cm², using the
              wafer diameter declared in the file (300 mm default).
            </li>
          </ul>
        </>
      }
      notes={[
        'STDF V4 is a binary SEMI format; this tool parses the record stream client-side (FAR, MIR, MRR, WIR/WRR, WCR, HBR/SBR, PRR, PTR) with automatic endianness detection from the FAR record. Nothing is uploaded — parsing happens in your browser.',
        'The parser caps PTR retention at 5,000 records per file to bound memory on very large datalogs; multi-wafer lots exceeding the cap will show a partial parametric sample (bin/yield data from PRR is unaffected).',
        'Per-test limits default to the LOW_LIMIT / HIGH_LIMIT values found in the file PTR records; you can override them per test with the inline LSL/USL fields to evaluate alternate spec windows.',
        'KLARF 1.0/1.2 files are parsed as ASCII text: header tokens (LotID, WaferID, DeviceID, StepID, DiePitch), the DefectRecordSpec column schema, and the DefectList rows. Clustering is a DBSCAN-style spatial grouping that flags scratch (high aspect ratio) and hotspot (dense burst) patterns.',
        'Bin distribution uses the soft bin and falls back to the hard bin when the soft bin is 0 (not specified), matching common datalogging conventions.',
        'The synthetic demo generates a valid STDF V4 binary stream (120 parts, ~92% yield) plus four parametric tests so you can explore the workflow without production data.',
      ]}
      faq={[
        {
          question: 'What is the difference between STDF and KLARF?',
          answer:
            'STDF (Standard Test Data Format, SEMI/Teradyne) is the binary datalog produced by ATE testers during wafer sort and final test — it carries per-part results (PRR), bins, and per-measurement parametric records (PTR). KLARF (KLA Results File) is the ASCII output of defect inspection tools (KLA-Tencor and similar) — it carries defect coordinates, sizes, class numbers and cluster information per wafer. Test (STDF) tells you how die passed; inspection (KLARF) tells you what physical defects were seen.',
        },
        {
          question: 'Which STDF records does the explorer decode?',
          answer:
            'FAR (file attributes and endianness), MIR (lot, part type, tester), MRR, WRR (wafer results, yield counts), WCR (wafer geometry), PRR (per-part pass/fail, X/Y, hard/soft bin) and PTR (test number, result, limits, units). Unknown records are skipped by header length, so newer extensions do not break parsing.',
        },
        {
          question: 'Why is Cpk missing for some tests?',
          answer:
            'Cpk needs at least one specification limit and a non-zero sample σ. One-sided tests with only one limit use that side. Tests with no limits in the file (OPT_FLAG bits set) show Cpk only after you type an LSL or USL into the inline fields, and constant-valued tests (σ = 0) intentionally report no Cpk.',
        },
        {
          question: 'What does "Open in SPC" do?',
          answer:
            'It serializes that test\'s results into subgroups of 5 consecutive readings and opens the SPC Control Chart Calculator with the same subgroups URL parameter used everywhere on this site, so the X-bar & R chart is pre-filled with the test data for control-limit analysis.',
        },
        {
          question: 'Is my production datalog safe here?',
          answer:
            'Yes. Files are read with the browser File API and parsed in JavaScript in your tab; there is no server upload, no telemetry and no persistence. Closing the tab discards everything.',
        },
      ]}
    >
      <StdfKlarfExplorer />
    </ToolPageShell>
  );
}
