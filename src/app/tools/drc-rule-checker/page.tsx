import type { Metadata } from 'next';
import ToolPageShell from '@/components/tools/ToolPageShell';
import DrcRuleCheckerCalculator from '@/tools/drc-rule-checker/Calculator';
import { tool } from '@/tools/drc-rule-checker';
import { DRC_DISCLAIMER } from '@/lib/drc-rules';
import { buildToolMetadata } from '@/lib/seo';

export const metadata: Metadata = buildToolMetadata(tool);

export default function DrcRuleCheckerPage() {
  return (
    <ToolPageShell
      tool={tool}
      notes={[
        DRC_DISCLAIMER,
        'The catalog covers 8 generic process families (180 nm, 130 nm, 90 nm, 65 nm, 45 nm, 28 nm, 14 nm FinFET, 7 nm FinFET) × 12 layers (poly, active/fins, metal1–metal5, contact, via1–via4) with literature-typical minimum width, spacing, pitch (width + spacing), contact/via enclosure and, from 90 nm down, minimum-area reminders.',
        'Real decks differ per foundry, fab option and PDK version: dense vs isolated spacing tables, wide-metal rules, RF/mixed-signal options and revision updates routinely move individual numbers — enclosure and min-area rules are the most fab-specific of all.',
        'A pass here means drawn ≥ rule for a single value. Sign-off DRC additionally runs density, antenna, notching, end-of-line, width-dependent spacing, off-grid/rounding and OPC-aware checks that this tool does not model.',
        'Margin = drawn − rule (positive slack, zero margin passes) and drawn/rule shows the same result as a factor. Unknown nodes/layers and non-finite drawn values are reported as skipped, never silently scored.',
        'Minimum pitch is shown as width + spacing; FinFET fin pitch is set by the sidewall image transfer (SADP), and real decks add aligned-via, gate-cut and middle-of-line exceptions.',
        'Min-area values are display-only: use them as an order-of-magnitude reminder for wide-to-narrow tapers and one-dimensional shapes; the checker itself scores width, spacing, pitch and enclosure only.',
      ]}
      faq={[
        {
          question: 'Is this a DRC sign-off tool? Will my layout pass tapeout if everything shows "pass"?',
          answer:
            'No — and the tool says so everywhere on purpose. The catalog is a rule-of-thumb reference compiled from literature-typical values for generic processes of each era. It answers "is my number even in the right ballpark for this node?" during early design and architecture exploration. Sign-off requires the foundry DRC deck of your exact PDK version run in the vendor tool; always check the signed-off design rule manual.',
        },
        {
          question: 'Why does my foundry quote different numbers than the table?',
          answer:
            'Node labels are family names, not specs. A "28 nm" deck varies by foundry and by option (HP vs LP vs HPC, RF, eFlash), dense vs isolated spacing rules differ, top metals differ, and enclosures are the most fab-specific values in the whole deck. Treat any single-value disagreement as expected; treat a systematic factor-of-two disagreement as a sign you picked the wrong node family.',
        },
        {
          question: 'How are margin and drawn/rule meant to be read?',
          answer:
            'Margin = drawn − rule in µm: positive is slack, zero passes (drawn == rule), negative is a violation by that amount. Drawn/rule expresses the same as a factor — ≥ 1 passes, so 0.975 means 2.5 % too small. Ratio is handy for scaling: designing at ×1.2 of every minimum is a common conservative starting point.',
        },
        {
          question: 'Why is minimum pitch just width + spacing, and why can I not check area?',
          answer:
            'Width + spacing is the classic rule-of-thumb pitch; real decks add aligned-via, gate-cut and colour-dependent exceptions, and FinFET fin pitch comes from SADP sidewall transfer rather than a drawn width plus spacing. Area is deliberately display-only: min-area violations depend on the whole polygon shape, not on one number, so a single drawn value cannot be checked honestly.',
        },
        {
          question: 'Why did my check show "no-rule" instead of pass/fail?',
          answer:
            'The checker refuses to guess. Unknown node families, layer ids that are not in the 12-layer catalog, and kinds that do not apply (e.g. an enclosure check on a metal layer — enclosure only exists around contact/via cuts) return no-rule. Non-finite or non-positive drawn values return invalid. Every skipped check is counted in the summary so it cannot hide.',
        },
      ]}
    >
      <DrcRuleCheckerCalculator />
    </ToolPageShell>
  );
}
