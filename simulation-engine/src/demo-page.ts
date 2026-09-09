export function renderDemoPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SentinelAI Incident Simulator</title>
  <style>
    :root {
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #172033;
      background: #f4f7fb;
      line-height: 1.5;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top right, rgba(59,130,246,.12), transparent 34%),
        radial-gradient(circle at bottom left, rgba(16,185,129,.08), transparent 30%),
        #f4f7fb;
    }

    button,
    select {
      font: inherit;
    }

    button {
      border: 0;
      border-radius: 10px;
      padding: 11px 15px;
      font-weight: 700;
      cursor: pointer;
      background: #172033;
      color: #fff;
      transition: transform .15s ease, opacity .15s ease;
    }

    button:hover { transform: translateY(-1px); }
    button:disabled { cursor: wait; opacity: .55; transform: none; }

    .secondary {
      background: #e8edf5;
      color: #172033;
    }

    .danger {
      background: #b42318;
    }

    .success {
      background: #18794e;
    }

    .shell {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 36px 0 60px;
    }

    header {
      margin-bottom: 22px;
    }

    .eyebrow {
      margin: 0 0 6px;
      color: #526078;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .1em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: clamp(30px, 5vw, 46px);
      letter-spacing: -.04em;
      line-height: 1.05;
    }

    .subtitle {
      margin: 10px 0 0;
      color: #61708a;
      max-width: 760px;
    }

    .hero {
      margin-bottom: 18px;
      padding: 22px;
      border: 1px solid #dfe5ef;
      border-radius: 18px;
      background: rgba(255,255,255,.9);
      box-shadow: 0 12px 36px rgba(23,32,51,.07);
    }

    .scenario-row {
      display: grid;
      grid-template-columns: minmax(220px, 280px) 1fr;
      gap: 18px;
      align-items: end;
    }

    .field-label {
      display: block;
      margin-bottom: 7px;
      color: #526078;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .04em;
      text-transform: uppercase;
    }

    select {
      width: 100%;
      border: 1px solid #cfd7e5;
      border-radius: 10px;
      padding: 11px 12px;
      color: #172033;
      background: #fff;
      font-weight: 700;
      outline: none;
    }

    select:focus {
      border-color: #6b8afd;
      box-shadow: 0 0 0 3px rgba(107,138,253,.12);
    }

    .scenario-summary h2 {
      margin: 0 0 4px;
      font-size: 22px;
    }

    .scenario-summary p {
      margin: 0;
      color: #66748c;
      font-size: 14px;
    }

    .scenario-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      padding: 5px 9px;
      border-radius: 999px;
      background: #eef2f7;
      color: #526078;
      font-size: 11px;
      font-weight: 800;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .card {
      background: rgba(255,255,255,.96);
      border: 1px solid #dfe5ef;
      border-radius: 16px;
      padding: 21px;
      box-shadow: 0 8px 30px rgba(23,32,51,.05);
    }

    .card h2 {
      margin: 0 0 6px;
      font-size: 18px;
    }

    .card p {
      margin: 0 0 17px;
      color: #66748c;
      font-size: 14px;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      font-weight: 800;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #98a2b3;
      box-shadow: 0 0 0 4px rgba(152,162,179,.12);
    }

    .dot.healthy {
      background: #12b76a;
      box-shadow: 0 0 0 4px rgba(18,183,106,.12);
    }

    .dot.unhealthy {
      background: #f04438;
      box-shadow: 0 0 0 4px rgba(240,68,56,.12);
    }

    .reset-card {
      border-color: #f0d5d2;
      background: #fffafa;
    }

    .reset-card p {
      max-width: 620px;
    }

    .flow {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }

    .flow-step {
      padding: 14px;
      border: 1px solid #dfe5ef;
      border-radius: 12px;
      background: #fff;
      text-align: center;
      font-size: 13px;
      font-weight: 800;
    }

    .flow-step span {
      display: block;
      color: #7a879c;
      font-size: 11px;
      margin-bottom: 4px;
    }

    .output {
      grid-column: 1 / -1;
    }

    pre {
      margin: 0;
      min-height: 190px;
      max-height: 400px;
      overflow: auto;
      padding: 16px;
      border-radius: 12px;
      background: #101828;
      color: #d0d5dd;
      font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }

    @media (max-width: 760px) {
      .scenario-row,
      .grid,
      .flow {
        grid-template-columns: 1fr;
      }

      .output {
        grid-column: auto;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <p class="eyebrow">SentinelAI demonstration</p>
      <h1>Incident Simulator</h1>
      <p class="subtitle">
        Select a controlled failure scenario, generate realistic operational telemetry,
        send the signal and evidence into SentinelAI, and investigate the resulting incident.
      </p>
    </header>

    <section class="hero">
      <div class="scenario-row">
        <div>
          <label class="field-label" for="scenario-select">Active scenario</label>
          <select id="scenario-select">
            <option value="checkout">Checkout</option>
            <option value="payment">Payment</option>
            <option value="inventory">Inventory</option>
          </select>
        </div>

        <div class="scenario-summary">
          <h2 id="scenario-title">Checkout API Elevated Error Rate</h2>
          <p id="scenario-description">
            Checkout requests are failing because the PostgreSQL dependency is unavailable.
          </p>
          <div class="scenario-meta">
            <span id="scenario-service" class="pill">sentinelai-demo-checkout</span>
            <span id="scenario-incident" class="pill">Incident ...0001</span>
            <span id="scenario-failure" class="pill">database-unavailable</span>
          </div>
        </div>
      </div>
    </section>

    <section class="grid">
      <article class="card">
        <h2>Service status</h2>
        <p>Verify the currently selected demo service and its dependency state.</p>
        <div class="status">
          <span id="health-dot" class="dot"></span>
          <span id="health-text">Unknown</span>
        </div>
        <div class="actions">
          <button class="secondary" data-action="health">Check health</button>
        </div>
      </article>

      <article class="card">
        <h2 id="workload-title">Checkout workload</h2>
        <p id="workload-description">Run the currently selected demo workload.</p>
        <div class="actions">
          <button class="success" data-action="workload">Run workload</button>
        </div>
      </article>

      <article class="card">
        <h2>Failure simulation</h2>
        <p id="failure-description">
          Inject the controlled failure for the active scenario.
        </p>
        <div class="actions">
          <button class="danger" data-action="failure-on">Enable failure</button>
          <button class="secondary" data-action="failure-off">Disable failure</button>
        </div>
      </article>

      <article class="card">
        <h2>Deployment simulation</h2>
        <p>Record a controlled failed deployment against the active service.</p>
        <div class="actions">
          <button class="danger" data-action="deployment-failed">Record failed deployment</button>
        </div>
      </article>

      <article class="card">
        <h2>SentinelAI integration</h2>
        <p>Send scenario-specific operational telemetry and evidence to SentinelAI.</p>
        <div class="actions">
          <button data-action="integrate">Send signal</button>
          <button class="secondary" data-action="integrate-evidence">Send evidence</button>
        </div>
      </article>

      <article class="card reset-card">
        <h2>Demo data reset</h2>
        <p>
          Remove accumulated SentinelAI demo records and recreate the three deterministic
          baseline incidents. This does not affect non-demo incidents.
        </p>
        <div class="actions">
          <button class="danger" data-action="reset">Reset SentinelAI demo data</button>
        </div>
      </article>

      <section class="flow">
        <div class="flow-step"><span>1</span>Select scenario</div>
        <div class="flow-step"><span>2</span>Inject failure</div>
        <div class="flow-step"><span>3</span>Run workload</div>
        <div class="flow-step"><span>4</span>Send signal</div>
        <div class="flow-step"><span>5</span>Investigate</div>
      </section>

      <article class="card output">
        <h2>Demo activity</h2>
        <p>Latest response from the demo service.</p>
        <pre id="output">Loading demo scenarios...</pre>
      </article>
    </section>
  </main>

  <script>
    const output = document.getElementById('output');
    const healthDot = document.getElementById('health-dot');
    const healthText = document.getElementById('health-text');
    const scenarioSelect = document.getElementById('scenario-select');
    const scenarioTitle = document.getElementById('scenario-title');
    const scenarioDescription = document.getElementById('scenario-description');
    const scenarioService = document.getElementById('scenario-service');
    const scenarioIncident = document.getElementById('scenario-incident');
    const scenarioFailure = document.getElementById('scenario-failure');
    const workloadTitle = document.getElementById('workload-title');
    const workloadDescription = document.getElementById('workload-description');
    const failureDescription = document.getElementById('failure-description');
    const buttons = [...document.querySelectorAll('button[data-action]')];

    let scenarios = [];
    let activeScenario = null;

    function show(value) {
      output.textContent = typeof value === 'string'
        ? value
        : JSON.stringify(value, null, 2);
    }

    function incidentLabel(incidentId) {
      return 'Incident ...' + incidentId.slice(-4);
    }

    function updateScenarioUI(scenario) {
      activeScenario = scenario;

      scenarioSelect.value = scenario.id;
      scenarioTitle.textContent = scenario.title;
      scenarioDescription.textContent = scenario.description;
      scenarioService.textContent = scenario.serviceName;
      scenarioIncident.textContent = incidentLabel(scenario.incidentId);
      scenarioFailure.textContent = scenario.failureMode;

      workloadTitle.textContent = scenario.workloadName + ' workload';
      workloadDescription.textContent =
        'Run ' + scenario.workloadName.toLowerCase() + ' through ' + scenario.workloadPath + '.';

      failureDescription.textContent =
        'Inject the controlled ' + scenario.failureMode + ' failure for this scenario.';
    }

    async function request(path, options = {}) {
      const response = await fetch(path, options);
      const text = await response.text();

      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      if (!response.ok) {
        const error = new Error(
          typeof body === 'object' && body?.message
            ? body.message
            : 'Request failed with HTTP ' + response.status
        );
        error.status = response.status;
        error.body = body;
        throw error;
      }

      return { status: response.status, body };
    }

    async function loadScenarios() {
      const result = await request('/demo/scenarios');

      scenarios = result.body.scenarios ?? [];

      const selected =
        scenarios.find((scenario) => scenario.id === result.body.activeScenario) ??
        scenarios[0];

      if (selected) {
        updateScenarioUI(selected);
      }

      show(result);
    }

    async function selectScenario(scenarioId) {
      const result = await request('/demo/scenario', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });

      updateScenarioUI(result.body.scenario);
      show(result);
    }

    async function run(action) {
      buttons.forEach((button) => { button.disabled = true; });
      scenarioSelect.disabled = true;

      try {
        let result;

        if (action === 'health') {
          try {
            result = await request('/health');
            healthDot.className = 'dot healthy';
            healthText.textContent = 'Healthy';
          } catch (error) {
            healthDot.className = 'dot unhealthy';
            healthText.textContent = 'Unhealthy';
            throw error;
          }
        } else if (action === 'workload') {
          result = await request(activeScenario.workloadPath, { method: 'POST' });
        } else if (action === 'failure-on') {
          result = await request('/demo/failure', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ enabled: true })
          });
        } else if (action === 'failure-off') {
          result = await request('/demo/failure', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ enabled: false })
          });
        } else if (action === 'deployment-failed') {
          result = await request('/demo/deployment', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              environment: 'demo',
              previousVersion: activeScenario.serviceVersion,
              newVersion: '0.1.1',
              status: 'FAILED'
            })
          });
        } else if (action === 'integrate') {
          result = await request('/demo/integrate', { method: 'POST' });
        } else if (action === 'integrate-evidence') {
          result = await request('/demo/integrate-evidence', { method: 'POST' });
        } else if (action === 'reset') {
          const confirmed = window.confirm(
            'Reset SentinelAI demo data?\\n\\n' +
            'This removes accumulated demo-owned records and recreates the three baseline incidents.'
          );

          if (!confirmed) {
            show('Reset cancelled.');
            return;
          }

          result = await request('/demo/reset', { method: 'POST' });

          await loadScenarios();
          healthDot.className = 'dot';
          healthText.textContent = 'Unknown';
          return;
        }

        show(result);
      } catch (error) {
        show({
          error: error.message,
          status: error.status ?? null,
          response: error.body ?? null
        });
      } finally {
        buttons.forEach((button) => { button.disabled = false; });
        scenarioSelect.disabled = false;
      }
    }

    scenarioSelect.addEventListener('change', async () => {
      buttons.forEach((button) => { button.disabled = true; });
      scenarioSelect.disabled = true;

      try {
        await selectScenario(scenarioSelect.value);
      } catch (error) {
        show({
          error: error.message,
          status: error.status ?? null,
          response: error.body ?? null
        });
      } finally {
        buttons.forEach((button) => { button.disabled = false; });
        scenarioSelect.disabled = false;
      }
    });

    buttons.forEach((button) => {
      button.addEventListener('click', () => run(button.dataset.action));
    });

    loadScenarios().catch((error) => {
      show({
        error: error.message,
        status: error.status ?? null,
        response: error.body ?? null
      });
    });
  </script>
</body>
</html>`;
}
