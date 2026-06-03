import { MODEL_CATALOG } from '../catalog/models.catalog.js';
import { DEFAULT_PROFILES } from '../config/default-profiles.js';
import { AnthropicProvider } from '../providers/anthropic.provider.js';
import { GoogleProvider } from '../providers/google.provider.js';
import { OpenAIProvider } from '../providers/openai.provider.js';
import { ModelRegistry } from '../registry/model-registry.js';

import { ModelGatewayService } from './model-gateway.service.js';

export function createModelGateway(): ModelGatewayService {
  const registry = new ModelRegistry();
  MODEL_CATALOG.forEach((m) => registry.registerModel(m));
  DEFAULT_PROFILES.forEach((p) => registry.registerProfile(p));
  registry.registerProvider(new OpenAIProvider());
  registry.registerProvider(new AnthropicProvider());
  registry.registerProvider(new GoogleProvider());
  return new ModelGatewayService(registry);
}
