/**
 * STRUCTURAL REFERENCE ONLY — DO NOT COPY THIS FILE AS A FEATURE SCAFFOLD.
 *
 * Imports from @sapporta packages represent public APIs available when this
 * reference was written; confirm them against the application's installed
 * version. Every APP/* module below is an intentionally unresolved
 * placeholder. It marks code the application must already own or design for
 * its domain. Generated projects already install TanStack Query and mount
 * their queryClient. packages/frontend/src/api.ts remains the generated
 * client extension point.
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
  reloadTGridRows,
  useSchemaStore,
} from "@sapporta/frontend";
import {
  FormSubmissionError,
  fieldIssuesForSubmissionError,
  firstFormErrorMessage,
} from "@sapporta/frontend/form";
import { useLookupStore } from "@sapporta/frontend/lookup";
import {
  tableQueryKeys,
  tableRecordQueryOptions,
} from "@sapporta/frontend/table/query";
import { ApiError } from "@sapporta/shared/client";
import {
  apiProblemFromBody,
  fieldIssuesFromZodError,
} from "@sapporta/shared/validation";
import { useNavigate, useParams } from "react-router-dom";

// Application-owned types and schemas come from the real domain boundary.
// `taskWireSchema` is the row projection — the `tasks` columns this form reads.
// It belongs in packages/shared/src/contracts/; see ../row-projections.md.
import {
  taskFormSchema,
  taskWireSchema,
  type TaskFormValues,
} from "APP/task-domain";

// These functions compose current framework query/error mechanics with the
// application's domain decisions. They are placeholders, not suggested public
// framework exports and not files supplied by this reference.
import {
  createTask,
  taskFormValuesFromRecord,
  taskIdFromRoute,
  taskPath,
  updateTask,
} from "APP/task-workflow";
import {
  LoadingForm,
  MissingTask,
  TaskRequestFailure,
} from "APP/task-presentation";

type TaskFormMode = "new" | "edit";

export function TaskForm({ mode }: { mode: TaskFormMode }) {
  // Choose the workflow before mounting mode-specific hooks. Create mode never
  // starts an edit query; an invalid edit route never mounts that query.
  return mode === "new" ? <CreateTaskForm /> : <EditTaskForm />;
}

function CreateTaskForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Reuse the generated provider.
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
      // A custom endpoint may affect more than tasks; invalidate every affected
      // table/custom-query scope before navigating.
      await queryClient.invalidateQueries({
        queryKey: tableQueryKeys.table("tasks"),
      });
      reloadTGridRows("tasks");
      navigate(taskPath(result.taskId), { replace: true });
    },
  });

  if (!metadata) return <LoadingForm />;

  return (
    <TaskEditor
      key="task:create"
      fields={metadata.fields}
      initialValues={taskFormValuesFromRecord(null)}
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

  const taskQuery = useQuery(
    tableRecordQueryOptions({
      tableName: "tasks",
      recordId: String(taskId),
      decodeRow: (row: Record<string, unknown>) => taskWireSchema.parse(row),
    }),
  );

  const saveTask = useMutation({
    // updateTask owns the domain request and calls the typed client extended in
    // the generated project's existing packages/frontend/src/api.ts wiring.
    mutationFn: (values: TaskFormValues) => updateTask(taskId, values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: tableQueryKeys.table("tasks"),
      });
      reloadTGridRows("tasks");
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
      onSubmit={saveTask.mutateAsync}
    />
  );
}

type TaskFields = ReturnType<typeof buildRecordFormFields>;
type TaskFieldModel = ReturnType<typeof fieldModelForColumn>;

// A form instance has no nameable type of its own. Name this hook's return type
// instead, and give child components that. One useForm call per form.
function useTaskDraftForm(
  initialValues: TaskFormValues,
  submitDraft: (values: TaskFormValues) => Promise<unknown>,
) {
  return useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value, formApi }) => {
      // The application schema owns domain validation and transformation. Map
      // its issues through the current framework form-error surface.
      try {
        const parsed = taskFormSchema.safeParse(value);
        if (!parsed.success) {
          throw new FormSubmissionError(fieldIssuesFromZodError(parsed.error));
        }
        await submitDraft(parsed.data);
      } catch (error) {
        formApi.setErrorMap({ onSubmit: submissionErrorMap(error) });
        throw error;
      }
    },
  });
}

type TaskDraftForm = ReturnType<typeof useTaskDraftForm>;

function TaskEditor({
  fields,
  initialValues,
  onSubmit,
}: {
  fields: TaskFields;
  initialValues: TaskFormValues;
  onSubmit: (values: TaskFormValues) => Promise<unknown>;
}) {
  const titleField = fieldModelForColumn(fields, "title");
  const form = useTaskDraftForm(initialValues, onSubmit);

  return (
    // The real application owns page/dialog composition, labels, help text,
    // routes, accessibility details, and visual design.
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.setErrorMap({ onSubmit: undefined });
        // Render the failure through form state, then consume the rejection.
        void form.handleSubmit().catch(() => undefined);
      }}
    >
      <form.Subscribe
        selector={(state) =>
          [
            state.canSubmit,
            state.isSubmitting,
            state.errorMap.onSubmit,
          ] as const
        }
      >
        {([canSubmit, isSubmitting, submitError]) => (
          <fieldset disabled={isSubmitting}>
            <TaskTitleField form={form} field={titleField} />

            {/* Add only fields required by this workflow. Use metadata-derived
                FormField controls, framework lookups, or application-owned
                controls according to the interaction—not this task example. */}

            {submissionFormMessage(submitError) ? (
              <p role="alert">{submissionFormMessage(submitError)}</p>
            ) : null}

            <button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </fieldset>
        )}
      </form.Subscribe>
    </form>
  );
}

function TaskTitleField({
  form,
  field,
}: {
  form: TaskDraftForm;
  field: TaskFieldModel;
}) {
  return (
    <form.Field name="title">
      {(titleField) => (
        <FormField
          field={field}
          value={titleField.state.value}
          issue={firstFormErrorMessage(titleField.state.meta.errors)}
          onChange={(value) => {
            form.setErrorMap({ onSubmit: undefined });
            titleField.handleChange(String(value ?? ""));
          }}
        />
      )}
    </form.Field>
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

function submissionErrorMap(error: unknown) {
  const issues = fieldIssuesForSubmissionError(error);
  const problem =
    error instanceof ApiError ? apiProblemFromBody(error.body) : undefined;
  return {
    form:
      issues.find((issue) => issue.field === "form")?.message ??
      problem?.summary ??
      (error instanceof FormSubmissionError
        ? "Review the highlighted fields."
        : "Could not save task."),
    fields: Object.fromEntries(
      issues
        .filter((issue) => issue.field !== "form")
        .map((issue) => [issue.field, issue.message]),
    ),
  };
}

function submissionFormMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("form" in error)) {
    return undefined;
  }
  return typeof error.form === "string" ? error.form : undefined;
}
