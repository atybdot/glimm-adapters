<script lang="ts">
  import { onMount } from "svelte";
  import { setupGlimm } from "glimm-adapters/svelte";
  import { demos, frameworks, frameworkHref, siteHref } from "@glimm-examples/shared/demo-data";
  import { initPicker } from "@glimm-examples/shared/picker";
  import { goto, path, toAppPath } from "./router";
  import { defaults } from "./glimm";
  import About from "./pages/About.svelte";
  import Home from "./pages/Home.svelte";

  const demo = demos.svelte;
  const base = import.meta.env.BASE_URL;

  let canvas: HTMLCanvasElement;
  onMount(() => {
    const glimm = setupGlimm({ canvas, goto, mode: "reveal", defaults });
    const stopPicker = initPicker();
    const onPop = () => path.set(toAppPath(window.location.pathname));
    window.addEventListener("popstate", onPop);

    return () => {
      glimm.destroy();
      stopPicker();
      window.removeEventListener("popstate", onPop);
    };
  });
</script>

<canvas bind:this={canvas} id="glimm" aria-hidden="true"></canvas>

<div class="page" style="--accent: {demo.accent}">
  <a class="skip" href="#main">Skip to content</a>

  <header class="bar">
    <a class="wordmark" href={siteHref(base)} data-glimm-skip>glimm-adapters</a>
    <details class="picker" data-picker>
      <summary>
        <img class="picker-mark" src="{base}{demo.logo}" alt="" width="17" height="17" />
        <span>{demo.name}</span>
        <svg
          class="picker-chevron"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m3 4.5 3 3 3-3" />
        </svg>
      </summary>
      <div class="picker-menu">
        {#each frameworks as framework}
          <a
            class="picker-item"
            href={frameworkHref(base, framework.id)}
            data-glimm-skip
            aria-current={framework.id === demo.id ? "page" : undefined}
          >
            <img src="{base}{framework.logo}" alt="" width="17" height="17" />
            {framework.name}
          </a>
        {/each}
      </div>
    </details>
  </header>

  <main class="main" id="main">
    {#if $path === "/about"}
      <About />
    {:else}
      <Home />
    {/if}
  </main>

</div>
