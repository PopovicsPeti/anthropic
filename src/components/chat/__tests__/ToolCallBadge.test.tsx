import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
import { ToolCallBadge } from "../ToolCallBadge";

test("str_replace_editor + create shows 'Creating'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/components/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("str_replace_editor + str_replace shows 'Editing'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/src/App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("str_replace_editor + insert shows 'Editing'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "/src/App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("str_replace_editor + view shows 'Reading'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "/src/index.ts" }}
      state="call"
    />
  );
  expect(screen.getByText("Reading index.ts")).toBeDefined();
});

test("str_replace_editor + undo_edit shows 'Undoing edit in'", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "/src/App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Undoing edit in App.tsx")).toBeDefined();
});

test("file_manager + rename shows 'Renaming'", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/src/Old.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming Old.tsx")).toBeDefined();
});

test("file_manager + delete shows 'Deleting'", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/src/Old.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting Old.tsx")).toBeDefined();
});

test("shows filename from args.path", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/deep/nested/MyComponent.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating MyComponent.tsx")).toBeDefined();
});

test("unknown tool shows 'Working on files'", () => {
  render(
    <ToolCallBadge
      toolName="unknown_tool"
      args={{}}
      state="call"
    />
  );
  expect(screen.getByText("Working on files")).toBeDefined();
});

test("shows spinner when state is 'call'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/Button.tsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is 'partial-call'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/Button.tsx" }}
      state="partial-call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("shows green dot when state is 'result' with a result", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/Button.tsx" }}
      state="result"
      result="Success"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is 'result' but result is absent", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/Button.tsx" }}
      state="result"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});
