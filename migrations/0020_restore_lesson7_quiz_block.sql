-- Restore the Lesson 7 quiz content block (was accidentally deleted)
-- Inserts it back at array index 1 (between video and pdf)

UPDATE lessons
SET content_blocks = json_insert(
  content_blocks,
  '$[1]',
  json_object(
    'id', '1772042455871-q0utxk3ur',
    'type', 'quiz',
    'order', 2,
    'title', 'Putting It All Together',
    'content', '{"title":"Putting It All Together","questions":[{"id":"q7-1","text":"What distinguishes structured prompting from casual prompting?","options":["Structured prompts are longer","Structured prompts include deliberate elements such as role, context, and format","Structured prompts avoid refinement","Structured prompts rely on technical language"],"correctOptionIndex":1},{"id":"q7-2","text":"Why is refinement important after receiving an AI response?","options":["Because AI responses are incomplete by default","Because iterative adjustments improve alignment with your needs","Because refinement increases processing accuracy","Because longer conversations produce better answers"],"correctOptionIndex":1},{"id":"q7-3","text":"When evaluating a decision using AI, what is the most effective approach?","options":["Ask for a single recommendation","Ask AI to decide for you","Request structured analysis including risks and benefits","Avoid providing context"],"correctOptionIndex":2},{"id":"q7-4","text":"What is the benefit of combining structure, context, and refinement?","options":["It guarantees perfect output","It reduces the need for judgement","It produces clearer, more usable results","It eliminates bias"],"correctOptionIndex":2},{"id":"q7-5","text":"What mindset shift defines advanced AI use?","options":["Using longer prompts","Accepting the first usable answer","Designing and refining instructions deliberately","Switching platforms frequently"],"correctOptionIndex":2}],"passThreshold":70}'
  )
)
WHERE id = '1771598887235-eo4ogljbp';
