const shell = (page: "home" | "about", body: string) => {
  const isAbout = page === "about";
  return `
    <div class="page" data-page="${page}">
      <header class="topbar">
        <a class="brand" href="/"><span class="mark"></span> glimm <span>/ vanilla</span></a>
        <nav>
          <a href="/" ${isAbout ? "" : 'aria-current="page"'}>Home</a>
          <a href="/about" ${isAbout ? 'aria-current="page"' : ""}>About</a>
        </nav>
      </header>
      <main>
        <section class="hero">
          ${body}
        </section>
      </main>
      <footer class="footer">
        <span>glimm-adapters / vanilla</span>
        <span>Reveal sweep · one pass</span>
      </footer>
    </div>
  `;
};

const home = `
  <p class="eyebrow">Framework demo · Vanilla JS</p>
  <h1>Sweep in.<br /><em>Land on the next view.</em></h1>
  <p class="lede">
    This is page A. Click the link and watch the band cross while the router
    swaps the view. The canvas stays put; only the page changes.
  </p>
  <div class="actions">
    <a class="button" href="/about">Open the About page <span aria-hidden="true">→</span></a>
  </div>
  <div class="card">
    <div>
      <p class="eyebrow">Current page</p>
      <p class="card-title">Page A · Home</p>
      <p class="card-note">The plain router is 30 lines. No framework, no magic.</p>
    </div>
    <div class="big">A</div>
  </div>
`;

const about = `
  <p class="eyebrow">Second page · Vanilla JS</p>
  <h1>New page.<br /><em>Same canvas.</em></h1>
  <p class="lede">
    This is page B. The sweep committed the route at its midpoint. The canvas
    survived the swap, so a second navigation starts from a clean state.
  </p>
  <div class="actions">
    <a class="button" href="/">Back to the Home page <span aria-hidden="true">→</span></a>
  </div>
  <div class="card">
    <div>
      <p class="eyebrow">Current page</p>
      <p class="card-title">Page B · About</p>
      <p class="card-note">Navigate back and forth; the transition should feel identical.</p>
    </div>
    <div class="big">B</div>
  </div>
`;

export function renderPage(pathname: string): string {
  return pathname === "/about" ? shell("about", about) : shell("home", home);
}
