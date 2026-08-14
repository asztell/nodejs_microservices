-- Active: 1786586458734@@ep-dry-paper-ayrxmt2c.c-5.us-east-2.aws.neon.tech@5432@neondb
CREATE TABLE IF NOT EXISTS task_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_AT TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_workflows_task_id ON task_workflows (task_id);
