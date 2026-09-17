import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import WaferMarkCalculator from '@/tools/wafer-mark-calculator/Calculator';
import { tool } from '@/tools/wafer-mark-calculator';
import { buildToolMetadata } from '@/lib/seo';
import copy from '@/lib/i18n/tool-copy/resources/wafer-mark-calculator';
import { msg } from '@/lib/i18n/tool-copy/msg';

export const metadata: Metadata = buildToolMetadata(tool);

export default function WaferMarkCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      copy={copy}
      formula={[
        { kind: 'text', text: msg('The mark is assembled from four fields, joined by your separator:') },
        { kind: 'math', label: msg('SEMI M12/M13 Wafer Identification Structure'), math: '\\text{Mark} = \\text{LotID} \\mathbin{\\Vert} \\text{Sep} \\mathbin{\\Vert} \\text{WaferNo} \\mathbin{\\Vert} \\text{Sep} \\mathbin{\\Vert} \\text{DateCode} \\mathbin{\\Vert} \\text{Sep} \\mathbin{\\Vert} \\text{Layer}' },
        { kind: 'list', items: [msg('**Wafer number** — leading zeros are stripped, then the value is left-padded to the chosen digit count: wafer 7 with 2 digits becomes 07.'), msg('**Date code** — YYMMDD, YYMM or YYYYMMDD, built from the selected calendar date.'), msg('**Uppercase** — the whole mark is upper-cased after assembly when enabled.'), msg('**Validation** — lot ID and wafer number are required, the wafer number must be alphanumeric, and lot/product/layer accept letters and digits only, so the mark stays safe for dot-peen or laser marking.')] },
      ]}
      notes={[
        msg('This is a formatting utility, not a marking standard. Field order, allowed characters and date encoding are defined by each fab, customer or MES specification.'),
        msg('Character-length budgets for laser or dot-peen marking are set by your equipment; the character counter here only reports the generated string length.'),
        msg('The displayed example values are placeholders — replace them with real lot data before use.'),
      ]}
      faq={[
        {
          question: msg('How is the wafer number zero-padded?'),
          answer:
            msg('Leading zeros are first stripped from your input, then the number is left-padded with zeros until it reaches the configured digit count. Wafer 7 with 2 digits gives 07, with 4 digits gives 0007. The accepted range is 1 to 6 digits.'),
        },
        {
          question: msg('Which date format should I use?'),
          answer:
            msg('YYMMDD is the most common choice for compact marks because it stays short while keeping day-level traceability. YYMM keeps the mark shorter when a monthly grouping is enough, and YYYYMMDD avoids century ambiguity for documentation or data exports.'),
        },
        {
          question: msg('Which characters are rejected, and why?'),
          answer:
            msg('Lot ID and wafer number cannot be empty, the wafer number must contain letters and digits only, and lot, product and layer fields accept letters and digits only. Separators, spaces and punctuation are dropped from those fields so the produced mark cannot break a marking recipe or a downstream parser.'),
        },
        {
          question: msg('Does this match my fab marking standard?'),
          answer:
            msg('No, and it does not claim to. It is a transparent formatter for the common lot / wafer / date / layer pattern. Many fabs add product revision, fab code, check digits or a fixed prefix. Verify the generated string against your own specification before it is used on hardware.'),
        },
      ]}
    >
      <WaferMarkCalculator />
    </ToolPageShell>
  );
}
