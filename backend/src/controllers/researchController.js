const { v4: uuidv4 } = require('uuid');
const ResearchSession = require('../models/ResearchSession');
const PromptGuardService = require('../services/agent/promptGuardService');
const QueryPlanner = require('../services/agent/queryPlanner');
const HybridRetriever = require('../services/agent/hybridRetriever');
const RerankerService = require('../services/agent/rerankerService');
const GroqLlmService = require('../services/agent/groqLlmService');
const CitationValidator = require('../services/agent/citationValidator');
const AuditService = require('../services/auditService');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

class ResearchController {
  /**
   * Complete End-to-End Legal Research Query Workflow
   */
  static async queryResearch(req, res, next) {
    const startTime = Date.now();
    try {
      const { prompt, sessionId = uuidv4(), filters = {} } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new AppError('A valid legal research inquiry prompt is required.', 400, 'INVALID_PROMPT');
      }

      logger.info(`Processing legal research query in session [${sessionId}]: "${prompt.slice(0, 80)}..."`);

      // 1. Security Screening: meta-llama/llama-prompt-guard-2-86m
      const guardrailStart = Date.now();
      const guardrailResult = await PromptGuardService.evaluate(prompt);
      const guardrailMs = Date.now() - guardrailStart;

      if (!guardrailResult.passed) {
        await AuditService.logSecurityAlert(
          {
            sessionId,
            prompt,
            riskScore: guardrailResult.riskScore,
            classification: guardrailResult.classification,
            reason: guardrailResult.reason
          },
          req
        );

        return res.status(400).json({
          success: false,
          error: {
            code: 'PROMPT_GUARD_VIOLATION',
            message: 'Your research request was blocked by the security guardrails (potential prompt injection, instruction override, or adversarial prompt pattern detected).',
            riskScore: guardrailResult.riskScore,
            classification: guardrailResult.classification
          }
        });
      }

      // 2. Query Analysis & Legal Expansion
      const plan = QueryPlanner.plan(prompt, filters);

      const isPromptLackingLegalTopic = !plan.hasLegalTopic;
      let isUnrelated = isPromptLackingLegalTopic;
      let rawCandidates = [];
      let rerankedChunks = [];
      let retrievalMs = 0;
      let rerankMs = 0;
      let synthesisResult = null;
      let synthesisMs = 0;
      let validatedCitations = [];
      let citationValidationMs = 0;

      const UNRELATED_MESSAGE = 'The documents do not contain any topic related to this.';

      if (isPromptLackingLegalTopic) {
        logger.info(`Prompt does not contain any legal topic: "${prompt.slice(0, 60)}"`);
        synthesisResult = {
          rawAnswer: UNRELATED_MESSAGE,
          structuredIrac: {
            issue: 'No legal topic identified in prompt.',
            rule: UNRELATED_MESSAGE,
            application: UNRELATED_MESSAGE,
            conclusion: UNRELATED_MESSAGE
          },
          model: 'LawIntel Legal Guard',
          isMock: true
        };
      } else {
        // 3. Dense Vector Retrieval (BGE-M3 + Qdrant)
        const retrievalStart = Date.now();
        rawCandidates = await HybridRetriever.retrieve(plan, 20);
        retrievalMs = Date.now() - retrievalStart;

        // 4. Contextual Reranking (Precedent Hierarchy + Exact Citations)
        const rerankStart = Date.now();
        rerankedChunks = RerankerService.rerank(rawCandidates, plan, 7);
        rerankMs = Date.now() - rerankStart;

        const isCorpusRelevant = RerankerService.hasCorpusRelevance(rerankedChunks, plan);

        if (!isCorpusRelevant || rerankedChunks.length === 0) {
          logger.info(`No relevant topic in indexed corpus for query: "${prompt.slice(0, 60)}"`);
          isUnrelated = true;
          synthesisResult = {
            rawAnswer: UNRELATED_MESSAGE,
            structuredIrac: {
              issue: 'Topic not found in indexed documents.',
              rule: UNRELATED_MESSAGE,
              application: UNRELATED_MESSAGE,
              conclusion: UNRELATED_MESSAGE
            },
            model: 'LawIntel Retrieval Guard',
            isMock: true
          };
          rerankedChunks = [];
        } else {
          // 5. Synthesis via Groq API (openai/gpt-oss-120b) with UK IRAC Methodology
          const synthesisStart = Date.now();
          synthesisResult = await GroqLlmService.synthesize(prompt, rerankedChunks);
          synthesisMs = Date.now() - synthesisStart;

          if (synthesisResult.rawAnswer.includes(UNRELATED_MESSAGE)) {
            isUnrelated = true;
          }

          // 6. Post-generation Citation & Authority Validation
          const validationStart = Date.now();
          validatedCitations = CitationValidator.validate(synthesisResult.rawAnswer, rerankedChunks);
          citationValidationMs = Date.now() - validationStart;
        }
      }

      const totalDurationMs = Date.now() - startTime;

      // 7. Persist to ResearchSession Collection
      const queryRecord = {
        userPrompt: prompt,
        sanitizedPrompt: prompt.trim(),
        securityGuardrail: {
          passed: guardrailResult.passed,
          riskScore: guardrailResult.riskScore,
          classification: guardrailResult.classification
        },
        retrievalMetadata: {
          expandedQuery: plan.expandedQuery,
          appliedFilters: plan.filters,
          retrievedChunksCount: rerankedChunks.length,
          topScore: rerankedChunks[0]?.rerankScore || 0,
          isUnrelated
        },
        retrievedChunks: rerankedChunks.map((c) => ({
          chunkId: c.payload.chunk_id,
          documentId: c.payload.document_id,
          qdrantPointId: c.id,
          score: c.score,
          rerankScore: c.rerankScore,
          citation: c.payload.legal_metadata?.neutral_citation,
          paragraphs: c.payload.pinpoint?.paragraph_numbers || [],
          snippet: c.payload.text.slice(0, 350)
        })),
        synthesis: {
          rawAnswer: synthesisResult.rawAnswer,
          structuredIrac: synthesisResult.structuredIrac,
          llmModel: synthesisResult.model,
          isUnrelated
        },
        citationValidation: validatedCitations,
        latency: {
          guardrailMs,
          retrievalMs,
          rerankMs,
          synthesisMs,
          citationValidationMs,
          totalDurationMs
        }
      };

      let session = await ResearchSession.findOne({ sessionId });
      if (!session) {
        session = await ResearchSession.create({
          sessionId,
          title: prompt.slice(0, 60),
          queries: [queryRecord]
        });
      } else {
        session.queries.push(queryRecord);
        await session.save();
      }

      // Record Audit Log
      await AuditService.logEvent(
        'RESEARCH_QUERY_EXECUTED',
        'INFO',
        {
          sessionId,
          chunksRetrieved: rerankedChunks.length,
          citationsCount: validatedCitations.length,
          totalDurationMs
        },
        req
      );

      res.status(200).json({
        success: true,
        data: {
          sessionId,
          guardrail: {
            passed: guardrailResult.passed,
            riskScore: guardrailResult.riskScore
          },
          structuredAnswer: {
            irac: synthesisResult.structuredIrac,
            rawMarkdown: synthesisResult.rawAnswer,
            model: synthesisResult.model,
            isUnrelated
          },
          citations: validatedCitations,
          retrievedChunks: rerankedChunks.map((c) => {
            const baseSim = (typeof c.score === 'number' && c.score > 0 && c.score <= 1) ? c.score : 0.82;
            const boost = Math.min((c.rerankScore || 1) / 25, 0.15);
            const normalizedScore = Number(Math.min(0.98, Math.max(0.72, baseSim + boost)).toFixed(2));

            return {
              id: c.id,
              documentId: c.payload.document_id,
              score: normalizedScore,
              rawRerankScore: c.rerankScore,
              metadata: c.payload.legal_metadata,
              pinpoint: c.payload.pinpoint,
              text: c.payload.text
            };
          }),
          metrics: {
            totalDurationMs,
            retrievalMs,
            synthesisMs,
            chunksEvaluated: rawCandidates.length,
            chunksUsed: rerankedChunks.length
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves past research sessions.
   */
  static async getSessions(req, res, next) {
    try {
      const sessions = await ResearchSession.find({ isActive: true })
        .sort({ updatedAt: -1 })
        .select('sessionId title queries createdAt updatedAt')
        .limit(25);

      const summaries = sessions.map((s) => ({
        sessionId: s.sessionId,
        title: s.title,
        queryCount: s.queries.length,
        lastQueryAt: s.updatedAt,
        createdAt: s.createdAt
      }));

      res.status(200).json({
        success: true,
        data: summaries
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves single research session conversation thread.
   */
  static async getSessionById(req, res, next) {
    try {
      const session = await ResearchSession.findOne({ sessionId: req.params.sessionId });
      if (!session) {
        throw new AppError('Research session not found', 404, 'NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: session
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ResearchController;
