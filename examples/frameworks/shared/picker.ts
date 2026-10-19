/**
 * Small behaviour the framework picker needs from the document, since the menu
 * itself is a native `<details>` disclosure in every shell.
 *
 * Clicking outside or pressing Escape closes it. Clicking the summary is left to
 * the browser, so opening and closing stay native and keyboard-friendly.
 */
export function initPicker(): () => void {
  const close = (event: Event, restoreFocus: boolean) => {
    for (const picker of document.querySelectorAll<HTMLDetailsElement>(
      "details[data-picker][open]",
    )) {
      if (event instanceof MouseEvent && picker.contains(event.target as Node)) continue;
      picker.open = false;
      if (restoreFocus) picker.querySelector<HTMLElement>("summary")?.focus();
    }
  };

  const onPointerDown = (event: MouseEvent) => close(event, false);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") close(event, true);
  };

  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);

  return () => {
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("keydown", onKeyDown);
  };
}
