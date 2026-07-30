# Product Model And Coherent Slice

Use this workflow for every new Sapporta application and every change to
application behavior. Complete it after establishing the project context and
before reading implementation-specific table, endpoint, report, form, or Grid
references.

The gate is common; its depth is proportional to the request. Do not turn a
small, well-understood adjustment into a full product-discovery exercise.

## Contents

- [Calibrate The Design Pass](#calibrate-the-design-pass)
- [Model The Outcome](#model-the-outcome)
- [Define The Coherent Slice](#define-the-coherent-slice)
- [Use The Default Application Grammar](#use-the-default-application-grammar)
- [Design The Workflow Shell](#design-the-workflow-shell)
- [Map The Slice To Sapporta](#map-the-slice-to-sapporta)
- [Accept The User Outcome](#accept-the-user-outcome)

## Calibrate The Design Pass

- **New application:** define the actors, outcomes, operational questions, MVP
  boundary, primary and supporting resources, events, relationships, ownership,
  states, lifecycles, workflows, invariants, authorization, expected failures,
  and slice sequence.
- **New feature:** define the delta to the established model: the affected
  actor and outcome, reused or new resources, relationship or lifecycle
  changes, invariants, authorization, expected failures, success destination,
  and compatibility with existing workflows.
- **Fine-grained behavior or UI adjustment:** define the interaction contract:
  source state, triggering event, resulting state or navigation, data
  dependency, loading and failure behavior, keyboard and pointer behavior,
  authorization boundary, and observable acceptance checks.

Infer established decisions from the inspected application. Ask only about
unresolved choices that materially affect scope, authorization, lifecycle, data
integrity, or the user-visible interaction.

## Model The Outcome

Start with the actor's intended result, not a requested Sapporta primitive.
Use these terms:

- **Actor:** a person, role, or external system that uses or affects the app.
- **Outcome:** a result an actor wants, such as assigning work, completing an
  order, or finding overdue accounts.
- **Domain resource:** a durable business object with identity and a lifecycle.
- **Primary resource:** a resource from which users regularly begin work. It
  normally needs list, detail, navigation, and change surfaces.
- **Supporting resource:** a resource used within another resource or workflow.
  Keep it contextual unless users need to work with it independently.
- **Event:** a durable record of something that happened. Events are normally
  inspected rather than edited.
- **Workflow:** a user goal expressed as a named action. It may read or change
  several resources.
- **Invariant:** a validation, authorization, ownership, state, or transaction
  rule that must remain true throughout the workflow.
- **Surface:** a coherent UI context such as a page, Grid, detail panel, form,
  dialog, drawer, or composite workspace.

Present the inferred model or model delta and consequential assumptions before
committing to an implementation shape. Reuse the application's domain language,
schema, contracts, routes, access model, and interaction conventions. Avoid
speculative abstractions.

## Define The Coherent Slice

Define one acceptance statement in actor language, including the entry context,
required information, named action or interaction, success result, expected
failures, and next useful destination.

A coherent vertical slice delivers that outcome across the boundaries it
touches:

- data and relationships;
- backend behavior and transactions;
- UI and navigation;
- authorization and row scope;
- expected failure handling; and
- focused tests or runtime evidence.

Inspect every boundary, but change only the ones required by the outcome. A
frontend-only interaction does not require a new endpoint when existing scoped
reads already provide the data. A metadata-only table change does not require a
custom React screen when generated surfaces satisfy the workflow.

For a program of work, sequence several independently acceptable slices. Do not
organize delivery as disconnected schema, backend, and frontend phases that
leave the user outcome incomplete.

## Use The Default Application Grammar

Design surfaces around workflows:

- **List:** use a Sapporta Grid for substantial tabular collections. Preserve
  filtering, search, sorting, pagination, lookup labels, URL state, record
  navigation, loading, and errors unless the requirement changes them.
- **Detail:** combine identity, state, ownership, relationships, history, and
  available actions. Constrain related-record Grids by their relationship.
- **Mutation:** expose deliberate named actions. Default to a form: a page for
  substantial work, a dialog or drawer for short contextual work, and quick-add
  only for frequent, low-risk, few-field creation. Keep browsing read-only until
  an action begins.
- **Navigation:** promote places where users begin work. Keep supporting
  resources and record-specific routes contextual.
- **Reports:** define the operational question, inclusion rule, parameters, and
  drill-down destination before choosing the result shape.

Use active-row context for master-detail browsing and independent row selection
for bulk operations. Decide the detail value and row-activation destination
separately. Row movement may update an information panel or related Grid;
activation may open a route, run a named action, or move focus. Distinguish
active-row movement from passive viewport scrolling, which does not itself
select a new record unless the product explicitly defines that behavior.

Treat Manage Data as an administrative surface for direct inspection and
editing, not as the default application workflow. Authorize it separately when
its direct access is more powerful than normal user actions.

## Design The Workflow Shell

For every new application, read [workflow-shell.md](workflow-shell.md) before
accepting the first connected page. Read it again when a later feature changes
where users start or resume routine work, what comes next, or where they open a
result, report, tool, or setting.

## Map The Slice To Sapporta

Translate the accepted model in this order:

```text
intent -> scope -> model or model delta -> workflows and invariants
       -> surfaces and navigation -> mutation UX -> access and failures
       -> Sapporta tables, operations, endpoints, reports, and views
```

Prefer built-in table APIs and generated surfaces for behavior they already
cover. Add custom contracts, endpoints, services, reports, forms, or Grid
compositions only when the accepted workflow requires them. Then read the
matching narrow references from the application-building guide.

## Accept The User Outcome

Review the completed slice through the actor's path. Verify relationships,
deliberate mutation or interaction, empty and failure states, authorization,
cache or Grid refresh effects, success navigation, and the next useful action.
Refine the model when implementation discovery changes a consequential
assumption.
