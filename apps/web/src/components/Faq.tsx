"use client";

import { useState } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import Glyph from "./Glyph";
import { cue } from "../lib/sound";

type Props = {
  faqs: { q: string; a: string }[];
};

/**
 * The FAQ list. Rows are separated by a hairline that is barely there, rather
 * than a gap, so the group reads as one block with quiet divisions.
 */
export default function Faq({ faqs }: Props) {
  const [open, setOpen] = useState<boolean[]>(() => faqs.map((_, index) => index === 0));

  return (
    <div className="mt-5 flex flex-col" id="app-faq">
      {faqs.map((item, index) => {
        const isOpen = open[index] ?? false;
        const toggle = () => {
          setOpen((prev) => prev.map((value, i) => (i === index ? !value : value)));
          cue(isOpen ? "close" : "open", { emphasis: "subtle" });
        };
        return (
          <div
            key={item.q}
            className={`app-acc__item group ${index > 0 ? "border-t border-line-soft/60" : ""}`}
            data-open={isOpen}
          >
            <h3 className="m-0">
              <button
                type="button"
                className="app-acc__trigger flex w-full items-center gap-3.5 py-3 text-left text-[15px] font-semibold text-ink transition-colors duration-150 ease-snap hover:text-accent"
                id={`app-faq-t-${index}`}
                aria-expanded={isOpen}
                aria-controls={`app-faq-p-${index}`}
                onClick={toggle}
              >
                <span className="flex-1">{item.q}</span>
                <span className="flex-none text-faint transition-transform duration-200 ease-snap group-data-[open=true]:rotate-180">
                  <Glyph icon={ArrowDown01Icon} size={16} />
                </span>
              </button>
            </h3>
            <div
              className="app-acc__panel"
              id={`app-faq-p-${index}`}
              role="region"
              aria-labelledby={`app-faq-t-${index}`}
              inert={!isOpen}
            >
              <div className="app-acc__inner">
                <div className="app-acc__body">
                  <p className="max-w-[62ch] pb-3.5 text-[14.5px] leading-[1.7] text-body opacity-80">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
