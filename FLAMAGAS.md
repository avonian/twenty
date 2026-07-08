# Flamagas branch — customization guide

> Onboarding doc for the `flamagas` branch: a from-source Twenty fork running a
> distributor-management POC for Flamagas (a Spanish company). Read this before
> touching the branch — several customizations live in the **database**, not in
> code, and that asymmetry is the #1 source of confusion.

Branch: `flamagas` · Upstream: `origin` = `twentyhq/twenty` · Fork: `fork` = `avonian/twenty`

---

## 0. ⚠️ The most important thing: code vs. live database

A large part of this customization was created **at runtime via the Metadata
GraphQL API** (with a workspace API key), **not** committed as code or
migrations. The code on this branch *assumes that metadata already exists in the
workspace DB.*

Created live (NOT in code / NOT in migrations):

| Thing | What | Where it lives |
|---|---|---|
| Custom objects | `Pais`, `Distribuidor`, `Performance`, `Evento` (+ their fields, sections, relation tabs) | workspace DB only |
| `note.bucket` | SELECT field on the **note** object: `NOTE` / `OBJECTIVE` (separates comments from objectives) | workspace DB only |
| `note.type` (`typeCustom`) | SELECT field on **note** ("Type" categorisation for comments) | workspace DB only |
| Evento **Objetivos** tab | a page-layout tab holding a `FIELD` widget **titled exactly `Objetivos`** (NOTES-type widgets can't be created via the API) | workspace DB only |

**Consequences**
- A fresh DB (`nx database:reset twenty-server`) will **not** have any of the
  above. The committed code references them (e.g. queries `note.bucket`, renders
  the evento Objetivos table by widget title), so on a clean DB those features
  silently no-op or error.
- **Source of truth for this metadata = the DB snapshots** in
  `../db-snapshots/` (sibling of the repo, i.e. `Flamagas/db-snapshots/`). See
  `RESTORE.md` there. Restore a snapshot to get a working environment.
- If you must rebuild the metadata from scratch, recreate it with the Metadata
  API (`/metadata` GraphQL): `createOneObject` / `createOneField` /
  `createPageLayoutTab` / `createPageLayoutWidget`. The bucket field is a SELECT
  named `bucket` with options `NOTE`,`OBJECTIVE`; the Objetivos widget is a
  `FIELD` widget with `title: "Objetivos"` (its field config is irrelevant — it's
  intercepted by title, see §4c).

Committed as code (real backend changes): the note **threading / resolve /
field-anchor** fields and the workspace setting — see §5.

---

## 1. Environment & running

- Node **24.16.0** (`nvm use`, `corepack enable`), Yarn 4, Nx.
- Shared Postgres + Redis, namespaced: DB **`twenty`** (localhost, `postgres`/`password`, pgvector docker), Redis **db1**.
- Start everything: `yarn start` (front :3001, back :3000, worker). Background server log: `/tmp/twenty-server.log`. Vite client `console.log` is NOT in that log — use `console.error/warn`.
- Workspace (this environment): schema `workspace_26u7bbo45dl6cjx83ysbzxogu`, workspaceId `24fdc2a1-854b-4cbd-bee7-f879aa5b491e`. (IDs are environment-specific; they change if the DB is rebuilt.)
- DB snapshot/restore: `Flamagas/db-snapshots/` (`pg_dump -Fc`; see `RESTORE.md`). Snapshots are **manual** by request.

Verify changes (always):
```
cd packages/twenty-front
npx oxfmt <files>
npx oxlint --type-aware -c .oxlintrc.json <files>
cd ../.. && npx nx typecheck twenty-front --skip-nx-cache
```

Lint gotchas: `twenty(max-consts-per-file)` applies only to `**/constants/*.ts`
(max 1 export). `twenty(no-hardcoded-colors)` — PDF code can't use theme CSS
vars, so `EventoBriefingDocument.tsx` disables it file-wide. `twenty(matching-state-variable)`
requires a setter/var named after the atom it derives from.

---

## 2. Feature flags (frontend, hardcoded `true`)

| Flag | File | Gates |
|---|---|---|
| `IS_FIELD_COMMENTS_ENABLED` | `modules/field-comments/constants/IsFieldCommentsEnabled.ts` | field comments (💬) |
| `IS_FIELD_OBJECTIVES_ENABLED` | `modules/field-objectives/constants/IsFieldObjectivesEnabled.ts` | field objectives (🎯) |
| `IS_LOAD_RELATED_NOTES_ENABLED` | `modules/load-related-notes/constants/IsLoadRelatedNotesEnabled.ts` | evento Notes/Objetivos tables + Objetivos-tab intercept |

Flip a flag to `false` to fully disable a feature (useful to isolate whether a
bug is ours vs stock Twenty — that's how we proved the title-blank bug was
stock, §6).

---

## 3. The data model (live metadata)

Distributor-management domain, Spanish labels. Objects + key relations:

- **Pais** (País) — demographic numbers; has many Distribuidores / Performances / Eventos.
- **Distribuidor** — belongs to a País; has many Performances / Eventos; people fields, address, credit info, files.
- **Performance** — belongs to Distribuidor + País. Split into two objects:
  **Performance Anual** (`performance`) and **Performance Regular**
  (`performanceRegular`). Both can hold notes (each has its own `noteTarget`
  target column).
- **Evento** — belongs to Distribuidor + País; `tipoEvento` SELECT (Viaje/Reunión), dates, etc. Label identifier = `name`.

Relation tabs on record pages are filtered `TABLE_WIDGET` views (FIELD widget +
viewFilter on the inverse relation, scoped to the current record).

Demo data: Italy + México, distributors, events. All in the DB snapshots.

---

## 4. Frontend features (committed code)

### a. Field comments — `modules/field-comments/` (Google-Docs-style)
Inline 💬 affordance on every record field; threaded popover (replies, Type
chips, resolve/unresolve), a record-wide **side panel** (accordion by field),
and deep-linking (`?fieldComment=<fieldMetadataId>`). Built on the standard
`note` + `noteTarget` objects: a *field comment* = a note whose noteTarget has
`targetFieldMetadataId` set; replies = notes with `parentNoteId`. The native
Notes tab excludes field-anchored notes via `useNotes` `additionalFilter`.

### b. Objectives — `modules/field-objectives/` (parallel to comments, 🎯 bullseye, red)
Same engine, separated by the **`note.bucket`** discriminator (`OBJECTIVE` vs
null/`NOTE`). The shared data layer in `field-comments` is **bucket-parametrised**
(`NoteBucket.ts`, `useNoteBucketField.ts`, `noteTargetMatchesBucket.ts`;
`useFieldCommentThreads`/`useRecordFieldCommentThreads`/`useCreateFieldComment`
take a `bucket`). Objectives reuse the generic leaves (tile/composer/replies/
resolve) and only duplicate the bucket-specific shells. Objectives hide the Type
picker. The comments and objectives **side panels are mutually exclusive** and
share **one** "open in side panel" preference (`fieldCommentDefaultTargetState`).

### c. Evento Notes & Objetivos tables — `modules/load-related-notes/`
`EventoNotesTable` (bucket-parametrised) replaces the evento's native Notes tab
and powers the Objetivos tab: load notes/objectives from the related
País/Distribuidor/Performance (shared links via `noteTarget`, deduped), prune,
and row-click → deep-link to the note's source thread (`fieldComment` for
comments, `fieldObjective` for objectives).
- **Notes tab**: `NoteWidget` renders `EventoNotesTable` for eventos.
- **Objetivos tab**: there's no native widget type, so the tab hosts a `FIELD`
  widget **titled `Objetivos`**, and `WidgetContentRenderer` intercepts that
  title (for eventos) to render `EventoNotesTable bucket=OBJECTIVE`. The widget's
  actual field config is ignored. Title marker: `EventoObjectivesWidgetTitle.ts`.
