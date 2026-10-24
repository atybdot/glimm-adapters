/**
 * The two demos on the live stage, and the moment each one marks.
 *
 * Shared by `StageDemo` and the markdown mirror so the menu and `/index.md`
 * never disagree about what a demo shows.
 */

export type DemoId = "publish" | "autopilot";

export const demos: { id: DemoId; label: string }[] = [
  { id: "publish", label: "Publishing" },
  { id: "autopilot", label: "Autopilot" },
];
