<script lang="ts">
  import { appHref } from "../router";
</script>

<p class="eyebrow">Framework demo · Svelte</p>
<h1>
  Sweep in.<br />
  <em>Land on the next view.</em>
</h1>
<p class="lede">
  This is page A. Click the link and watch the band cross while the router swaps the view. The
  canvas stays put; only the page changes.
</p>
<div class="actions">
  <a class="button" href={appHref("/about")}>Open the About page <span aria-hidden="true">→</span></a>
</div>
<div class="card">
  <div>
    <p class="eyebrow">Current page</p>
    <p class="card-title">Page A · Home</p>
    <p class="card-note">A tiny history router supplies the commit; glimm owns the curtain.</p>
  </div>
  <div class="big">A</div>
</div>
