import { renderIcon, type HugeIcon } from "../lib/hugeicons";

type Props = {
  icon: HugeIcon;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

/**
 * A hugeicons glyph as React markup. The icon data is just arrays, so
 * `renderIcon` turns it into a string and this drops it in — one place does the
 * conversion, and no icon library ships to the client.
 */
export default function Glyph({ icon, size = 16, className, strokeWidth }: Props) {
  return (
    <span
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: renderIcon(icon, { size, class: undefined, strokeWidth }),
      }}
    />
  );
}
