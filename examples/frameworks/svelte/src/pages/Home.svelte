<script lang="ts">
  import { agentPrompt, demos } from "@glimm-examples/shared/demo-data";
  import { flashCopy } from "@glimm-examples/shared/copy";
  import { highlight } from "@glimm-examples/shared/highlight";
  import { appHref } from "../router";

  const demo = demos.svelte;
  const base = import.meta.env.BASE_URL;
  const prompt = agentPrompt(demo);
  const wiring = highlight(demo.code, demo.lang);
  const promptHtml = highlight(prompt, "text");

  let tab: "wiring" | "prompt" = "wiring";
  let button: HTMLButtonElement;

  $: prose = tab === "prompt";
  $: text = prose ? prompt : demo.code;
</script>

<div class="home">
  <section class="intro">
    <img class="mark" src="{base}{demo.logo}" alt="" width="38" height="38" />
    <h1>{demo.name}</h1>
    <p class="line">{demo.line}</p>
    <a class="next" href={appHref("/about")}>
      <span>Second page</span>
      <svg
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 1.5 4.5 4.5L6 10.5M1.5 6h9" />
      </svg>
    </a>
  </section>

  <section class="panel" aria-label="Setup">
    <div class="panel-head">
      <div class="tabs" role="group" aria-label="Setup">
        <button
          type="button"
          class="tab"
          data-tab="wiring"
          aria-pressed={tab === "wiring"}
          onclick={() => (tab = "wiring")}
        >
          Wiring
        </button>
        <button
          type="button"
          class="tab"
          data-tab="prompt"
          aria-pressed={prose}
          onclick={() => (tab = "prompt")}
        >
          Agent prompt
        </button>
      </div>
      <button
        bind:this={button}
        type="button"
        class="copy"
        aria-label="Copy"
        onclick={() => void flashCopy(button, text)}
      >
        <svg
          class="copy__copy"
          viewBox="0 0 16 16"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="6" y="6" width="8" height="8" rx="1.5" />
          <path d="M10 6V3.5A1.5 1.5 0 0 0 8.5 2h-5A1.5 1.5 0 0 0 2 3.5v5A1.5 1.5 0 0 0 3.5 10H6" />
        </svg>
        <svg
          class="copy__check"
          viewBox="0 0 16 16"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m3 8.5 3.2 3L13 4.5" />
        </svg>
      </button>
    </div>

    <div
      class="sheet"
      class:sheet--prose={prose}
    >
      <p class="sheet-file">{prose ? "agent prompt" : demo.file}</p>
      <pre><code>{@html (prose ? promptHtml : wiring)}</code></pre>
    </div>
  </section>
</div>
