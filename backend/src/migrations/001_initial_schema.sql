-- CreatorIQ initial schema: users, competitors, videos.
-- Run manually against the target database, e.g.:
--   docker exec -i creatoriq-postgres psql -U user -d creatoriq < src/migrations/001_initial_schema.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- users: app accounts, backed by Auth0 for authentication.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  auth0_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  -- Content niche (e.g. "gaming", "beauty") — set during onboarding, not
  -- part of the Auth0 profile, so it isn't populated at signup time.
  niche VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'App user accounts, authenticated via Auth0.';
COMMENT ON COLUMN users.auth0_id IS 'Auth0 "sub" claim — stable external identity.';
COMMENT ON COLUMN users.niche IS 'Content niche selected during onboarding, e.g. gaming, beauty.';

-- ---------------------------------------------------------------------------
-- competitors: YouTube channels a user tracks for competitor monitoring.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competitors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  youtube_channel_id VARCHAR(255) NOT NULL,
  channel_name VARCHAR(255) NOT NULL,
  subscriber_count BIGINT NOT NULL DEFAULT 0 CHECK (subscriber_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A user only needs to track a given channel once.
  CONSTRAINT competitors_user_channel_unique UNIQUE (user_id, youtube_channel_id)
);

COMMENT ON TABLE competitors IS 'YouTube channels tracked by a user for competitor monitoring.';
COMMENT ON COLUMN competitors.youtube_channel_id IS 'YouTube Data API channel ID (e.g. UC...).';

CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_youtube_channel_id ON competitors(youtube_channel_id);

-- ---------------------------------------------------------------------------
-- videos: videos published by a tracked competitor, with snapshot metrics.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  competitor_id INTEGER NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  youtube_video_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  views BIGINT NOT NULL DEFAULT 0 CHECK (views >= 0),
  likes BIGINT NOT NULL DEFAULT 0 CHECK (likes >= 0),
  comments BIGINT NOT NULL DEFAULT 0 CHECK (comments >= 0),
  published_at TIMESTAMPTZ,

  -- A competitor's video is only ever recorded once.
  CONSTRAINT videos_competitor_video_unique UNIQUE (competitor_id, youtube_video_id)
);

COMMENT ON TABLE videos IS 'Videos published by a tracked competitor, with the latest known metrics.';
COMMENT ON COLUMN videos.youtube_video_id IS 'YouTube Data API video ID.';

CREATE INDEX IF NOT EXISTS idx_videos_competitor_id ON videos(competitor_id);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at);

COMMIT;
