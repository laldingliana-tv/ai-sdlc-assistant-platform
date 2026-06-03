// Orchestration owner: Temporal
import { createModelGateway } from '@ai-sdlc/ai/model-gateway';

/**
 * Shared Model Gateway instance for all Temporal activities.
 * Created once at module load (worker startup) and reused across activity invocations.
 */
export const gateway = createModelGateway();
