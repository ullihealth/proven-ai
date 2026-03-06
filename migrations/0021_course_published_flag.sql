-- Migration 0021: Add is_published flag to courses
-- Allows admins to toggle courses visible/hidden from viewers
-- Default 1 (published) so all existing courses remain visible

ALTER TABLE courses ADD COLUMN is_published INTEGER NOT NULL DEFAULT 1;
