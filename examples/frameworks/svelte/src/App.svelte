<script lang="ts">
  import { onMount } from "svelte";
  import { setupGlimm } from "glimm-adapters/svelte";
  import {
    demos,
    frameworks,
    frameworkHref,
    SWEEP_MS,
  } from "@glimm-examples/shared/demo-data";
  import { appHref, goto, path, toAppPath } from "./router";
  import { defaults } from "./glimm";
  import About from "./pages/About.svelte";
  import Prompt from "./pages/Prompt.svelte";

  const demo = demos.svelte;
  const logo = appHref(`/${demo.logo}`);

  let canvas: HTMLCanvasElement;
  let sweepMs = defaults.sweepMs;

  function onDuration(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    sweepMs = Number(input.value);
    defaults.sweepMs = sweepMs;
  }

  function onFramework(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    window.location.assign(frameworkHref(import.meta.env.BASE_URL, select.value));
  }

  onMount(() => {
    const glimm = setupGlimm({ canvas, goto, mode: "reveal", defaults });
    const onPop = () => path.set(toAppPath(window.location.pathname));
    window.addEventListener("popstate", onPop);

    return () => {
      glimm.destroy();
      window.removeEventListener("popstate", onPop);
    };
  });
</script>

<canvas bind:this={canvas} id="glimm" aria-hidden="true"></canvas>

<div class="page" style="--accent: {demo.accent}">
  <a class="skip" href="#main">Skip to content</a>

  <header class="bar">
    <a class="wordmark" href={appHref("/")} aria-label="glimm-adapters home">glimm-adapters</a>
    <span class="slash" aria-hidden="true">/</span>
    <label class="picker">
      <span class="sr-only">Framework</span>
      <select name="framework" value={demo.id} onchange={onFramework}>
        {#each frameworks as framework}
          <option value={framework.id}>{framework.name}</option>
        {/each}
      </select>
      <svg
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
    </label>
  </header>

  <main class="stage" id="main">
    <div class="fw-card">
      <img src={logo} alt="" width="52" height="52" />
      <h1>{demo.name}</h1>
    </div>

    <nav class="switcher" aria-label="Demo pages">
      {#if $path === "/about"}
        <a class="switch" href={appHref("/")}>Sweep</a>
        <span class="switch" aria-current="page">Wiring</span>
        <a class="switch" href={appHref("/prompt")}>Prompt</a>
      {:else if $path === "/prompt"}
        <a class="switch" href={appHref("/")}>Sweep</a>
        <a class="switch" href={appHref("/about")}>Wiring</a>
        <span class="switch" aria-current="page">Prompt</span>
      {:else}
        <span class="switch" aria-current="page">Sweep</span>
        <a class="switch" href={appHref("/about")}>Wiring</a>
        <a class="switch" href={appHref("/prompt")}>Prompt</a>
      {/if}
    </nav>

    {#if $path === "/about"}
      <About />
    {:else if $path === "/prompt"}
      <Prompt />
    {:else}
      <p class="line">{demo.line}</p>
    {/if}
  </main>

  <footer class="foot">
    <label class="duration">
      <span>duration</span>
      <input
        type="range"
        min={SWEEP_MS.min}
        max={SWEEP_MS.max}
        step={SWEEP_MS.step}
        value={sweepMs}
        oninput={onDuration}
      />
      <output>{sweepMs} ms</output>
    </label>
  </footer>
</div>