- **Load sources** (`LoadRelatedNotesButton`): País / Distribuidor / a chosen
  Performance, plus **From past event** — a submenu listing all *other* eventos
  of the same distribuidor, newest-first (`orderBy fechaInicio DescNullsLast`),
  with a **From all past events** bulk option. Reuses the same `noteTarget`-link
  pipeline (evento is already a valid note source via `targetEventoId`), so no
  backend change was needed.
- **+ Add note** (Notes tab only): a button beside "Load Notes" that opens the
  **native create-note drawer** (`useOpenCreateActivityDrawer`) linking a general
  **record-level** note to the evento — i.e. a `noteTarget` with `targetEventoId`
  set and `targetFieldMetadataId` **null** (that null is what distinguishes it
  from a field comment). Shows up in the table automatically (null bucket counts
  as a NOTE). The Objetivos tab is unchanged (the native drawer can't set
  `bucket=OBJECTIVE`).

### d. Evento PDF briefing — `modules/evento-briefing/`
Blue **"Imprimir Briefing"** button on the evento show-page header (right side).
Builds a Spanish A4 PDF (evento + distribuidor + país + performances + notes +
objectives) with `@react-pdf/renderer` and **opens it in a new tab**
(blob URL; tab opened synchronously on click to dodge popup blockers). Mirrors
Twenty's existing note-PDF-export approach.

