# Testing

## Validate framework references

When the Sapporta framework checkout is available beside this repository, run:

```bash
node scripts/check-sapporta-reference-contract.mjs ../sapporta
```

The check keeps the skill's server row-query routing, CLI table-query guidance,
frontend table clients, form examples, generated QueryClient seam, cache/Grid
effects, and generated agent instructions aligned with framework exports. CI
checks the same contract against the framework's `main` branch and strictly
typechecks the compact form example. After installing and building the adjacent
framework checkout, run the same typecheck locally with `--typecheck`.
