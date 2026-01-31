export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  whyItMatters?: string;
  seeAlso?: string[];
  lastReviewed: string;
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: "ai-agent",
    term: "AI Agent",
    definition: "An AI system that can take actions on your behalf, such as browsing the web, sending emails, or completing multi-step tasks without constant supervision.",
    whyItMatters: "Agents represent a shift from AI as a tool you use to AI as a helper that works alongside you.",
    seeAlso: ["agentic-ai", "llm"],
    lastReviewed: "January 2026",
  },
  {
    id: "agentic-ai",
    term: "Agentic AI",
    definition: "AI systems designed to operate with greater autonomy, making decisions and taking sequences of actions to achieve goals rather than just responding to single prompts.",
    whyItMatters: "Understanding agentic AI helps you evaluate which tasks can be safely delegated versus those requiring human oversight.",
    seeAlso: ["ai-agent", "prompt"],
    lastReviewed: "January 2026",
  },
  {
    id: "context-window",
    term: "Context Window",
    definition: "The amount of text (measured in tokens) an AI can consider at once when generating a response. Think of it as the AI's working memory.",
    whyItMatters: "Knowing context limits helps you structure longer conversations and documents more effectively.",
    seeAlso: ["token", "llm"],
    lastReviewed: "January 2026",
  },
  {
    id: "fine-tuning",
    term: "Fine-tuning",
    definition: "Training an existing AI model on specific data to make it better at particular tasks or to adopt a certain style or tone.",
    whyItMatters: "Most users don't need to fine-tune, but understanding it helps you recognise when a tool has been customised for a specific purpose.",
    seeAlso: ["llm", "rag"],
    lastReviewed: "January 2026",
  },
  {
    id: "hallucination",
    term: "Hallucination",
    definition: "When an AI generates information that sounds confident and plausible but is factually incorrect or entirely made up.",
    whyItMatters: "Recognising that AI can hallucinate is essential for using it safely — always verify important information.",
    seeAlso: ["llm", "prompt"],
    lastReviewed: "January 2026",
  },
  {
    id: "llm",
    term: "LLM (Large Language Model)",
    definition: "The technology behind tools like ChatGPT and Claude. An LLM is trained on vast amounts of text to understand and generate human-like language.",
    whyItMatters: "Understanding what an LLM is helps you set realistic expectations about what AI can and cannot do.",
    seeAlso: ["token", "context-window", "hallucination"],
    lastReviewed: "January 2026",
  },
  {
    id: "multimodal",
    term: "Multimodal",
    definition: "AI that can understand and work with multiple types of input — not just text, but also images, audio, or video.",
    whyItMatters: "Multimodal AI expands what you can ask for help with, from describing photos to transcribing voice notes.",
    seeAlso: ["llm"],
    lastReviewed: "January 2026",
  },
  {
    id: "prompt",
    term: "Prompt",
    definition: "The instruction or question you give to an AI. The quality and clarity of your prompt significantly affects the quality of the response.",
    whyItMatters: "Learning to write clear prompts is the most practical AI skill you can develop.",
    seeAlso: ["llm", "context-window"],
    lastReviewed: "January 2026",
  },
  {
    id: "rag",
    term: "RAG (Retrieval-Augmented Generation)",
    definition: "A technique where AI retrieves relevant information from a specific knowledge base before generating a response, improving accuracy and grounding answers in real sources.",
    whyItMatters: "RAG explains how some AI tools can answer questions about your own documents or company knowledge.",
    seeAlso: ["llm", "hallucination"],
    lastReviewed: "January 2026",
  },
  {
    id: "token",
    term: "Token",
    definition: "The basic unit AI uses to process text — roughly equivalent to a word or part of a word. AI services often price and limit usage based on tokens.",
    whyItMatters: "Understanding tokens helps you manage costs and work within AI tool limitations.",
    seeAlso: ["context-window", "llm"],
    lastReviewed: "January 2026",
  },
];

// Get unique first letters for A-Z index
export const getAlphabetIndex = (): string[] => {
  const letters = new Set(glossaryTerms.map(term => term.term[0].toUpperCase()));
  return Array.from(letters).sort();
};

// Get terms grouped by first letter
export const getTermsByLetter = (): Record<string, GlossaryTerm[]> => {
  return glossaryTerms.reduce((acc, term) => {
    const letter = term.term[0].toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(term);
    return acc;
  }, {} as Record<string, GlossaryTerm[]>);
};
