import assert from 'node:assert/strict';

import { AIContextBuilder } from '../src/intelligence/grounding/ai-context-builder';
import { FakeAIProvider } from '../src/intelligence/providers/fake-ai-provider';
import { EventEvidenceCorrelationService } from '../src/services/event-evidence-correlation-service';
import { DeterministicSignalAnalysisService } from '../src/services/deterministic-signal-analysis-service';
import { IntelligenceFindingsHypothesisService } from '../src/services/intelligence-findings-hypothesis-service';
import { InvestigationAssistantService } from '../src/intelligence/assistant/investigation-assistant-service';
import { IncidentSummarizationService } from '../src/intelligence/summarization/incident-summarization-service';
import { RootCauseAnalysisService } from '../src/intelligence/root-cause-analysis/root-cause-analysis-service';
import { AIRecommendationsService } from '../src/intelligence/recommendations/recommendation-service';
import type { IntelligenceContextSnapshot } from '../src/intelligence/contracts/context';

async function main(): Promise<void> {
  const incidentId = 'incident-e2e-4-17';

  const snapshot: IntelligenceContextSnapshot = {
    context: {
      incident: {
        id: incidentId,
        title: 'API latency degradation',
        description: 'API latency increased after a deployment.',
        severity: 'HIGH',
        status: 'INVESTIGATING',
        createdAt: '2026-09-04T10:00:00.000Z',
        updatedAt: '2026-09-04T10:05:00.000Z',
      },
      events: [
        {
          id: 'event-001',
          type: 'DEPLOYMENT',
          title: 'Production deployment completed',
          description: 'Version 2026.09.04.1 deployed to production.',
          occurredAt: '2026-09-04T10:01:00.000Z',
        },
        {
          id: 'event-002',
          type: 'ALERT',
          title: 'API latency alert',
          description: 'p95 latency exceeded the configured threshold.',
          occurredAt: '2026-09-04T10:02:00.000Z',
        },
        {
          id: 'event-003',
          type: 'ERROR',
          title: 'Database timeout errors',
          description: 'Requests experienced database timeout errors.',
          occurredAt: '2026-09-04T10:03:00.000Z',
        },
      ],
      evidence: [
        {
          id: 'evidence-001',
          type: 'LOG',
          title: 'Application error log',
          description: 'Database timeout errors increased immediately after deployment.',
          source: 'application',
          sourceRef: 'logs/api-20260904',
          occurredAt: '2026-09-04T10:03:00.000Z',
          collectedAt: '2026-09-04T10:04:00.000Z',
          trustLevel: 'UNTRUSTED',
          contentHash: 'hash-evidence-001',
        },
      ],
      investigation: {
        id: 'investigation-001',
        summary: 'Investigating whether the deployment caused the latency increase.',
        startedAt: '2026-09-04T10:04:00.000Z',
        updatedAt: '2026-09-04T10:05:00.000Z',
      },
    },
    metadata: {
      generatedAt: '2026-09-04T10:05:00.000Z',
      source: 'E2E_TEST',
    },
  };

  class CapturingProvider extends FakeAIProvider {
    public lastInput = '';

    override async generate(request: Parameters<FakeAIProvider['generate']>[0]) {
      this.lastInput = `${request.input}\n${request.instructions}`;
      return super.generate(request);
    }
  }

  const provider = new CapturingProvider();
  const contextBuilder = new AIContextBuilder();

  const correlationService = new EventEvidenceCorrelationService();
  const deterministicService = new DeterministicSignalAnalysisService();
  const findingsService = new IntelligenceFindingsHypothesisService();

  const correlations = correlationService.correlate(snapshot);

  assert.ok(correlations.length > 0, 'Correlation stage produced no correlations');

  const deterministic = deterministicService.analyze(snapshot, correlations);

  assert.ok(deterministic.findings.length > 0, 'Deterministic analysis produced no findings');

  const normalized = findingsService.build(deterministic.findings);

  assert.ok(normalized.findings.length > 0, 'Finding normalization produced no findings');

  assert.ok(normalized.hypotheses.length > 0, 'Hypothesis normalization produced no hypotheses');

  const groundedContext = contextBuilder.build(snapshot, normalized.findings);

  assert.ok(groundedContext.items.length > 0, 'Grounded context contains no items');

  for (const finding of normalized.findings) {
    assert.ok(
      groundedContext.items.some(
        (item) =>
          item.content.includes(finding.title) || item.content.includes(finding.description),
      ),
      `Deterministic finding ${finding.id} was not included in grounded AI context`,
    );
  }

  const contextBeforeAI = JSON.stringify(snapshot);

  const assistant = new InvestigationAssistantService(provider, contextBuilder);

  const assistantResponse = await assistant.answer(
    {
      incidentId,
      question: 'What should I investigate first?',
      intent: 'NEXT_ACTIONS',
      model: 'fake-model',
    },
    snapshot,
    normalized.findings,
  );

  assert.ok(
    assistantResponse.answer.length > 0,
    'Investigation assistant returned an empty answer',
  );

  assert.ok(
    provider.lastInput.includes('BEGIN UNTRUSTED DATA'),
    'Grounded AI boundary was not present in assistant request',
  );

  const summarizationProvider = new CapturingProvider();

  const summarizer = new IncidentSummarizationService(summarizationProvider, contextBuilder);

  const summaryResponse = await summarizer.summarize(
    {
      incidentId,
      mode: 'EXECUTIVE',
      model: 'fake-model',
    },
    snapshot,
    normalized.findings,
  );

  assert.ok(summaryResponse.summary.length > 0, 'Incident summary returned empty output');

  const rcaFindingReference = normalized.findings[0]?.references[0];

  assert.ok(
    rcaFindingReference,
    'Deterministic finding did not contain a grounded reference for RCA E2E output',
  );

  const rcaGroundedReference = groundedContext.items.find(
    (item) => item.type === rcaFindingReference.type && item.id === rcaFindingReference.id,
  )?.reference;

  assert.ok(
    rcaGroundedReference,
    'Deterministic finding reference was not represented in grounded AI context',
  );

  const rcaStructuredOutput = JSON.stringify({
    analysis:
      'The deterministic intelligence findings identify a plausible relationship between the observed deployment and subsequent API degradation. Causation remains advisory and requires operator validation.',
    hypotheses: [
      {
        title: 'Deployment-related degradation is a plausible root-cause hypothesis',
        description:
          'The deterministic findings and grounded incident context provide evidence that the production deployment may have contributed to the observed API latency degradation.',
        confidence: {
          level: 'MEDIUM',
          score: 0.7,
          rationale:
            'The available evidence supports a plausible relationship, but does not establish causation conclusively.',
        },
        supportingReferences: [
          {
            type: rcaGroundedReference.type,
            id: rcaGroundedReference.id,
            reason:
              'Reference originated from deterministic intelligence and was preserved in grounded AI context.',
          },
        ],
        contradictingReferences: [],
      },
    ],
  });

  const rcaProvider = new CapturingProvider(rcaStructuredOutput);

  const rca = new RootCauseAnalysisService(rcaProvider, contextBuilder);

  const rcaResponse = await rca.analyze(
    {
      incidentId,
      mode: 'PRIMARY',
      model: 'fake-model',
    },
    snapshot,
    normalized.findings,
  );

  assert.ok(rcaResponse.hypotheses.length > 0, 'RCA returned no hypotheses');

  assert.ok(
    rcaResponse.hypotheses[0]?.supportingReferences.some(
      (reference) =>
        reference.type === rcaGroundedReference.type && reference.id === rcaGroundedReference.id,
    ),
    'RCA did not preserve the valid grounded reference',
  );

  const recommendationReference = groundedContext.references.find(
    (reference) =>
      reference.type === 'EVENT' || reference.type === 'EVIDENCE' || reference.type === 'FINDING',
  );

  assert.ok(
    recommendationReference,
    'No valid grounded context reference was available for recommendation E2E output',
  );

  const recommendationProviderOutput = JSON.stringify({
    recommendations: [
      {
        title: 'Inspect the strongest deterministic signal',
        action:
          'Review the referenced incident evidence and validate the observed signal before taking remediation action.',
        priority: 'HIGH',
        confidence: {
          level: 'MEDIUM',
          score: 0.78,
          rationale:
            'The recommendation is grounded in deterministic intelligence context, but human validation is still required.',
        },
        references: [
          {
            type: recommendationReference.type,
            id: recommendationReference.id,
            reason: 'Reference was supplied directly by the bounded grounded intelligence context.',
          },
        ],
      },
    ],
  });

  const recommendationsProvider = new CapturingProvider(recommendationProviderOutput);

  const recommendations = new AIRecommendationsService(recommendationsProvider, contextBuilder);

  const recommendationsResponse = await recommendations.analyze(
    {
      snapshot,
      findings: normalized.findings,
      hypotheses: normalized.hypotheses,
    },
    {
      incidentId,
      model: 'fake-model',
    },
  );

  assert.ok(
    recommendationsResponse.recommendations.length > 0,
    'Recommendations returned no recommendations',
  );

  assert.equal(
    JSON.stringify(snapshot),
    contextBeforeAI,
    'AI pipeline mutated the source intelligence snapshot',
  );

  console.log('');
  console.log('========================================================');
  console.log('       STEP 4.17 END-TO-END INTEGRATION TEST');
  console.log('========================================================');
  console.log('');
  console.log('PASS  Correlation stage');
  console.log('PASS  Deterministic signal analysis');
  console.log('PASS  Finding normalization');
  console.log('PASS  Hypothesis normalization');
  console.log('PASS  Deterministic findings grounded into AI context');
  console.log('PASS  Grounding security boundary');
  console.log('PASS  Investigation assistant');
  console.log('PASS  Incident summarization');
  console.log('PASS  Root cause analysis');
  console.log('PASS  AI recommendations');
  console.log('PASS  Source intelligence immutability');
  console.log('');
  console.log('STEP 4.17 E2E INTEGRATION: PASS');
  console.log('No commit. No push.');
  console.log('PowerShell session preserved.');
}

main().catch((error: unknown) => {
  console.error('');
  console.error('STEP 4.17 E2E INTEGRATION: FAILED');
  console.error(error);
  console.error('');
  console.error('No commit. No push.');
  console.error('PowerShell session preserved.');
  process.exitCode = 1;
});
