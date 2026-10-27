<script setup lang="ts">
import { ref } from "vue";
import { demos } from "@glimm-examples/shared/demo-data";
import { flashCopy } from "@glimm-examples/shared/copy";

const demo = demos.vue;
const button = ref<HTMLButtonElement | null>(null);

function onCopy() {
  if (button.value) void flashCopy(button.value, demo.code);
}
</script>

<template>
  <figure class="code">
    <figcaption class="code-head">
      <span>{{ demo.file }}</span>
      <button ref="button" type="button" class="copy" aria-label="Copy the snippet" @click="onCopy">
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
    </figcaption>
    <pre><code>{{ demo.code }}</code></pre>
  </figure>
</template>
