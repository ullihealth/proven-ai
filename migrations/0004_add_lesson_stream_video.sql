-- Add Cloudflare Stream video ID to lessons

ALTER TABLE lessons ADD COLUMN stream_video_id TEXT;
