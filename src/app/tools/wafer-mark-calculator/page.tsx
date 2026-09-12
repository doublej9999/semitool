import type { Metadata } from 'next';
import MathFormula from '@/components/tools/MathFormula';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WaferMarkCalculator from '@/tools/wafer-mark-calculator/Calculator';
import { tool } from '@/tools/wafer-mark-calculator';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function WaferMarkCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      formula={
        <>
          <p>The mark is assembled from four fields, joined by your separator:</p>
          <MathFormula
            block
            label="SEMI M12/M13 Wafer Identification Structure"
            math="\text{Mark} = \text{LotID} \mathbin{\Vert} \text{Sep} \mathbin{\Vert} \text{WaferNo} \mathbin{\Vert} \text{Sep} \mathbin{\Vert} \text{DateCode} \mathbin{\Vert} \text{Sep} \mathbin{\Vert} \text{Layer}"
          />
<ul className="info-list">
            <li>
              <strong>Wafer number</strong> — leading zeros are stripped, then the value is left-padded to the chosen digit
              count: wafer 7 with 2 digits becomes <code>07</code>.
            </li>
            <li>
              <strong>Date code</strong> — <code>YYMMDD</code>, <code>YYMM</code> or <code>YYYYMMDD</code>, built from the
              selected calendar date.
            </li>
            <li>
              <strong>Uppercase</strong> — the whole mark is upper-cased after assembly when enabled.
            </li>
            <li>
              <strong>Validation</strong> — lot ID and wafer number are required, the wafer number must be alphanumeric, and
              lot/product/layer accept letters and digits only, so the mark stays safe for dot-peen or laser marking.
            </li>
          </ul>
        </>
      }
      notes={[
        'This is a formatting utility, not a marking standard. Field order, allowed characters and date encoding are defined by each fab, customer or MES specification.',
        'Character-length budgets for laser or dot-peen marking are set by your equipment; the character counter here only reports the generated string length.',
        'The displayed example values are placeholders — replace them with real lot data before use.',
      ]}
      faq={[
        {
          question: 'How is the wafer number zero-padded?',
          answer:
            'Leading zeros are first stripped from your input, then the number is left-padded with zeros until it reaches the configured digit count. Wafer 7 with 2 digits gives 07, with 4 digits gives 0007. The accepted range is 1 to 6 digits.',
        },
        {
          question: 'Which date format should I use?',
          answer:
            'YYMMDD is the most common choice for compact marks because it stays short while keeping day-level traceability. YYMM keeps the mark shorter when a monthly grouping is enough, and YYYYMMDD avoids century ambiguity for documentation or data exports.',
        },
        {
          question: 'Which characters are rejected, and why?',
          answer:
            'Lot ID and wafer number cannot be empty, the wafer number must contain letters and digits only, and lot, product and layer fields accept letters and digits only. Separators, spaces and punctuation are dropped from those fields so the produced mark cannot break a marking recipe or a downstream parser.',
        },
        {
          question: 'Does this match my fab marking standard?',
          answer:
            'No, and it does not claim to. It is a transparent formatter for the common lot / wafer / date / layer pattern. Many fabs add product revision, fab code, check digits or a fixed prefix. Verify the generated string against your own specification before it is used on hardware.',
        },
      ]}
    >
      <WaferMarkCalculator />
    </ToolPageShell>
  );
}
