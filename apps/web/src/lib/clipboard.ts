/** Clipboard write with the textarea fallback older browsers still need. */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
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
