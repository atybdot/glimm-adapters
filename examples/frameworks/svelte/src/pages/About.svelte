<script lang="ts">
  import { appHref } from "../router";
</script>

<p class="eyebrow">Second page · Svelte</p>
<h1>
  New page.<br />
  <em>Same canvas.</em>
</h1>
<p class="lede">
  This is page B. The sweep committed the route at its midpoint. The canvas survived the swap, so
  a second navigation starts from a clean state.
</p>
<div class="actions">
  <a class="button" href={appHref("/")}>Back to the Home page <span aria-hidden="true">→</span></a>
</div>
<div class="card">
  <div>
    <p class="eyebrow">Current page</p>
    <p class="card-title">Page B · About</p>
    <p class="card-note">Navigate back and forth; the transition should feel identical.</p>
  </div>
  <div class="big">B</div>
</div>
