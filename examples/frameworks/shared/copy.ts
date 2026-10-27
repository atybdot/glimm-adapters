/**
 * Copy the setup snippet and flash the button into its "copied" state.
 *
 * Shared by all six demos so the icon swap and the screen-reader announcement
 * behave the same everywhere. The "copied" state lives on `data-copied` so CSS
 * owns the icon swap and each framework only needs one click handler.
 */

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older Safari and any non-secure context still need the textarea path.
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    let copied = false;
    try {
      area.select();
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    } finally {
      area.remove();
    }
    return copied;
  }
}

/** Prevent a second click from restarting the timer while the tick is up. */
const timers = new WeakMap<HTMLElement, number>();

export async function flashCopy(button: HTMLButtonElement, text: string): Promise<void> {
  if (timers.has(button)) return;

  const ok = await writeClipboard(text);
  if (!ok) return;

  const label = button.getAttribute("aria-label") ?? "Copy the snippet";
  button.dataset.copied = "";
  button.setAttribute("aria-label", "Copied");

  const timer = window.setTimeout(() => {
    delete button.dataset.copied;
    button.setAttribute("aria-label", label);
    timers.delete(button);
  }, 1400);

  timers.set(button, timer);
}
