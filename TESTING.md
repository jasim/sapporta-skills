# Testing

## Validate framework references

When the Sapporta framework checkout is available beside this repository, run:

```bash
node scripts/check-sapporta-reference-contract.mjs ../sapporta
```

The check keeps the form guidance and examples aligned with the framework's
public TanStack Form and Query exports, generated QueryClient seam, cache/Grid
effects, and generated agent instructions. CI checks the same contract against
the framework's `main` branch and strictly typechecks the compact form example.
After installing and building the adjacent framework checkout, run the same
typecheck locally with `--typecheck`.
