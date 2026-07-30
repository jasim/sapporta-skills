# Build The Workflow Shell

Apply this reference after the product model names the users, records, states,
and recurring work. Use the full pass for a new app. Revisit only the affected
parts when a later feature changes where routine work starts, what normally
comes next, or where users inspect the result.

## Contents

- [Map The Everyday Path](#map-the-everyday-path)
- [Build The Main Sidebar](#build-the-main-sidebar)
- [Build One Complete Advanced Or Admin Page](#build-one-complete-advanced-or-admin-page)
- [Build The Protected Home Page](#build-the-protected-home-page)
- [Place Later Features](#place-later-features)
- [Represent Deferred Actions Honestly](#represent-deferred-actions-honestly)
- [Verify The Shell](#verify-the-shell)

## Map The Everyday Path

Inspect the existing sidebar, routes, tables, reports, tools, settings, and
roles. Write the normal path with the words users use:

```text
prerequisite -> recurring action -> checkpoint or review
             -> completion -> inspect the result
```

Keep only phases that exist in this app. Do not force a generic
setup-import-review-finish sequence onto another domain.

Place a page by asking whether a regular user intentionally starts or resumes
work there. Put that page in the main sidebar. Keep a create form, edit page,
detail page, and record-specific action contextual when users reach it from a
list or parent record. Put direct table access, specialist reports and tools,
settings, and maintenance pages under Advanced/Admin.

For example, Orders may be a sidebar link while `/orders/new` and
`/orders/:id/edit` remain buttons on the Orders pages. A reconciliation report
used before every import may belong in the main sidebar; a diagnostic report
used during support belongs under Advanced.

Do not build the main sidebar by iterating over schema tables or registered
routes.

## Build The Main Sidebar

- Put the protected home page first.
- Group links around everyday work and label them with user-facing domain
  terms.
- Order groups and links by what normally follows what, but do not number
  groups, links, sections, or steps.
- Include only pages where users intentionally begin or resume routine work.
  A route's existence does not make it a sidebar item.
- Use a generated table or create route behind a friendly action label when it
  already provides the right page.
- Include a report or queue when users routinely open it to decide the next
  action. Keep specialist or diagnostic reports under Advanced.
- Put one Advanced or Admin link after the everyday groups.
- Keep the same destinations and order on desktop and mobile.

Do not ship a main sidebar that is the generated table list.

## Build One Complete Advanced Or Admin Page

Make one page reachable from the main sidebar. Include a link to every
destination exposed by Sapporta's automatic navigation or the app's previous
sidebar:

- every generated application table or Manage Data page;
- every report, including specialist and diagnostic reports;
- every app-owned importer, maintenance tool, and other specialist page;
- every settings and configuration page; and
- every other Sapporta shell destination.

Group the links by concrete nouns such as Tables, Reports, Import tools, and
Settings. Build groups from schema metadata and route or report registries when
those sources already exist, then compare the page with the current automatic
navigation so nothing disappears as the app changes.

Use **Advanced** when regular users may open the page. Use **Admin** when a role
or ability restricts it. Show only authorized links, and keep the same route and
server authorization that each destination already requires. Direct table
editing may need stronger permission than the normal workflow.

Set `showFrameworkNavigation={false}` or use the installed version's equivalent
only after this page has equivalent destination coverage and authorization. Do
not trade a cluttered sidebar for missing or overexposed functionality.

## Build The Protected Home Page

Open the protected root route on a domain home page. Help a new user answer four
questions: what is this app for, where do I begin, what happens next, and where
do I inspect the result?

Follow the same path as the sidebar. Start with one short explanation of the
app's purpose. For each part of the normal path, use:

- a domain heading;
- a short paragraph that connects this action to the previous and next work;
  and
- an obvious button labeled with a verb and object, such as **Create order**,
  **Review requests**, or **Open account history**.

State important boundaries where the user acts. For example, say that imported
rows stay in Draft entries until the user posts them, or that submitting a
request sends it to the Review queue.

Keep the page useful after onboarding. Point every button to a real work page,
and show the next incomplete action only when existing data can determine it
reliably.

Write short connected prose for a person who knows the domain but not the
schema or route layout. Use the terms shown elsewhere in the app. Remove
slogans, implementation names, generic encouragement, repeated explanations,
and copy that merely restates a button.

Make action buttons the visual center. Use one restrained type hierarchy,
spacing, and simple dividers. Do not number sections or present their count as
progress. Avoid step badges, eyebrow labels, a card around every section,
decorative shadows, competing accent colors, and ornamental icons. Keep any
secondary action quieter than the main button.

## Place Later Features

- Put a new routine starting or resuming page in the relevant sidebar group.
  Add it to the home page only when it changes the core path.
- When a new checkpoint or completion action changes what normally comes next,
  update the sidebar order, home-page explanation, buttons, and result links.
- Keep create, edit, detail, and record-specific pages contextual unless users
  routinely start there.
- Put a new specialist report, tool, direct table page, or setting under
  Advanced/Admin.
- Update the Advanced/Admin inventory and authorization whenever any shell
  destination changes.
- Leave the shell alone when a small implementation change does not alter the
  user's path.

## Represent Deferred Actions Honestly

Use an existing working route when it supports the action. Build a missing page
when it belongs to the accepted feature. If the user explicitly defers the
behavior but wants its future place shown, link to a clearly labeled placeholder
page that says the action is not available yet. Do not add a dead link or a
button that appears to perform the action.

## Verify The Shell

- As a new regular user, confirm that the home page answers the four questions,
  the sidebar follows everyday work without numbering, and each button reaches
  a working authorized route.
- As each Advanced/Admin role, compare the page with Sapporta's automatic
  navigation. Confirm access to every table, report, specialist tool, setting,
  and other shell destination without granting a new permission.
- Confirm that hidden links do not substitute for route and server
  authorization.
- Confirm that desktop and mobile expose the same destinations, order, and
  active-route behavior.
- Confirm that every deferred action is an honest placeholder rather than a
  dead or fake control.
