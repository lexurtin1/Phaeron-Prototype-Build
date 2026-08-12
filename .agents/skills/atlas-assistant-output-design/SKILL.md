---
name: atlas-assistant-output-design
description: Design and revise Atlas Assistant answers and their presentation for concise, visually clear market-research output. Use when changing Atlas response prompts, answer structure, Markdown rendering, chatbot typography, information hierarchy, or when Atlas answers feel blocky, repetitive, dense, or difficult to scan.
---

# Atlas Assistant Output Design

Produce answers that can be understood in one quick scan inside a narrow chat panel.

## Shape the answer

1. Lead with a direct one- or two-sentence verdict. Answer the question before adding context.
2. Choose the smallest structure that fits:
   - Simple fact: one short paragraph.
   - Recommendation: verdict, 3–5 evidence bullets, then one next step.
   - Market assessment: verdict, opportunity drivers, constraints, and conclusion.
   - Comparison: short verdict followed by parallel bullets using the same fields.
3. Keep paragraphs to two sentences and roughly 45 words maximum.
4. Keep bullets to one main idea. Start with a bold label when it improves scanning.
5. Prefer 3–5 bullets. Never manufacture sections or bullets to fill a template.
6. End when the question is answered. Offer a next step only when it is useful.

## Establish visual hierarchy

- Use at most one `##` title and two `###` subheadings in a normal answer.
- Use headings only for answers with multiple genuine sections.
- Use bold for short labels, decisive figures, and the central conclusion—not full sentences.
- Use a horizontal rule only once, before a materially different conclusion or action.
- Use tables only for comparisons of three or more items with repeated fields and only when the renderer supports them.
- Spell out acronyms on first use.

## Avoid blocky output

Do not:

- Restate the user’s question.
- Start with generic scene-setting such as “This is a nuanced question.”
- Stack several headings before giving useful information.
- Write uninterrupted paragraphs longer than three lines in the chat panel.
- Repeat the same fact in the verdict, bullets, and conclusion.
- Use nested lists, decorative headings, raw hashtags, or multiple dividers.
- Present unsupported precision or turn missing Atlas data into confident claims.

## Use this compact market-assessment pattern

```markdown
Poland looks like a **credible but conditional opportunity**. Low automation creates a clear infrastructure gap, but absence from the current network is not evidence of easy entry.

### Why it is attractive

- **Automation gap — 40% automated:** A sizeable manual tail may benefit from routing and standardisation.
- **Opportunity score — 80/100:** Atlas ranks it among the stronger profiled markets.
- **Regional position:** Poland can provide a useful Central and Eastern European foothold.

### What could limit entry

- **No existing fund-manager relationships:** Commercial validation must come before infrastructure investment.
- **Local market structure:** Confirm incumbent utilities, regulation, and distributor appetite.

**Bottom line:** Run a focused discovery exercise with Polish managers and distributors before treating this as a launch market.
```

Adapt the pattern to the question; do not reproduce every section mechanically.

## Implement presentation changes

When modifying the Atlas interface:

- Keep semantic Markdown-to-HTML rendering safe by escaping source text before applying formatting.
- Style paragraphs, headings, lists, dividers, emphasis, and code individually.
- Optimize for the 400px desktop chat panel and the mobile breakpoint.
- Keep user messages visually distinct and simpler than assistant research cards.
- Preserve the behavior that positions a completed long answer at its beginning.
- Test representative short, long, list-heavy, and comparison answers.

## Review before completion

Confirm that the result:

- gives the answer in the first visible viewport;
- has a clear reading path without relying on decoration;
- contains no raw Markdown markers;
- avoids duplicated claims;
- remains factual and proportionate to the available Atlas evidence.
