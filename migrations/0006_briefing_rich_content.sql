-- Add rich content columns to briefing_items
-- image_url: hero image from RSS media:content/enclosure/og:image
-- content_html: full article content from content:encoded or fetched extraction

ALTER TABLE briefing_items ADD COLUMN image_url TEXT;
ALTER TABLE briefing_items ADD COLUMN content_html TEXT;