### e. "Always open record in record page" — workspace setting
Workspace-wide toggle (Settings → General) making index clicks open the full
record page instead of the side panel. Touches `useOpenRecordFromIndexView`,
`useLoadRecordIndexStates`, a settings toggle, and backend workspace fields (§5).

### g. Section-tab FILES editing — `page-layout/widgets/field/hooks/useOpenFieldWidgetFieldInputEditMode.ts`
On a record page's **section tabs**, an empty FILES field couldn't open the OS
file picker (the widget's open-hook had branches for relations/morph/activity but
none for FILES, so a click just pushed a focus item that rendered nothing).
Added a FILES branch: an **empty** field opens the native picker directly
(`useOpenFilesFieldInput` → `openFileUpload`); a **non-empty** field falls through
to the standard edit portal (which renders `FilesFieldInput`). This makes the
image/file upload fields work from section tabs (Performance Anual Sell In/Out,
Licencias, Souvenir, Frases Locales, MP, ND Canal Organizado, etc.). One
consistent edit affordance (the top-right pen).

### f. Core title-blank fix — `RecordTitleCellTextFieldInput.tsx`
Stock Twenty bug (not ours): an untouched title cell persisted an empty draft on
click-outside, blanking a record's label identifier when you edited another
field after reload. Guard: `skipPersist` when the title draft is untouched.
**Also submitted upstream — see §7.** Story test:
`record-title-cell/components/__stories__/RecordTitleCellTextFieldInput.stories.tsx`.

---

## 5. Backend changes (committed code)

- **note** (`modules/note/standard-objects/note.workspace-entity.ts` + builder
  `compute-note-standard-flat-field-metadata.util.ts`): threading
  (`parentNote`/`replies`), `isResolved`, `resolvedAt`, `resolvedBy`.
- **noteTarget** (`note-target.workspace-entity.ts` + its builder):
  `targetFieldMetadataId` (field-anchoring).
- Registry UUIDs: `twenty-shared/src/metadata/constants/standard-object.constant.ts`.
- **Workspace upgrade command** (`database/commands/upgrade-version-command/2-14/…
  sync-note-field-comment-fields.command.ts`): idempotently adds the new note/
  noteTarget metadata to existing workspaces.
- **Note lifecycle** (`modules/note/field-comment-note-lifecycle.*`): field-comment
  notes follow their target record's delete/restore.
- **Workspace setting** for §4e: `workspace.entity.ts` + DTO + service + flat
  util + an upgrade command.
- **Derived "orange" fields** (`modules/flamagas-derived-fields/`):
  `PaisUltimoEventoListener` keeps **`pais.ultimoEvento`** in sync with the latest
  evento (`fechaFin`) of that país. Reacts via `@OnDatabaseBatchEvent('evento',
  …)` to every evento create/update/delete/restore/destroy and recomputes the
  affected país/países (an update can move an evento between países, so both old
  and new are recomputed). First step of the "fetch from other tables" system —
  add more listeners here as more orange fields get automated.
