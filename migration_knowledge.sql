-- Run: wrangler d1 execute sonix-db --file=./migration_knowledge.sql --remote

-- Every learned answer starts as 'pending' — nothing SonixModel serves back
-- to users goes live without a human (you, via admin.html) approving it
-- first. status: 'pending' | 'approved' | 'rejected'
-- origin: 'user_taught' (via "Teach SONIX" button, needs review) |
--         'auto_learned' (scheduled background job, auto-approved, still tagged for audit)
CREATE TABLE IF NOT EXISTS learned_knowledge (
    id            TEXT PRIMARY KEY,
    question      TEXT NOT NULL,
    answer        TEXT NOT NULL,
    source_model  TEXT,          -- display name of the model the answer came from
    status        TEXT NOT NULL DEFAULT 'pending',
    origin        TEXT NOT NULL DEFAULT 'user_taught',
    use_count     INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL,
    reviewed_at   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_learned_knowledge_status ON learned_knowledge (status, created_at);

-- Tracks which curriculum topics have already been auto-learned, so the
-- scheduled job doesn't ask the same question twice.
CREATE TABLE IF NOT EXISTS curriculum_progress (
    topic_key   TEXT PRIMARY KEY,
    learned_at  INTEGER NOT NULL
);

