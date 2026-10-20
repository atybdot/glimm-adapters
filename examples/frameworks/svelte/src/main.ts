import "@glimm-examples/shared/demo.css";
import { mount } from "svelte";
import App from "./App.svelte";

const target = document.querySelector<HTMLDivElement>("#app");

if (!target) {
  throw new Error("The Svelte demo is missing #app");
}

const app = mount(App, { target });

export default app;
