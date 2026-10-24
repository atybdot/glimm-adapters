"use client";

import { useState } from "react";
import Segmented from "./Segmented";
import CodeBlock, { type FileKind } from "./CodeBlock";
import { cue } from "../lib/sound";

export type TabItem = {
  id: string;
  label: string;
  /** Brand mark shown before the label, with a dark-ground variant. */
  logo?: { light: string; dark: string };
  /** Figcaption text, usually the file the snippet belongs in. */
  caption: string;
  code: string;
  /** Pre-highlighted markup for the same source. */
  html: string;
  file: FileKind;
};

type Props = {
  items: TabItem[];
  idPrefix: string;
  label: string;
  size?: "sm" | "md";
};

/** A segmented row over panels of code. Triggers and adapters both use it. */
export default function Tabs({ items, idPrefix, label, size = "md" }: Props) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  return (
    <div className="mt-6">
      <Segmented
        items={items.map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.logo ? (
            <>
              <img
                src={item.logo.light}
                alt=""
                width={16}
                height={16}
                className="size-4 dark:hidden"
              />
              <img
                src={item.logo.dark}
                alt=""
                width={16}
                height={16}
                className="hidden size-4 dark:block"
              />
            </>
          ) : undefined,
        }))}
        value={active}
        onChange={(id) => {
          setActive(id);
          cue("select", { emphasis: "subtle" });
        }}
        mode="tabs"
        size={size}
        controlsPrefix={idPrefix}
        label={label}
      />

      <div className="mt-3">
        {items.map((item) => (
          <div
            key={item.id}
            id={`${idPrefix}-panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`${idPrefix}-tab-${item.id}`}
            tabIndex={0}
            hidden={item.id !== active}
          >
            <CodeBlock label={item.caption} code={item.code} html={item.html} file={item.file} />
          </div>
        ))}
      </div>
    </div>
  );
}
