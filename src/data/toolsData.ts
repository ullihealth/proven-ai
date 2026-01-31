export interface ToolSection {
  title: string;
  content: string | string[];
}

export interface AdvancedSection {
  title: string;
  content: string | string[];
}

export interface ToolData {
  id: string;
  name: string;
  category: string;
  externalUrl: string;
  sections: {
    whatProblemSolves: string;
    whoFor: {
      goodFit: string[];
      notGoodFit: string[];
    };
    whatItDoesWell: string[];
    limitations: string[];
    provenAiWay: string;
  };
  advancedSections?: AdvancedSection[];
}

export const toolsData: ToolData[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    category: "Thinking & Conversing with AI",
    externalUrl: "https://chat.openai.com",
    sections: {
      whatProblemSolves:
        "ChatGPT helps you think through ideas, questions, and problems when you're stuck, unsure where to start, or overwhelmed by options. It works best as a thinking partner rather than an answer machine.",
      whoFor: {
        goodFit: [
          "Want help thinking things through",
          "Need clarity before action",
          "Prefer conversation over manuals",
        ],
        notGoodFit: [
          "Expect perfect answers without judgement",
          "Want AI to replace decision-making",
        ],
      },
      whatItDoesWell: [
        "Explores ideas and options",
        "Explains concepts in plain English",
        "Helps with planning and outlining",
      ],
      limitations: [
        "Can sound confident even when incorrect",
        "Easy to over-trust outputs",
        "Not suitable for verification without checks",
      ],
      provenAiWay:
        "Use ChatGPT to think, compare, and reframe ideas. Apply your own judgement before acting.",
    },
    advancedSections: [
      {
        title: "Advanced use cases",
        content: [
          "Brainstorming business strategies and comparing approaches",
          "Preparing for difficult conversations by role-playing scenarios",
          "Breaking down complex topics into digestible explanations",
          "Creating structured outlines for presentations or documents",
        ],
      },
      {
        title: "Example workflows",
        content: [
          "Start with a broad question → ask follow-ups to refine → summarise key points",
          "Paste your draft → ask for critique → iterate based on feedback",
          "Describe a problem → request multiple solutions → evaluate trade-offs together",
          "Use 'explain like I'm new to this' for unfamiliar topics",
        ],
      },
      {
        title: "Common beginner traps",
        content: [
          "Accepting the first answer without questioning it",
          "Asking vague questions and expecting precise answers",
          "Not providing enough context about your situation",
          "Using ChatGPT for fact-checking without verifying sources",
          "Treating it as a search engine instead of a thinking partner",
        ],
      },
      {
        title: "When to move beyond this tool",
        content: "Consider other tools when you need verified facts, real-time data, domain-specific expertise, or when the conversation becomes too long and loses focus. ChatGPT excels at thinking with you, not thinking for you.",
      },
      {
        title: "Related tools / next logical step",
        content: [
          "Claude — for longer, more nuanced writing tasks",
          "Perplexity — when you need real-time search with citations",
          "Notion AI — to organise and structure the ideas you've explored",
          "Microsoft Copilot — if you work primarily in Office tools",
        ],
      },
    ],
  },
  {
    id: "claude",
    name: "Claude",
    category: "Writing & Communication",
    externalUrl: "https://claude.ai",
    sections: {
      whatProblemSolves:
        "Claude helps you write clearly and professionally without losing your natural voice, especially when tone and clarity matter.",
      whoFor: {
        goodFit: [
          "Write emails, documents, or explanations",
          "Care how you sound to others",
          "Want AI support without sounding robotic",
        ],
        notGoodFit: [
          "Want aggressive marketing copy",
          "Expect AI to write entirely for you",
        ],
      },
      whatItDoesWell: [
        "Produces calm, readable writing",
        "Handles long-form text well",
        "Maintains tone and nuance",
      ],
      limitations: [
        "Less creative than some tools",
        "Can be overly cautious",
        "Still needs clear direction",
      ],
      provenAiWay:
        "Use Claude when how you communicate matters. Draft with it, then lightly edit to keep your voice.",
    },
    advancedSections: [
      {
        title: "Advanced use cases",
        content: [
          "Drafting sensitive emails that require careful tone",
          "Editing and improving existing documents for clarity",
          "Translating technical language into accessible prose",
          "Creating consistent voice across multiple pieces of content",
        ],
      },
      {
        title: "Example workflows",
        content: [
          "Paste rough notes → ask Claude to structure into a clear email → refine tone",
          "Share a difficult message → ask for softer alternatives → choose your preferred version",
          "Write a first draft → ask Claude to simplify → keep what feels authentic",
          "Describe your audience → ask Claude to adjust language accordingly",
        ],
      },
      {
        title: "Common beginner traps",
        content: [
          "Expecting Claude to know your voice without examples",
          "Accepting overly formal or cautious suggestions without personalising",
          "Not specifying the audience or context for your writing",
          "Using Claude for very short tasks where you'd be faster yourself",
          "Forgetting to read the output aloud to check if it sounds like you",
        ],
      },
      {
        title: "When to move beyond this tool",
        content: "Consider other tools when you need highly creative or provocative copy, visual content, real-time collaboration with others, or when the writing task requires specific domain expertise Claude lacks.",
      },
      {
        title: "Related tools / next logical step",
        content: [
          "ChatGPT — for more exploratory, back-and-forth thinking",
          "Notion AI — to organise and store your polished writing",
          "Canva — when your writing needs visual presentation",
          "Grammarly — for detailed grammar and style checking",
        ],
      },
    ],
  },
  {
    id: "canva",
    name: "Canva",
    category: "Visual Output (Practical)",
    externalUrl: "https://www.canva.com",
    sections: {
      whatProblemSolves:
        "Canva helps you create simple, professional visuals without design skills, including slides, documents, and graphics.",
      whoFor: {
        goodFit: [
          "Need visuals for work or communication",
          "Don't want to learn design software",
          "Prefer templates and guidance",
        ],
        notGoodFit: [
          "Want advanced artistic control",
          "Enjoy complex design tools",
        ],
      },
      whatItDoesWell: [
        "Produces usable visuals quickly",
        "Provides guided templates",
        "Reduces design anxiety",
      ],
      limitations: [
        "Can encourage over-decoration",
        "Not ideal for bespoke branding",
        "Easy to rely too heavily on templates",
      ],
      provenAiWay:
        "Use Canva to show ideas clearly, not to impress. Clarity beats creativity.",
    },
    advancedSections: [
      {
        title: "Advanced use cases",
        content: [
          "Creating consistent social media graphics across platforms",
          "Building simple pitch decks and client presentations",
          "Designing one-pagers, handouts, and quick reference guides",
          "Making infographics from simple data or processes",
        ],
      },
      {
        title: "Example workflows",
        content: [
          "Start with a template close to your goal → simplify rather than add",
          "Use brand kit to lock in fonts and colours → apply consistently",
          "Export in multiple formats for different platforms",
          "Duplicate designs to create variations quickly",
        ],
      },
      {
        title: "Common beginner traps",
        content: [
          "Adding too many elements because they're available",
          "Using templates that don't match your actual message",
          "Ignoring white space and overcrowding designs",
          "Spending hours perfecting what should be a quick visual",
          "Forgetting mobile viewers when designing social content",
        ],
      },
      {
        title: "When to move beyond this tool",
        content: "Consider professional design tools like Figma or Adobe Creative Suite when you need pixel-perfect control, complex animations, branded assets that must follow strict guidelines, or when your visual needs outgrow template-based creation.",
      },
      {
        title: "Related tools / next logical step",
        content: [
          "Figma — for more precise design control and collaboration",
          "Remove.bg — for quick background removal in images",
          "Claude — to write the copy that goes into your visuals",
          "Notion — to organise and share your visual assets",
        ],
      },
    ],
  },
  {
    id: "notion-ai",
    name: "Notion AI",
    category: "Organisation & Understanding",
    externalUrl: "https://www.notion.so/product/ai",
    sections: {
      whatProblemSolves:
        "Notion AI helps organise notes, ideas, and information so nothing feels scattered or lost.",
      whoFor: {
        goodFit: [
          "Handle lots of notes or ideas",
          "Feel mentally cluttered",
          "Want structure without rigidity",
        ],
        notGoodFit: [
          "Prefer very simple text tools",
          "Don't want to manage a workspace",
        ],
      },
      whatItDoesWell: [
        "Summarises and restructures content",
        "Turns rough thoughts into order",
        "Supports ongoing learning",
      ],
      limitations: [
        "Can feel over-engineered initially",
        "Requires light setup",
        "Not instant gratification",
      ],
      provenAiWay:
        "Use Notion AI as a thinking workspace to clarify and organise, not to rush productivity.",
    },
    advancedSections: [
      {
        title: "Advanced use cases",
        content: [
          "Building a personal knowledge base that grows over time",
          "Summarising meeting notes and extracting action items automatically",
          "Creating structured project documentation from scattered inputs",
          "Connecting related ideas across different pages and databases",
        ],
      },
      {
        title: "Example workflows",
        content: [
          "Capture rough notes → use AI to structure → review and refine",
          "Create templates for recurring tasks or meeting types",
          "Use databases to track and filter information by status or date",
          "Link related pages to build a web of connected knowledge",
        ],
      },
      {
        title: "Common beginner traps",
        content: [
          "Over-engineering your workspace before you understand your needs",
          "Creating too many databases that become hard to maintain",
          "Expecting Notion AI to organise content you haven't captured",
          "Spending more time on the system than the actual work",
          "Not revisiting and pruning old content regularly",
        ],
      },
      {
        title: "When to move beyond this tool",
        content: "Consider simpler tools if Notion feels like overkill for your needs, or specialised tools if you require advanced project management, CRM features, team workflows, or real-time collaboration beyond what Notion offers.",
      },
      {
        title: "Related tools / next logical step",
        content: [
          "Obsidian — for more private, local-first note-taking",
          "Todoist — for simpler, focused task management",
          "ChatGPT — to think through ideas before organising them",
          "Zapier — to automate workflows between Notion and other tools",
        ],
      },
    ],
  },
  {
    id: "microsoft-copilot",
    name: "Microsoft Copilot",
    category: "Work & Productivity Support",
    externalUrl: "https://www.microsoft.com/copilot",
    sections: {
      whatProblemSolves:
        "Microsoft Copilot brings AI into everyday work tools, reducing effort without changing how you work.",
      whoFor: {
        goodFit: [
          "Use Microsoft Office tools regularly",
          "Want AI embedded quietly",
          "Prefer familiar workflows",
        ],
        notGoodFit: [
          "Don't use Microsoft tools",
          "Want experimental AI features",
        ],
      },
      whatItDoesWell: [
        "Assists inside everyday software",
        "Saves time on routine tasks",
        "Feels stable and official",
      ],
      limitations: [
        "Tied to Microsoft ecosystem",
        "Less flexible than standalone tools",
        "Not designed for experimentation",
      ],
      provenAiWay:
        "Treat Copilot as background support. Let it handle routine work so you focus on judgement.",
    },
    advancedSections: [
      {
        title: "Advanced use cases",
        content: [
          "Drafting and refining emails directly in Outlook",
          "Creating presentation outlines from meeting notes in PowerPoint",
          "Analysing data patterns and generating summaries in Excel",
          "Summarising and reformatting long documents in Word",
        ],
      },
      {
        title: "Example workflows",
        content: [
          "Receive long email thread → ask Copilot to summarise → respond with key points",
          "Paste raw data into Excel → ask Copilot to identify trends → create charts",
          "Open blank PowerPoint → describe your presentation goal → refine the generated outline",
          "Draft document in Word → ask Copilot to make it more concise → review changes",
        ],
      },
      {
        title: "Common beginner traps",
        content: [
          "Expecting Copilot to work well outside Microsoft apps",
          "Over-relying on suggestions without reviewing for accuracy",
          "Not providing enough context in your prompts",
          "Assuming Copilot understands your company's specific terminology",
          "Ignoring the 'why' behind suggestions and just accepting them",
        ],
      },
      {
        title: "When to move beyond this tool",
        content: "Consider standalone AI tools like ChatGPT or Claude when you need more control, creative flexibility, longer context windows, or features beyond what Microsoft offers. Copilot is best for routine enhancement within familiar workflows, not exploration or experimentation.",
      },
      {
        title: "Related tools / next logical step",
        content: [
          "ChatGPT — for more flexible, exploratory conversations",
          "Claude — for longer-form writing outside Microsoft apps",
          "Power Automate — to extend Copilot with automated workflows",
          "Notion — if you want AI assistance outside the Microsoft ecosystem",
        ],
      },
    ],
  },
];

export const getToolById = (id: string): ToolData | undefined => {
  return toolsData.find((tool) => tool.id === id);
};

export const getToolCategories = (): string[] => {
  return [...new Set(toolsData.map((tool) => tool.category))];
};

export const getCoreTools = (): ToolData[] => {
  return toolsData;
};
