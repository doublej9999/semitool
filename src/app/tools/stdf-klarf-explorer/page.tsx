import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import StdfKlarfExplorer from '@/tools/stdf-klarf-explorer/Calculator';
import { tool } from '@/tools/stdf-klarf-explorer';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/stdf-klarf-explorer';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function StdfKlarfExplorerPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'text', text: msg('For each test, the PTR results of a lot are summarized with the sample mean **μ** and the sample standard deviation (n − 1 divisor) **σ**. The process capability index is:') },
        { kind: 'math', label: msg('Cpk (two-sided)'), math: 'C_{pk} = \\min\\!\\left( \\frac{USL - \\mu}{3\\sigma},\\; \\frac{\\mu - LSL}{3\\sigma} \\right)' },
        { kind: 'text', text: msg('For one-sided tests only the existing spec side is used — an upper-only test reports{\' \'} and a lower-only test reports{\' \'} . Cpk is only computed when at least one limit is available and σ > 0: a zero-σ sample cannot bound the tail behaviour, so an infinite Cpk would be misleading.') },
        { kind: 'math', label: msg('Die yield (from PRR part records)'), math: 'Y = \\frac{N_{\\text{pass}}}{N_{\\text{total}}} \\times 100\\%' },
        { kind: 'list', items: [msg('**P95** — the 95th percentile of the results, interpolated linearly between closest ranks (Type 7), the same estimator used across this site.'), msg('**Out of spec** — results below the LSL and/or above the USL, counted only on the sides where a limit is provided.'), msg('**Defect density** (KLARF) — total defects divided by the wafer area in cm², using the wafer diameter declared in the file (300 mm default).')] },
      ]}
      notes={[
        msg('STDF V4 is a binary SEMI format; this tool parses the record stream client-side (FAR, MIR, MRR, WIR/WRR, WCR, HBR/SBR, PRR, PTR) with automatic endianness detection from the FAR record. STDF bytes are parsed in a background Web Worker so large datalogs do not freeze the page; KLARF is parsed as text on the main thread. Nothing is uploaded.'),
        msg('PTR retention is capped to bound memory on very large datalogs: the background worker keeps up to 200,000 PTR records, while the automatic main-thread fallback (browsers without worker support) keeps 5,000. Files beyond the active cap show a partial parametric sample (bin/yield data from PRR is never capped).'),
        msg('Per-test limits default to the LOW_LIMIT / HIGH_LIMIT values found in the file PTR records; you can override them per test with the inline LSL/USL fields to evaluate alternate spec windows.'),
        msg('The correlation view aligns two tests\' PTR records part-by-part — by head/site number and part execution order — and reports Pearson r and Spearman ρ over the shared parts, plus a "Strongest pairs" table ranked by |r| across the largest tests.'),
        msg('KLARF 1.0/1.2 files are parsed as ASCII text: header tokens (LotID, WaferID, DeviceID, StepID, DiePitch), the DefectRecordSpec column schema, and the DefectList rows. Clustering is a DBSCAN-style spatial grouping that flags scratch (high aspect ratio) and hotspot (dense burst) patterns.'),
        msg('Bin distribution uses the soft bin and falls back to the hard bin when the soft bin is 0 (not specified), matching common datalogging conventions.'),
        msg('The synthetic demo generates a valid STDF V4 binary stream (120 parts, ~92% yield) plus four parametric tests so you can explore the workflow without production data.'),
      ]}
      faq={[
        {
          question: msg('What is the difference between STDF and KLARF?'),
          answer:
            msg('STDF (Standard Test Data Format, SEMI/Teradyne) is the binary datalog produced by ATE testers during wafer sort and final test — it carries per-part results (PRR), bins, and per-measurement parametric records (PTR). KLARF (KLA Results File) is the ASCII output of defect inspection tools (KLA-Tencor and similar) — it carries defect coordinates, sizes, class numbers and cluster information per wafer. Test (STDF) tells you how die passed; inspection (KLARF) tells you what physical defects were seen.'),
        },
        {
          question: msg('Which STDF records does the explorer decode?'),
          answer:
            msg('FAR (file attributes and endianness), MIR (lot, part type, tester), MRR, WRR (wafer results, yield counts), WCR (wafer geometry), PRR (per-part pass/fail, X/Y, hard/soft bin) and PTR (test number, result, limits, units). Unknown records are skipped by header length, so newer extensions do not break parsing.'),
        },
        {
          question: msg('Why is Cpk missing for some tests?'),
          answer:
            msg('Cpk needs at least one specification limit and a non-zero sample σ. One-sided tests with only one limit use that side. Tests with no limits in the file (OPT_FLAG bits set) show Cpk only after you type an LSL or USL into the inline fields, and constant-valued tests (σ = 0) intentionally report no Cpk.'),
        },
        {
          question: msg('What does "Open in SPC" do?'),
          answer:
            msg('It serializes that test\'s results into subgroups of 5 consecutive readings and opens the SPC Control Chart Calculator with the same subgroups URL parameter used everywhere on this site, so the X-bar & R chart is pre-filled with the test data for control-limit analysis.'),
        },
        {
          question: msg('Is my production datalog safe here?'),
          answer:
            msg('Yes. Files are read with the browser File API and parsed locally in your tab (STDF in a background Web Worker); there is no server upload and no telemetry. For convenience, the last parsed STDF summary is cached locally in your browser\'s IndexedDB so the tool can offer to restore it after a reload — it never leaves your machine, and clearing this site\'s browser data removes it.'),
        },
        {
          question: msg('How does the PTR correlation view work?'),
          answer:
            msg('STDF datalogs emit one PTR per part per site in execution order, so the k-th record for a given (head, site) pair in each test\'s stream is the k-th part measured there. The explorer aligns the two tests on those occurrence indexes, drops parts that only exist in one stream or have invalid readings, then reports Pearson r (linear), Spearman ρ (rank-based, robust to nonlinearity and outliers) and the aligned sample size n. The scatter plot shows every aligned pair; the "Strongest pairs" table ranks all test pairs from the largest groups by |r| so unexpected couplings surface quickly.'),
        },
      ]}
    >
      <StdfKlarfExplorer />
    </ToolPageShell>
  );
}
