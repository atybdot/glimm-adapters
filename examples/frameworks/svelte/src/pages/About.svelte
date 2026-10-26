<script lang="ts">
  import { appHref } from "../router";
</script>

<section class="second">
  <h1>Second page.</h1>
  <p>Same canvas, same listener. The band covered once and left.</p>
  <a class="next" href={appHref("/")}>
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M9 1.5 3.5 6 9 10.5" />
    </svg>
    <span>Back to the demo</span>
  </a>
</section>
