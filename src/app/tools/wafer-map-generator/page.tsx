import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WaferMapGenerator from '@/tools/wafer-map-generator/Calculator';
import { tool } from '@/tools/wafer-map-generator';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: tool.path },
  openGraph: {
    title: `${tool.name} — SemiTools`,
    description: tool.description,
    url: absoluteUrl(tool.path),
    type: 'website',
  },
};

export default function WaferMapGeneratorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p>
            Die centres are generated on a pitch grid (X pitch and Y pitch, plus optional X/Y offsets) and placed only when
            the centre is inside the effective radius:
          </p>
          <p className="formula-expression">centerX² + centerY² ≤ (D / 2 − E)²</p>
          <ul className="info-list">
            <li>Each die keeps dieNumber, row, column, x/y grid index, centerX, centerY and status.</li>
            <li>
              A die is automatically flagged <strong>Edge</strong> when its outer boundary reaches the effective radius,
              i.e. when it sits in the last placement ring.
            </li>
            <li>
              Row and column are 1-based grid indices counted from the lower-left placed die; the origin (0, 0) is the wafer
              centre.
            </li>
            <li>
              Statuses: Good, Defect, Skip, Edge. Exports: CSV and JSON, both in millimetres.
            </li>
          </ul>
        </>
      }
      notes={[
        'The map is generated in the browser; die coordinates are never uploaded.',
        'The renderer scales die rectangles for readability, so on-screen pixels are not a metrology reference — use the exported coordinates.',
        'Statuses are manual labels for planning or test-data review. This tool does not read prober, AOI or bin files.',
        'This is a generic calculation and may not match a specific fab, customer, equipment or MES specification.',
      ]}
      faq={[
        {
          question: 'What do the four die statuses mean?',
          answer:
            'Good is a die that passed, Defect is a die known to be bad (often replaced by a bin number in real data), Skip is a position intentionally not tested or populated, and Edge is a die placed in the outer ring of the effective radius where yield and processing are typically less uniform.',
        },
        {
          question: 'How do I select and reclassify a single die?',
          answer:
            'Click a die on the map, or type its die number in the die inspector and press Enter. The inspector shows the die centre coordinates, row and column, then offers a status button for each of the four statuses. Everything is keyboard reachable: the die number field accepts Enter to select.',
        },
        {
          question: 'What is in the CSV and JSON export?',
          answer:
            'The CSV has the header dieNumber,x,y,row,column,centerX,centerY,status and one line per placed die, which opens directly in a spreadsheet. The JSON export contains the same records as an array of objects, ready to feed into a script or a plotting library.',
        },
        {
          question: 'Why do some wafer edge positions have no die?',
          answer:
            'Die are only placed when their centre lies inside the effective radius (wafer radius minus edge exclusion). Positions outside that circle are intentionally empty rather than drawn as partial die, so the statistics always refer to fully placed die.',
        },
      ]}
    >
      <WaferMapGenerator />
    </ToolPageShell>
  );
}
