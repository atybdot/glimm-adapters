<script lang="ts">
  import { onMount } from "svelte";
  import { setupGlimm } from "glimm-adapters/svelte";
  import { appHref, goto, path, toAppPath } from "./router";
  import About from "./pages/About.svelte";
  import Home from "./pages/Home.svelte";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const glimm = setupGlimm({ canvas, goto, mode: "reveal" });
    const onPop = () => path.set(toAppPath(window.location.pathname));
    window.addEventListener("popstate", onPop);

    return () => {
      glimm.destroy();
      window.removeEventListener("popstate", onPop);
    };
  });
</script>

<div class="backdrop" aria-hidden="true"></div>
<canvas bind:this={canvas} id="glimm" aria-hidden="true"></canvas>

<div class="page" data-page={$path === "/about" ? "about" : "home"}>
  <header class="topbar">
    <a class="brand" href={appHref("/")}>
      <span class="mark"></span> glimm <span>/ Svelte</span>
    </a>
    <nav>
      <a href={appHref("/")} aria-current={$path === "/about" ? undefined : "page"}>Home</a>
      <a href={appHref("/about")} aria-current={$path === "/about" ? "page" : undefined}>About</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      {#if $path === "/about"}
        <About />
      {:else}
        <Home />
      {/if}
    </section>
  </main>

  <footer class="footer">
    <span>glimm-adapters / svelte</span>
    <span>setupGlimm · reveal sweep</span>
  </footer>
</div>
