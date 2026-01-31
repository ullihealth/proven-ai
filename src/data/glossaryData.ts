export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  whyItMatters?: string;
  seeAlso?: string[];
  lastReviewed: string;
}

export const glossaryTerms: GlossaryTerm[] = [
  // A
  {
    id: "ai",
    term: "AI (Artificial Intelligence)",
    definition: "Technology that enables computers to perform tasks that typically require human intelligence, such as understanding language, recognising patterns, or making decisions.",
    whyItMatters: "Understanding what AI actually is helps you cut through the hype and focus on practical applications.",
    seeAlso: ["machine-learning", "llm", "generative-ai"],
    lastReviewed: "January 2026",
  },
  {
    id: "ai-agent",
    term: "AI Agent",
    definition: "An AI system that can take actions on your behalf, such as browsing the web, sending emails, or completing multi-step tasks without constant supervision.",
    whyItMatters: "Agents represent a shift from AI as a tool you use to AI as a helper that works alongside you.",
    seeAlso: ["agentic-ai", "llm", "automation"],
    lastReviewed: "January 2026",
  },
  {
    id: "agentic-ai",
    term: "Agentic AI",
    definition: "AI systems designed to operate with greater autonomy, making decisions and taking sequences of actions to achieve goals rather than just responding to single prompts.",
    whyItMatters: "Understanding agentic AI helps you evaluate which tasks can be safely delegated versus those requiring human oversight.",
    seeAlso: ["ai-agent", "prompt", "human-in-the-loop"],
    lastReviewed: "January 2026",
  },
  {
    id: "api",
    term: "API",
    definition: "Application Programming Interface — a way for different software systems to communicate with each other. Think of it as a waiter taking your order to the kitchen and bringing back your food.",
    whyItMatters: "Many AI tools connect via APIs, which is why you sometimes see 'API access' mentioned in pricing plans.",
    seeAlso: ["llm", "inference"],
    lastReviewed: "January 2026",
  },
  {
    id: "automation",
    term: "Automation",
    definition: "Using technology to perform tasks with minimal human intervention. AI-powered automation can handle more complex, variable tasks than traditional rule-based automation.",
    whyItMatters: "Knowing the difference between simple automation and AI automation helps you choose the right tool for each job.",
    seeAlso: ["ai-agent", "workflow", "bot"],
    lastReviewed: "January 2026",
  },

  // B
  {
    id: "bias",
    term: "Bias (AI Bias)",
    definition: "When an AI system produces unfair or skewed results because of problems in its training data or design. For example, a hiring AI trained mostly on male CVs might unfairly favour male candidates.",
    whyItMatters: "Being aware of bias helps you question AI outputs and use tools more responsibly.",
    seeAlso: ["training-data", "guardrails", "transparency"],
    lastReviewed: "January 2026",
  },
  {
    id: "bot",
    term: "Bot",
    definition: "A software program that performs automated tasks. Bots range from simple scripts that post on social media to sophisticated AI assistants that hold conversations.",
    whyItMatters: "Understanding bots helps you recognise when you're interacting with automation versus a human.",
    seeAlso: ["chatbot", "automation", "ai-agent"],
    lastReviewed: "January 2026",
  },

  // C
  {
    id: "chatbot",
    term: "Chatbot",
    definition: "A program designed to have text or voice conversations with humans. Modern AI chatbots like ChatGPT use large language models to generate responses.",
    whyItMatters: "Chatbots are often your first point of contact with AI — knowing their limits helps you get better results.",
    seeAlso: ["llm", "prompt", "context"],
    lastReviewed: "January 2026",
  },
  {
    id: "context",
    term: "Context",
    definition: "The information an AI has access to when generating a response. This includes your current prompt, previous messages in the conversation, and any documents you've shared.",
    whyItMatters: "Providing good context is one of the most effective ways to get better AI responses.",
    seeAlso: ["context-window", "prompt", "rag"],
    lastReviewed: "January 2026",
  },
  {
    id: "context-window",
    term: "Context Window",
    definition: "The amount of text (measured in tokens) an AI can consider at once when generating a response. Think of it as the AI's working memory.",
    whyItMatters: "Knowing context limits helps you structure longer conversations and documents more effectively.",
    seeAlso: ["token", "llm", "context"],
    lastReviewed: "January 2026",
  },
  {
    id: "copilot",
    term: "Copilot",
    definition: "An AI assistant designed to work alongside you rather than replace you. The term emphasises collaboration — the AI helps, but you remain in control.",
    whyItMatters: "The copilot metaphor sets healthy expectations: AI as a capable helper, not an autonomous replacement.",
    seeAlso: ["ai-agent", "human-in-the-loop"],
    lastReviewed: "January 2026",
  },

  // D
  {
    id: "data",
    term: "Data",
    definition: "Information in a form that computers can process. AI systems learn from data and use it to make predictions or generate content.",
    whyItMatters: "Understanding that AI is only as good as its data helps you evaluate when to trust its outputs.",
    seeAlso: ["training-data", "dataset", "structured-data"],
    lastReviewed: "January 2026",
  },
  {
    id: "dataset",
    term: "Dataset",
    definition: "A collection of data organised for a specific purpose. AI models are trained on datasets that can contain text, images, or other types of information.",
    whyItMatters: "The quality and composition of training datasets directly affects what an AI can and cannot do well.",
    seeAlso: ["training-data", "data", "bias"],
    lastReviewed: "January 2026",
  },
  {
    id: "deep-learning",
    term: "Deep Learning",
    definition: "A type of machine learning that uses neural networks with many layers to learn complex patterns. It powers most modern AI breakthroughs, including language models.",
    whyItMatters: "You don't need to understand the maths, but knowing deep learning exists helps you follow AI news.",
    seeAlso: ["neural-network", "machine-learning", "llm"],
    lastReviewed: "January 2026",
  },

  // E
  {
    id: "embeddings",
    term: "Embeddings",
    definition: "A way of representing text, images, or other data as lists of numbers that capture meaning. Similar items have similar numbers, which helps AI find relevant information.",
    whyItMatters: "Embeddings power search and recommendation features in many AI tools you use daily.",
    seeAlso: ["vector-database", "rag", "llm"],
    lastReviewed: "January 2026",
  },
  {
    id: "explainability",
    term: "Explainability (AI Explainability)",
    definition: "The ability to understand and explain how an AI system arrived at a particular decision or output. Some AI systems are more explainable than others.",
    whyItMatters: "When AI affects important decisions, being able to explain 'why' becomes essential for trust and accountability.",
    seeAlso: ["transparency", "bias", "guardrails"],
    lastReviewed: "January 2026",
  },

  // F
  {
    id: "fine-tuning",
    term: "Fine-tuning",
    definition: "Training an existing AI model on specific data to make it better at particular tasks or to adopt a certain style or tone.",
    whyItMatters: "Most users don't need to fine-tune, but understanding it helps you recognise when a tool has been customised for a specific purpose.",
    seeAlso: ["llm", "training-data", "foundation-model"],
    lastReviewed: "January 2026",
  },
  {
    id: "foundation-model",
    term: "Foundation Model",
    definition: "A large AI model trained on broad data that can be adapted for many different tasks. GPT-4, Claude, and Gemini are examples of foundation models.",
    whyItMatters: "Foundation models are the building blocks behind most AI tools — one model powers many different products.",
    seeAlso: ["llm", "fine-tuning", "generative-ai"],
    lastReviewed: "January 2026",
  },

  // G
  {
    id: "generative-ai",
    term: "Generative AI",
    definition: "AI systems that can create new content — text, images, audio, video, or code — rather than just analysing or categorising existing content.",
    whyItMatters: "Generative AI is what most people mean when they talk about 'AI' today. It's the technology behind ChatGPT, Midjourney, and similar tools.",
    seeAlso: ["llm", "foundation-model", "prompt"],
    lastReviewed: "January 2026",
  },
  {
    id: "guardrails",
    term: "Guardrails",
    definition: "Safety measures built into AI systems to prevent harmful, inappropriate, or off-topic outputs. Guardrails might block certain requests or steer responses in safer directions.",
    whyItMatters: "Understanding guardrails helps explain why AI sometimes refuses requests or gives cautious responses.",
    seeAlso: ["bias", "hallucination", "human-in-the-loop"],
    lastReviewed: "January 2026",
  },

  // H
  {
    id: "hallucination",
    term: "Hallucination",
    definition: "When an AI generates information that sounds confident and plausible but is factually incorrect or entirely made up.",
    whyItMatters: "Recognising that AI can hallucinate is essential for using it safely — always verify important information.",
    seeAlso: ["llm", "rag", "guardrails"],
    lastReviewed: "January 2026",
  },
  {
    id: "human-in-the-loop",
    term: "Human-in-the-loop",
    definition: "A system design where humans review, approve, or correct AI outputs before they're used. This adds a safety check for high-stakes decisions.",
    whyItMatters: "Keeping humans in the loop is often the best way to use AI responsibly, especially for important decisions.",
    seeAlso: ["ai-agent", "guardrails", "copilot"],
    lastReviewed: "January 2026",
  },

  // I
  {
    id: "inference",
    term: "Inference",
    definition: "The process of an AI model generating outputs based on new inputs. When you ask ChatGPT a question, it runs 'inference' to produce an answer.",
    whyItMatters: "Inference is what you pay for with most AI services — it's the 'thinking' that happens each time you use the tool.",
    seeAlso: ["llm", "token", "api"],
    lastReviewed: "January 2026",
  },
  {
    id: "input-output",
    term: "Input / Output",
    definition: "Input is what you give to an AI (your prompt, documents, images). Output is what the AI gives back (text, images, code). The quality of your input heavily influences the output.",
    whyItMatters: "The 'garbage in, garbage out' principle applies strongly to AI — better inputs lead to better outputs.",
    seeAlso: ["prompt", "context", "token"],
    lastReviewed: "January 2026",
  },

  // L
  {
    id: "llm",
    term: "LLM (Large Language Model)",
    definition: "The technology behind tools like ChatGPT and Claude. An LLM is trained on vast amounts of text to understand and generate human-like language.",
    whyItMatters: "Understanding what an LLM is helps you set realistic expectations about what AI can and cannot do.",
    seeAlso: ["token", "context-window", "foundation-model"],
    lastReviewed: "January 2026",
  },

  // M
  {
    id: "machine-learning",
    term: "Machine Learning",
    definition: "A type of AI where systems learn patterns from data rather than following explicit programming rules. The system improves as it sees more examples.",
    whyItMatters: "Machine learning is the foundation of modern AI — understanding it helps you grasp why AI needs data to work.",
    seeAlso: ["deep-learning", "neural-network", "training-data"],
    lastReviewed: "January 2026",
  },
  {
    id: "model",
    term: "Model",
    definition: "The trained AI system that processes inputs and generates outputs. Different models have different capabilities — GPT-4, Claude, and Gemini are all different models.",
    whyItMatters: "Knowing that different models exist helps you choose the right tool and understand why results vary.",
    seeAlso: ["llm", "foundation-model", "fine-tuning"],
    lastReviewed: "January 2026",
  },
  {
    id: "multimodal",
    term: "Multimodal",
    definition: "AI that can understand and work with multiple types of input — not just text, but also images, audio, or video.",
    whyItMatters: "Multimodal AI expands what you can ask for help with, from describing photos to transcribing voice notes.",
    seeAlso: ["llm", "generative-ai", "input-output"],
    lastReviewed: "January 2026",
  },

  // N
  {
    id: "neural-network",
    term: "Neural Network",
    definition: "A computing system loosely inspired by the human brain, made up of connected nodes that process information in layers. Neural networks are the architecture behind most modern AI.",
    whyItMatters: "You don't need to understand neural networks deeply, but knowing they exist helps you follow AI discussions.",
    seeAlso: ["deep-learning", "machine-learning", "parameters"],
    lastReviewed: "January 2026",
  },

  // O
  {
    id: "overfitting",
    term: "Overfitting",
    definition: "When an AI model learns its training data too precisely, including noise and errors, making it perform poorly on new data it hasn't seen before.",
    whyItMatters: "Overfitting explains why AI can sometimes fail on slightly different inputs than what it was trained on.",
    seeAlso: ["training-data", "model", "fine-tuning"],
    lastReviewed: "January 2026",
  },

  // P
  {
    id: "parameters",
    term: "Parameters",
    definition: "The internal settings of an AI model that are adjusted during training. More parameters generally means a more capable (and expensive) model. GPT-4 has hundreds of billions of parameters.",
    whyItMatters: "Parameter count is often used as a rough measure of model capability, though bigger isn't always better.",
    seeAlso: ["model", "llm", "neural-network"],
    lastReviewed: "January 2026",
  },
  {
    id: "prompt",
    term: "Prompt",
    definition: "The instruction or question you give to an AI. The quality and clarity of your prompt significantly affects the quality of the response.",
    whyItMatters: "Learning to write clear prompts is the most practical AI skill you can develop.",
    seeAlso: ["prompt-engineering", "context", "input-output"],
    lastReviewed: "January 2026",
  },
  {
    id: "prompt-engineering",
    term: "Prompt Engineering",
    definition: "The practice of crafting effective prompts to get better results from AI. This includes techniques like providing examples, setting context, or breaking complex tasks into steps.",
    whyItMatters: "Good prompt engineering can dramatically improve AI outputs without needing any technical skills.",
    seeAlso: ["prompt", "context", "llm"],
    lastReviewed: "January 2026",
  },

  // R
  {
    id: "rag",
    term: "RAG (Retrieval-Augmented Generation)",
    definition: "A technique where AI retrieves relevant information from a specific knowledge base before generating a response, improving accuracy and grounding answers in real sources.",
    whyItMatters: "RAG explains how some AI tools can answer questions about your own documents or company knowledge.",
    seeAlso: ["llm", "embeddings", "vector-database"],
    lastReviewed: "January 2026",
  },
  {
    id: "reinforcement-learning",
    term: "Reinforcement Learning",
    definition: "A training method where AI learns by trial and error, receiving rewards for good outputs and penalties for bad ones. It's used to align AI behaviour with human preferences.",
    whyItMatters: "Reinforcement learning from human feedback is how ChatGPT was trained to be helpful and harmless.",
    seeAlso: ["machine-learning", "training-data", "guardrails"],
    lastReviewed: "January 2026",
  },

  // S
  {
    id: "structured-data",
    term: "Structured Data",
    definition: "Data organised in a predictable format, like spreadsheets or databases with clear rows and columns. AI can process structured data more reliably than unstructured data.",
    whyItMatters: "Knowing data types helps you prepare information for AI in the most useful format.",
    seeAlso: ["unstructured-data", "data", "dataset"],
    lastReviewed: "January 2026",
  },
  {
    id: "synthetic-data",
    term: "Synthetic Data",
    definition: "Artificially generated data that mimics real data. It's used to train AI when real data is scarce, sensitive, or expensive to collect.",
    whyItMatters: "Synthetic data is increasingly common — some AI outputs you see may have been trained on AI-generated content.",
    seeAlso: ["training-data", "dataset", "generative-ai"],
    lastReviewed: "January 2026",
  },

  // T
  {
    id: "token",
    term: "Token",
    definition: "The basic unit AI uses to process text — roughly equivalent to a word or part of a word. AI services often price and limit usage based on tokens.",
    whyItMatters: "Understanding tokens helps you manage costs and work within AI tool limitations.",
    seeAlso: ["context-window", "llm", "inference"],
    lastReviewed: "January 2026",
  },
  {
    id: "training-data",
    term: "Training Data",
    definition: "The information used to teach an AI model. The quality, quantity, and diversity of training data directly affects what the AI learns and how well it performs.",
    whyItMatters: "Training data explains both AI capabilities and limitations — models can only know what they've been shown.",
    seeAlso: ["dataset", "bias", "fine-tuning"],
    lastReviewed: "January 2026",
  },
  {
    id: "transparency",
    term: "Transparency",
    definition: "Openness about how an AI system works, what data it uses, and what its limitations are. Transparent AI systems are easier to trust and audit.",
    whyItMatters: "Asking 'how does this work?' is a healthy habit when evaluating AI tools.",
    seeAlso: ["explainability", "bias", "guardrails"],
    lastReviewed: "January 2026",
  },

  // U
  {
    id: "unstructured-data",
    term: "Unstructured Data",
    definition: "Data without a predefined format, such as emails, documents, images, or social media posts. Most real-world data is unstructured, and AI has become much better at processing it.",
    whyItMatters: "AI's ability to handle unstructured data is why it can now help with so many everyday tasks.",
    seeAlso: ["structured-data", "data", "multimodal"],
    lastReviewed: "January 2026",
  },

  // V
  {
    id: "vector-database",
    term: "Vector Database",
    definition: "A database designed to store and search embeddings efficiently. It enables AI to quickly find relevant information from large collections of documents.",
    whyItMatters: "Vector databases power the 'search your documents' features in many AI tools.",
    seeAlso: ["embeddings", "rag", "data"],
    lastReviewed: "January 2026",
  },

  // W
  {
    id: "workflow",
    term: "Workflow",
    definition: "A sequence of steps to complete a task. AI workflow tools help automate multi-step processes by connecting different actions and decisions.",
    whyItMatters: "Thinking in workflows helps you identify where AI can save the most time in your daily work.",
    seeAlso: ["automation", "ai-agent", "copilot"],
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
