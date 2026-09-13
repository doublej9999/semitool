## Summary

<!-- What does this PR change and why? Link the issue if there is one. -->

## Checklist

- [ ] `npm run lint` reports 0 problems
- [ ] `npm test` green (unit/component suite)
- [ ] `npm run e2e` green (if shell/toolbar/tool-flow touched)
- [ ] `npm run build` + `npm run check:budget` pass
- [ ] New/changed tool: registered in `src/tools/index.ts`, route page added,
      5-locale entries in `src/lib/i18n/tool-dictionaries/`, pure logic in
      `src/lib` with a twin test file
- [ ] New/changed model: accuracy boundary stated honestly (formula, notes,
      assumptions sections updated)
- [ ] No confidential data embedded anywhere (synthetic examples only)
