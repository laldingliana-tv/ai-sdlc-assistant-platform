import { TaskCreateRequestSchema } from '@ai-sdlc/shared/schemas';
import type { TaskCreateRequestOutput } from '@ai-sdlc/shared/schemas';

export const CreateTaskDtoSchema = TaskCreateRequestSchema;
export type CreateTaskDto = TaskCreateRequestOutput;
