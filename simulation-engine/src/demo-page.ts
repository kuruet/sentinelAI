export function renderDemoPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SentinelAI Demo Checkout</title>
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
        radial-gradient(circle at top right, rgba(59,130,246,.10), transparent 35%),
        #f4f7fb;
    }

    .shell {
      width: min(1100px, calc(100% - 32px));
      margin: 0 auto;
      padding: 40px 0 56px;
    }

    header {
      margin-bottom: 28px;
    }

    .eyebrow {
      margin: 0 0 6px;
      color: #526078;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: clamp(28px, 5vw, 42px);
      letter-spacing: -.03em;
    }

    .subtitle {
      margin: 8px 0 0;
      color: #61708a;
      max-width: 700px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .card {
      background: #fff;
      border: 1px solid #dfe5ef;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 8px 30px rgba(23,32,51,.06);
    }

    .card h2 {
      margin: 0 0 6px;
      font-size: 19px;
    }

    .card p {
      margin: 0 0 18px;
      color: #66748c;
      font-size: 14px;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    button {
      border: 0;
      border-radius: 10px;
      padding: 11px 15px;
      font: inherit;
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

    .status {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      font-weight: 700;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #98a2b3;
    }

    .dot.healthy { background: #12b76a; }
    .dot.unhealthy { background: #f04438; }

    .output {
      grid-column: 1 / -1;
    }

    pre {
      margin: 0;
      min-height: 170px;
      max-height: 360px;
      overflow: auto;
      padding: 16px;
      border-radius: 12px;
      background: #101828;
      color: #d0d5dd;
      font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      white-space: pre-wrap;
      word-break: break-word;
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
      font-weight: 700;
    }

    .flow-step span {
      display: block;
      color: #7a879c;
      font-size: 11px;
      margin-bottom: 4px;
    }

    @media (max-width: 760px) {
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
      <h1>Checkout Incident Simulator</h1>
      <p class="subtitle">
        Control the demo workload, introduce a controlled failure, observe the resulting
        checkout behavior, and send the operational signal into SentinelAI.
      </p>
    </header>

    <section class="grid">
      <article class="card">
        <h2>Service status</h2>
        <p>Verify the demo application's dependency state.</p>
        <div class="status">
          <span id="health-dot" class="dot"></span>
          <span id="health-text">Unknown</span>
        </div>
        <div class="actions">
          <button class="secondary" data-action="health">Check health</button>
        </div>
      </article>

      <article class="card">
        <h2>Checkout workload</h2>
        <p>Send a real checkout request to the demo application.</p>
        <div class="actions">
          <button class="success" data-action="checkout">Make checkout request</button>
        </div>
      </article>

      <article class="card">
        <h2>Failure simulation</h2>
        <p>Controlled database failure used for the incident demonstration.</p>
        <div class="actions">
          <button class="danger" data-action="failure-on">Enable database failure</button>
          <button class="secondary" data-action="failure-off">Disable database failure</button>
        </div>
      </article>

      <article class="card">
        <h2>Deployment simulation</h2>
        <p>Record a controlled failed deployment event for the incident demonstration.</p>
        <div class="actions">
          <button class="danger" data-action="deployment-failed">Record failed deployment</button>
        </div>
      </article>

      <article class="card">
        <h2>SentinelAI integration</h2>
        <p>Send controlled telemetry into the configured SentinelAI incident.</p>
        <div class="actions">
          <button data-action="integrate">Send signal to SentinelAI</button>
          <button class="secondary" data-action="integrate-evidence">Send evidence to SentinelAI</button>
        </div>
      </article>

      <section class="flow">
        <div class="flow-step"><span>1</span>Healthy checkout</div>
        <div class="flow-step"><span>2</span>Inject failure</div>
        <div class="flow-step"><span>3</span>Failed checkout</div>
        <div class="flow-step"><span>4</span>Send signal</div>
        <div class="flow-step"><span>5</span>Investigate</div>
      </section>

      <article class="card output">
        <h2>Demo activity</h2>
        <p>Latest response from the demo service.</p>
        <pre id="output">Ready. Start with a healthy checkout request.</pre>
      </article>
    </section>
  </main>

  <script>
    const output = document.getElementById('output');
    const healthDot = document.getElementById('health-dot');
    const healthText = document.getElementById('health-text');
    const buttons = [...document.querySelectorAll('button[data-action]')];

    function show(value) {
      output.textContent = typeof value === 'string'
        ? value
        : JSON.stringify(value, null, 2);
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

    async function run(action) {
      buttons.forEach((button) => { button.disabled = true; });

      try {
        let result;

        if (action === 'health') {
          result = await request('/health');
          healthDot.className = 'dot healthy';
          healthText.textContent = 'Healthy';
        } else if (action === 'checkout') {
          result = await request('/checkout', { method: 'POST' });
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
              previousVersion: '0.1.0',
              newVersion: '0.1.1',
              status: 'FAILED'
            })
          });
        } else if (action === 'integrate') {
          result = await request('/demo/integrate', { method: 'POST' });
        } else if (action === 'integrate-evidence') {
          result = await request('/demo/integrate-evidence', { method: 'POST' });
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
      }
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => run(button.dataset.action));
    });
  </script>
</body>
</html>`;
}


