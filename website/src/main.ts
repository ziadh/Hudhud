import "./style.css";
import demoGif from "./assets/demo.gif";
import logoImg from "./assets/logo.png";

const latestReleaseUrl = "https://github.com/ziadh/HudHud/releases/latest";
const githubUrl = "https://github.com/ziadh/HudHud";
const issuesUrl = "https://github.com/ziadh/HudHud/issues";
const licenseUrl = "https://github.com/ziadh/HudHud/blob/main/LICENSE";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div class="shell">
  <header class="topbar" aria-label="Site header">
    <a class="brand" href="#top" aria-label="Hudhud home">
      <img class="brand-logo" src="${logoImg}" alt="" width="44" height="36" />
      <span class="brand-lockup">
        <span class="brand-title">Hudhud</span>
        <span class="brand-subtitle">Desktop prayer times companion</span>
      </span>
    </a>
    <nav class="site-nav" aria-label="Primary navigation">
      <a href="#features">Features</a>
      <a href="#privacy">Privacy</a>
      <a href="${githubUrl}" target="_blank" rel="noreferrer">GitHub</a>
    </nav>
  </header>

  <main id="top">
    <section class="hero-section" aria-labelledby="hero-title">
      <div class="hero-copy">
        <span class="eyebrow">Free desktop app</span>
        <h1 id="hero-title">Prayer times, watched over by a tiny desktop companion.</h1>
        <p class="hero-text">
          Hudhud is a free desktop prayer-times app with an animated hoopoe companion that reminds you when it is time to pray.
        </p>
        <div class="hero-actions" aria-label="Download and source links">
          <a class="button primary" href="${latestReleaseUrl}" target="_blank" rel="noreferrer">Download Hudhud</a>
          <a class="button secondary" href="${githubUrl}" target="_blank" rel="noreferrer">View on GitHub</a>
        </div>
        <dl class="hero-facts" aria-label="Hudhud highlights">
          <div>
            <dt>Price</dt>
            <dd>Free</dd>
          </div>
          <div>
            <dt>License</dt>
            <dd>MIT</dd>
          </div>
         
        </dl>
      </div>

      <figure class="product-panel">
        <div class="product-panel-header">
          <div class="product-brand">
            <img src="${logoImg}" alt="" width="38" height="31" />
            <div>
              <strong>Hudhud</strong>
              <span>Prayer times tuned to your location.</span>
            </div>
          </div>
        </div>
        <img class="product-media" src="${demoGif}" alt="Hudhud desktop app showing prayer times and the animated companion." />
        <figcaption>Configure your city, preview today's prayer times, and keep the companion nearby for reminders.</figcaption>
      </figure>
    </section>

    <section id="features" class="section" aria-labelledby="features-title">
      <div class="section-heading">
        <span class="eyebrow">Features</span>
        <h2 id="features-title">Everything Hudhud needs to stay useful without getting loud.</h2>
      </div>
      <div class="feature-grid">
    
        <article class="feature-cell">
          <span class="cell-kicker">Companion</span>
          <h3>Animated desktop pet</h3>
          <p>A small hoopoe companion lives in the corner of your screen and changes state around prayer times.</p>
        </article>
        <article class="feature-cell">
          <span class="cell-kicker">Control</span>
          <h3>Configurable calculations</h3>
          <p>Choose calculation method, Asr school, high-latitude rule, Shafaq, and per-prayer minute offsets.</p>
        </article>
       
        <article class="feature-cell">
          <span class="cell-kicker">Theme</span>
          <h3>Light, dark, and system themes</h3>
          <p>Keep the interface aligned with your desktop using light, dark, or system theme preferences.</p>
        </article>
        <article class="feature-cell">
          <span class="cell-kicker">Access</span>
          <h3>No account required</h3>
          <p>Hudhud is free and open source. You don't need an account to get started, or at all. </p>
        </article>
      </div>
    </section>

    <section class="section" aria-labelledby="workflow-title">
      <div class="section-heading">
        <span class="eyebrow">How it works</span>
        <h2 id="workflow-title">Set it up once, then let the companion handle the reminders.</h2>
      </div>
      <div class="workflow-grid">
        <article class="workflow-step">
          <span>1</span>
          <h3>Set your location</h3>
          <p>Select your country, state or province when needed, and city from the app setup flow.</p>
        </article>
        <article class="workflow-step">
          <span>2</span>
          <h3>Tune your calculation settings</h3>
          <p>Adjust the prayer-time method and advanced options before saving your daily schedule.</p>
        </article>
        <article class="workflow-step">
          <span>3</span>
          <h3>Keep Hudhud on your desktop</h3>
          <p>The pet stays out of the way until a prayer approaches or it is time to pray.</p>
        </article>
        <article class="workflow-step">
          <span>4</span>
          <h3>Confirm prayers from the pet menu</h3>
          <p>Right-click the companion to confirm each prayer on time and clear the active reminder.</p>
        </article>
      </div>
    </section>

    <section id="privacy" class="privacy-band" aria-labelledby="privacy-title">
      <div>
        <span class="eyebrow">Privacy</span>
        <h2 id="privacy-title">Free forever. No account required.</h2>
        <p>
          Hudhud only contacts services needed for prayer times, location autocomplete, and optional feedback.
        </p>
      </div>
     
    </section>
  </main>

  <footer class="footer">
    <div>
      <strong>Hudhud</strong>
      <p>Free and open source under the MIT license.</p>
    </div>
    <div class="footer-actions">
      <a class="button primary compact" href="${latestReleaseUrl}" target="_blank" rel="noreferrer">Download Hudhud</a>
      <a class="text-link" href="${githubUrl}" target="_blank" rel="noreferrer">GitHub</a>
      <a class="text-link" href="${issuesUrl}" target="_blank" rel="noreferrer">Issues</a>
      <a class="text-link" href="${licenseUrl}" target="_blank" rel="noreferrer">MIT License</a>
    </div>
  </footer>
</div>
`;
