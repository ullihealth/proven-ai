-- Migration: 0051_add_prompt_pack_3
-- Adds the third prompt pack (Money and Finance Over 40) to the prompt_packs table

INSERT INTO prompt_packs (title, description, image_url, pdf_url, sort_order, is_active) VALUES
  (
    'Prompt Sheet 3 — Money and Finance Over 40',
    'Proven AI prompts for money and finance topics tailored for the over 40s.',
    'https://assets.provenai.app/attachments/Screenshot%202026-04-08%20at%2023.02.37.png',
    'https://assets.provenai.app/Proven_AI_Money_Finance_Over40_Prompt_Sheet%20(6).pdf',
    3,
    1
  );
