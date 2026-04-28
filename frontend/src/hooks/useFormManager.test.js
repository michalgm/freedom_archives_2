import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  services: {
    records: {
      get: vi.fn(),
      patch: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    },
  },
}));

vi.mock("./validators", () => ({
  default: {
    recordsValidator: vi.fn(async (data) => ({ values: data, errors: {} })),
  },
}));

vi.mock("src/components/form/schemaUtils", () => ({
  getDefaultValuesFromSchema: vi.fn((_service, data) => data ?? {}),
}));

const mockAddNotification = vi.fn();
const mockDisplayError = vi.fn();
const mockConfirm = vi.fn();

vi.mock("src/stores", () => ({
  useAddNotification: () => mockAddNotification,
  useDisplayError: () => mockDisplayError,
}));

vi.mock("material-ui-confirm", () => ({
  useConfirm: () => mockConfirm,
}));

import { services } from "../api";

import { useFormManager } from "./useFormManager";

const mockEntity = { id: 1, name: "Test Entity", date_updated: "2024-01-01T00:00:00Z" };

function makeHook(overrides = {}) {
  return renderHook(() => useFormManager({ service: "records", namePath: "name", ...overrides }));
}

async function waitForInit(result) {
  await waitFor(() => expect(result.current.loading.init).toBe(false));
}

beforeEach(() => {
  vi.clearAllMocks();
  services.records.get.mockResolvedValue(mockEntity);
  services.records.patch.mockResolvedValue({ ...mockEntity, name: "Updated Entity" });
  services.records.create.mockResolvedValue({ ...mockEntity, id: 2 });
  services.records.remove.mockResolvedValue({});
  mockConfirm.mockResolvedValue({ confirmed: true });
});

describe("initialization", () => {
  it("does not fetch when id is null", async () => {
    const { result } = makeHook();
    await waitForInit(result);
    expect(services.records.get).not.toHaveBeenCalled();
  });

  it("fetches entity when id is provided", async () => {
    const { result } = makeHook({ id: 1 });
    await waitForInit(result);
    expect(services.records.get).toHaveBeenCalledWith(1, {});
  });

  it("is loading during initialization", () => {
    const { result } = makeHook({ id: 1 });
    expect(result.current.isLoading).toBe(true);
  });

  it("exposes fetched data in formData", async () => {
    const { result } = makeHook({ id: 1 });
    await waitForInit(result);
    expect(result.current.formData).toMatchObject({ id: 1, name: "Test Entity" });
  });
});

describe("submitForm — update (id provided)", () => {
  it("shows error when form has no dirty fields", async () => {
    const { result } = makeHook({ id: 1, skipUpdatedCheck: true });
    await waitForInit(result);
    await act(async () => {
      await result.current.submitForm();
    });
    expect(mockDisplayError).toHaveBeenCalledWith("No changes to save");
    expect(services.records.patch).not.toHaveBeenCalled();
  });

  it("calls patch with only the changed fields", async () => {
    const { result } = makeHook({ id: 1, skipUpdatedCheck: true });
    await waitForInit(result);
    act(() => {
      result.current.formContext.setValue("name", "Updated Name", { shouldDirty: true });
    });
    // Don't await submitForm — resetForm's isDirty promise requires React to re-render,
    // which can't happen while we're blocking inside act. Use waitFor to poll instead.
    result.current.submitForm();
    await waitFor(() =>
      expect(services.records.patch).toHaveBeenCalledWith(1, { name: "Updated Name" }, { noDispatchError: true }),
    );
  });

  it("shows conflict error when entity was updated after retrieval", async () => {
    const { result } = makeHook({ id: 1 });
    await waitForInit(result);
    services.records.get.mockResolvedValue({ date_modified: "2024-12-31T00:00:00Z" });
    act(() => {
      result.current.formContext.setValue("name", "Updated Name", { shouldDirty: true });
    });
    await act(async () => {
      await result.current.submitForm();
    });
    expect(mockDisplayError).toHaveBeenCalled();
    expect(services.records.patch).not.toHaveBeenCalled();
  });

  it("fires onUpdate callback after successful patch", async () => {
    const onUpdate = vi.fn();
    const { result } = makeHook({ id: 1, skipUpdatedCheck: true, onUpdate });
    await waitForInit(result);
    act(() => {
      result.current.formContext.setValue("name", "Updated Name", { shouldDirty: true });
    });
    result.current.submitForm();
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
  });
});

describe("submitForm — create (id is null)", () => {
  it("shows error when there are no dirty fields", async () => {
    const { result } = makeHook({ defaultValues: { name: "" } });
    await waitForInit(result);
    await act(async () => {
      await result.current.submitForm();
    });
    expect(mockDisplayError).toHaveBeenCalledWith("No changes to save");
    expect(services.records.create).not.toHaveBeenCalled();
  });

  it("calls create with the full form input", async () => {
    const { result } = makeHook({ defaultValues: { name: "" } });
    await waitForInit(result);
    act(() => {
      result.current.formContext.setValue("name", "New Entity", { shouldDirty: true });
    });
    result.current.submitForm();
    await waitFor(() =>
      expect(services.records.create).toHaveBeenCalledWith(expect.objectContaining({ name: "New Entity" }), {
        noDispatchError: true,
      }),
    );
  });

  it("fires onCreate callback after successful create", async () => {
    const onCreate = vi.fn();
    const { result } = makeHook({ defaultValues: { name: "" }, onCreate });
    await waitForInit(result);
    act(() => {
      result.current.formContext.setValue("name", "New Entity", { shouldDirty: true });
    });
    result.current.submitForm();
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
  });
});

describe("confirmDelete", () => {
  it("calls remove when the user confirms", async () => {
    const { result } = makeHook({ id: 1 });
    await waitForInit(result);
    result.current.confirmDelete();
    await waitFor(() => expect(services.records.remove).toHaveBeenCalledWith(1, { noDispatchError: true }));
  });

  it("does not call remove when the user cancels", async () => {
    mockConfirm.mockResolvedValue({ confirmed: false });
    const { result } = makeHook({ id: 1 });
    await waitForInit(result);
    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(services.records.remove).not.toHaveBeenCalled();
  });

  it("fires onDelete callback after successful deletion", async () => {
    const onDelete = vi.fn();
    const { result } = makeHook({ id: 1, onDelete });
    await waitForInit(result);
    result.current.confirmDelete();
    await waitFor(() => expect(onDelete).toHaveBeenCalled());
  });
});

describe("shouldBlockNavigation", () => {
  it("is false when the form is clean", async () => {
    const { result } = makeHook({ id: 1 });
    await waitForInit(result);
    expect(result.current.shouldBlockNavigation).toBe(false);
  });

  it("is true after a field is dirtied", async () => {
    const { result } = makeHook({ id: 1 });
    await waitForInit(result);
    act(() => {
      result.current.formContext.setValue("name", "Changed", { shouldDirty: true });
    });
    expect(result.current.shouldBlockNavigation).toBe(true);
  });

  it("is false when skipDirtyCheck is set", async () => {
    const { result } = makeHook({ id: 1, skipDirtyCheck: true });
    await waitForInit(result);
    act(() => {
      result.current.formContext.setValue("name", "Changed", { shouldDirty: true });
    });
    expect(result.current.shouldBlockNavigation).toBe(false);
  });
});
