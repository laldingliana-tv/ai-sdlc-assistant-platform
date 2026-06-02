-- AlterEnum
ALTER TYPE "AgentExecutionStatus" ADD VALUE 'PENDING';
ALTER TYPE "AgentExecutionStatus" ADD VALUE 'CANCELLED';

-- Update default
ALTER TABLE "AgentExecution" ALTER COLUMN "status" SET DEFAULT 'PENDING';
