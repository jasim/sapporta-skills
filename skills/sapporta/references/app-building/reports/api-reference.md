# Route-Based Report Reference

Use the canonical documentation for report API and type details.

Use the canonical documentation:

- Report datasets: https://sapporta.com/docs/guides/reports/report-datasets-and-formatting.md
- Grid result shape: https://sapporta.com/docs/reference/reports/grid-dataset.md
- Report routes: https://sapporta.com/docs/reference/reports/report-routes-and-registration.md
- Scoped report data: https://sapporta.com/docs/reference/reports/scoped-report-helpers.md

Agent reminder: keep report mappers pure, include hidden IDs for links
(`visuallyHidden: true`), declare `links`/`rowLinks` on dataset columns and
levels for drill-downs (see [linking.md](linking.md)), and validate route
output with `gridDatasetSchema`.
