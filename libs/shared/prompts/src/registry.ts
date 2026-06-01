/**
 * Prompt template registry with type-safe retrieval.
 */

import type { PromptTemplate, PromptVariables } from './types.js';

class PromptRegistry {
  private templates = new Map<string, PromptTemplate>();

  register(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  get(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getOrThrow(id: string): PromptTemplate {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Prompt template not found: ${id}`);
    }
    return template;
  }

  render(id: string, variables: PromptVariables): string {
    const template = this.getOrThrow(id);
    let rendered = template.template;

    for (const variable of template.variables) {
      const value = variables[variable.name] ?? variable.defaultValue;
      if (variable.required && value === undefined) {
        throw new Error(`Missing required variable "${variable.name}" for prompt "${id}"`);
      }
      if (value !== undefined) {
        rendered = rendered.replaceAll(`{{${variable.name}}}`, value);
      }
    }

    return rendered;
  }

  list(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  has(id: string): boolean {
    return this.templates.has(id);
  }
}

export const promptRegistry = new PromptRegistry();
export { PromptRegistry };
