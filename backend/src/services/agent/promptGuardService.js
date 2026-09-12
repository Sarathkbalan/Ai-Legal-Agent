const { hfClient, PROMPT_GUARD_MODEL, hasHfToken } = require('../../config/huggingface');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');

class PromptGuardService {
  /**
   * Evaluates input prompt safety using meta-llama/llama-prompt-guard-2-86m.
   * Defends against prompt injection, jailbreaks, and instructions overrides.
   */
  static async evaluate(prompt) {
    const threshold = parseFloat(process.env.PROMPT_GUARD_THRESHOLD || '0.75');

    // 1. Fast Heuristic & Pattern Guardrail
    const injectionPatterns = [
      /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
      /you\s+are\s+now\s+(?:DAN|jailbroken|unrestricted|an\s+AI\s+without\s+rules)/i,
      /reveal\s+(?:your\s+)?(?:system\s+prompt|hidden\s+instructions)/i,
      /disregard\s+(?:the\s+)?(?:rules|legal\s+constraints)/i,
      /act\s+as\s+a\s+hacker/i,
      /bypass\s+safety/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(prompt)) {
        logger.warn('Heuristic prompt injection detected:', { pattern: pattern.source });
        return {
          passed: false,
          riskScore: 0.99,
          classification: 'injection',
          reason: 'Direct adversarial prompt injection pattern detected.'
        };
      }
    }

    // 2. Model-based Evaluation via meta-llama/llama-prompt-guard-2-86m
    if (hasHfToken) {
      try {
        const result = await hfClient.textClassification({
          model: PROMPT_GUARD_MODEL,
          inputs: prompt
        });

        // Prompt Guard 2 labels typically include: 'INJECTION', 'JAILBREAK', 'BENIGN'
        const injectionScore = result.find(
          (r) => r.label === 'INJECTION' || r.label === 'JAILBREAK' || r.label === 'LABEL_1'
        )?.score || 0;

        const isViolation = injectionScore > threshold;
        return {
          passed: !isViolation,
          riskScore: injectionScore,
          classification: isViolation ? 'injection' : 'benign',
          reason: isViolation ? `Prompt Guard risk score (${injectionScore.toFixed(3)}) exceeded threshold.` : 'Passed security screening.'
        };
      } catch (err) {
        logger.warn(`Prompt Guard 2 API call failed: ${err.message}. Relying on heuristic safeguards.`);
      }
    }

    // Default clean pass if heuristics pass
    return {
      passed: true,
      riskScore: 0.02,
      classification: 'benign',
      reason: 'Passed security heuristics.'
    };
  }
}

module.exports = PromptGuardService;