- **Note-reply email notifications** (`modules/flamagas-note-notifications/` +
  template `twenty-emails/src/emails/note-reply-notification.email.tsx`, exported
  from `twenty-emails/src/index.ts`): when a note thread gets a **new reply**,
  emails every participant (root-note owner + prior repliers) **except the
  reply's own author**. Creating a root note/comment sends nothing — replies only.
  `@OnDatabaseBatchEvent('note', CREATED)` filters to notes with `parentNoteId`,
  resolves participants from `note.createdByWorkspaceMemberId`, maps them to
  addresses via `workspaceMember.userEmail`, and links to the target record's
  Notes tab. Sends through the core global `EmailService` (BullMQ `email-queue`).
  Copy is **Spanish**. Dev uses `EMAIL_DRIVER=LOGGER` (prints, doesn't send);
  prod = the generic nodemailer **SMTP** driver (`EMAIL_SMTP_*`). Opt-out
  preferences are **deferred** (not built). Both modules are wired in
  `modules/modules.module.ts`. **Gotcha:** `createdBy` is an ACTOR *composite*
  field — via the workspace ORM it comes back **nested** (`note.createdBy.workspaceMemberId`,
  `note.createdBy.name`), NOT as flat `createdByWorkspaceMemberId` columns; reading
  the flat name silently yields `undefined` (empty participants, no email). Also,
  the note-create event payload doesn't reliably carry the self-relation
  `parentNoteId`, so the listener passes note ids and the service **re-fetches**
  them from the DB. Verified end-to-end (job reaches the `email-queue`).

> Note: the `note.bucket` and `note.type`(`typeCustom`) SELECT fields are the
> exception — they were added as **custom fields via the Metadata API**, so they
> live only in the DB (see §0), not in these builders.

---

## 6. Core (upstream) files we modified — merge-conflict watchlist

These shared Twenty files are patched in place; they're where future upstream
merges may conflict:

- `object-record/record-inline-cell/components/RecordInlineCellDisplayMode.tsx` — injects 💬 + 🎯 buttons.
- `object-record/record-title-cell/components/RecordTitleCellTextFieldInput.tsx` — title-blank fix (§4f).
- `page-layout/widgets/components/WidgetContentRenderer.tsx` — Objetivos-tab title intercept.
- `page-layout/widgets/notes/components/NoteWidget.tsx` — evento Notes table.
- `pages/object-record/RecordShowPage.tsx` — mounts comment/objective panels + deep-link effects + note jump banner.
- `pages/object-record/RecordShowPageHeader.tsx` — briefing button.
- `object-record/record-index/{components/RecordIndexContainer.tsx, hooks/useOpenRecordFromIndexView.ts, hooks/useLoadRecordIndexStates.ts}` — prefetch + §4e setting.
- `activities/notes/hooks/useNotes.ts` — excludes field-anchored notes from the native Notes tab.
- `modules/timeline/services/timeline-activity.service.ts` (server) — when a
  `noteTarget`/`taskTarget` is created, the timeline picks the first non-null
  `*Id` column as the target record. Our field-comment `targetFieldMetadataId`
  could be picked, yielding object `fieldMetadata` (which `timelineActivity` has
  no column for) → *"Field metadata for field targetFieldMetadataId is missing
  in object metadata timelineActivity"* on note creation. Fix: **skip
  `targetFieldMetadataId`** in both target-column detectors. (Note still created;
  the error was only in the async timeline job.)
- `page-layout/widgets/field/hooks/useOpenFieldWidgetFieldInputEditMode.ts` — FILES section-tab editing (§4g).
- `modules/modules.module.ts` — registers the Flamagas backend modules (`FlamagasDerivedFieldsModule`, `FlamagasNoteNotificationsModule`).
- `twenty-emails/src/index.ts` — exports the note-reply notification email template.

Get the authoritative list anytime:
```
git diff --stat origin/main...flamagas
git log --oneline origin/main..flamagas
```

---

## 7. Upstream relationship & reconciliation

- The **title-blank fix (§4f)** is the only upstream-worthy, self-contained
  change. It's open as **PR https://github.com/twentyhq/twenty/pull/22293**
  (`avonian:fix/record-title-blank-on-untouched-cell` → `twentyhq:main`),
  containing the fix + the Storybook test. The *same diffs* exist on `flamagas`
  (commits `8317d2fe` + `2aa7530c`).
- Everything else (features) is Flamagas-specific POC and **not** for upstream —
  notably because it depends on the live-DB metadata (§0), so it isn't
  standalone-functional in a clean checkout/CI.
- **When the PR merges**: update `main`, then rebase/merge `flamagas`. Because the
  fix/test diffs on `flamagas` are byte-identical to what lands upstream, git
  treats them as already-applied and they reconcile without conflict (rebase
  drops them as empty; merge no-ops). *Caveat:* if maintainers tweak the fix
  during review, update `flamagas`'s `RecordTitleCellTextFieldInput.tsx` to match
  the final merged version first.

---

## 8. Quick "get me running" checklist for a new agent

1. `nvm use 24.16.0 && corepack enable`.
2. Ensure Postgres/Redis up; **restore a DB snapshot** from `../db-snapshots/`
   (this brings in the custom objects, `note.bucket`/`type`, and the Objetivos
   tab — without it the custom features won't work; §0).
3. `yarn start` (front :3001, back :3000). Log: `/tmp/twenty-server.log`.
4. Read §0, §4, §6 before changing anything. Verify edits with the §1 commands.
5. To write/read workspace data programmatically: a workspace **API key**
   (Settings → APIs) authorizes both `/graphql` (records) and `/metadata`
   (objects/fields/layouts). The key is a dev secret, not committed.
</content>
