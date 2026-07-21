/**
 * STRUCTURAL REFERENCE ONLY — DO NOT COPY THIS FILE AS A FEATURE SCAFFOLD.
 *
 * Imports from @sapporta packages represent public APIs available when this
 * reference was written; confirm them against the application's installed
 * version. Every APP_OWNED/*
 * module below is an intentionally unresolved placeholder. It marks code the
 * application must already own or design for its domain. This reference also
 * assumes the application has deliberately installed and mounted TanStack
 * Query; a generated Sapporta project does not include it by default.
 * packages/frontend/src/api.ts remains the generated client extension point.
 *
 * Preserve the control-flow boundaries, not the task names, fields, UI, helper
 * names, module layout, routes, cache effects, or mutation behavior.
 */

import { useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FormField,
  buildRecordFormFields,
  fieldModelForColumn,
  useSchemaStore,
} from "@sapporta/frontend";
import { useLookupStore } from "@sapporta/frontend/lookup";
import { useNavigate, useParams } from "react-router-dom";

// Application-owned types and schemas come from the real domain boundary.
import { taskFormSchema, type TaskFormValues } from "APP_OWNED/task-domain";

// These functions compose current framework query/error mechanics with the
// application's domain decisions. They are placeholders, not suggested public
// framework exports and not files supplied by this reference.
import {
  createTask,
  editTaskQuery,
  invalidateAfterTaskCreate,
  invalidateAfterTaskUpdate,
  taskFormValuesFromRecord,
  taskIdFromRoute,
  taskPath,
  updateTask,
} from "APP_OWNED/task-workflow";
import {
  LoadingForm,
  MissingTask,
  TaskRequestFailure,
  taskFieldIssue,
} from "APP_OWNED/task-presentation";

type TaskFormMode = "new" | "edit";

export function TaskForm({ mode }: { mode: TaskFormMode }) {
  // Choose the workflow before mounting mode-specific hooks. Create mode never
  // starts an edit query; an invalid edit route never mounts that query.
  return mode === "new" ? <CreateTaskForm /> : <EditTaskForm />;
}

function CreateTaskForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Reuse the application's provider.
  const metadata = useTaskFormMetadata();

  const saveTask = useMutation({
    // Application code owns this transform and mutation. For an ordinary
    // one-table create, it should use the current public parseCreateDraft and
    // generated-table create APIs rather than another HTTP client.
    mutationFn: (values: TaskFormValues) => {
      if (!metadata) throw new Error("Task form metadata is unavailable.");
      return createTask(metadata.table, values);
    },
    onSuccess: async (result) => {
      // Application code chooses the affected scopes and destination. The
      // helper must consume the application's existing query namespace.
      await invalidateAfterTaskCreate(queryClient, result);
      navigate(taskPath(result.taskId), { replace: true });
    },
  });

  if (!metadata) return <LoadingForm />;

  return (
    <TaskEditor
      key="task:create"
      fields={metadata.fields}
      initialValues={taskFormValuesFromRecord(null)}
      requestError={saveTask.error}
      clearRequestError={saveTask.reset}
      onSubmit={saveTask.mutateAsync}
    />
  );
}

function EditTaskForm() {
  // Route parsing is application behavior because identifier shape and invalid
  // route UX belong to the feature.
  const taskId = taskIdFromRoute(useParams<{ id: string }>().id);
  if (taskId === null) return <MissingTask />;

  return <EditTaskFormForId taskId={taskId} />;
}

function EditTaskFormForId({ taskId }: { taskId: number }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const metadata = useTaskFormMetadata();

  // editTaskQuery composes the installed framework's table-query surface. It
  // must not implement a second generic table client or private cache scheme.
  const taskQuery = useQuery(editTaskQuery(taskId));

  const saveTask = useMutation({
    // updateTask owns the domain request and calls the typed client extended in
    // the generated project's existing packages/frontend/src/api.ts wiring.
    mutationFn: (values: TaskFormValues) => updateTask(taskId, values),
    onSuccess: async (result) => {
      await invalidateAfterTaskUpdate(queryClient, result);
      navigate(taskPath(result.taskId), { replace: true });
    },
  });

  if (!metadata || taskQuery.isPending) return <LoadingForm />;
  if (taskQuery.isError) {
    return <TaskRequestFailure error={taskQuery.error} action="loading task" />;
  }
  if (!taskQuery.data) return <MissingTask />;

  // Do not reset a live form from background query data. Mount the editor only
  // after complete defaults exist, and key it to the record identity.
  return (
    <TaskEditor
      key={`task:${taskId}`}
      fields={metadata.fields}
      initialValues={taskFormValuesFromRecord(taskQuery.data)}
      requestError={saveTask.error}
      clearRequestError={saveTask.reset}
      onSubmit={saveTask.mutateAsync}
    />
  );
}

type TaskFields = ReturnType<typeof buildRecordFormFields>;

function TaskEditor({
  fields,
  initialValues,
  requestError,
  clearRequestError,
  onSubmit,
}: {
  fields: TaskFields;
  initialValues: TaskFormValues;
  requestError: unknown;
  clearRequestError: () => void;
  onSubmit: (values: TaskFormValues) => Promise<unknown>;
}) {
  const titleField = fieldModelForColumn(fields, "title");

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      // The application schema owns domain validation and transformation. Map
      // its issues through the current framework form-error surface.
      const parsed = taskFormSchema.safeParse(value);
      if (!parsed.success) throw parsed.error;
      await onSubmit(parsed.data);
    },
    listeners: { onChange: clearRequestError },
  });

  return (
    // The real application owns page/dialog composition, labels, help text,
    // routes, accessibility details, and visual design.
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        // Render the failure through form state, then consume the rejection.
        void form.handleSubmit().catch(() => undefined);
      }}
    >
      {requestError ? (
        <TaskRequestFailure error={requestError} action="saving task" />
      ) : null}

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting] as const}
      >
        {([canSubmit, isSubmitting]) => (
          <fieldset disabled={isSubmitting}>
            <form.Field name="title">
              {(field) => (
                <FormField
                  field={titleField}
                  value={field.state.value}
                  issue={taskFieldIssue(
                    "title",
                    field.state.meta.errors,
                    requestError,
                  )}
                  onChange={(value) => field.handleChange(String(value ?? ""))}
                />
              )}
            </form.Field>

            {/* Add only fields required by this workflow. Use metadata-derived
                FormField controls, framework lookups, or application-owned
                controls according to the interaction—not this task example. */}

            <button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </fieldset>
        )}
      </form.Subscribe>
    </form>
  );
}

function useTaskFormMetadata() {
  const table = useSchemaStore((state) =>
    state.tables.find((candidate) => candidate.name === "tasks"),
  );
  const lookups = useLookupStore();

  return useMemo(() => {
    if (!table) return null;
    return { table, fields: buildRecordFormFields({ table, lookups }) };
  }, [lookups, table]);
}
