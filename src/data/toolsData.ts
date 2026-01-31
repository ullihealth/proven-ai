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
        title: "Practical prompts & patterns",
        content: [
          "\"Help me think through [problem] by asking me clarifying questions first.\"",
          "\"What are 3 different ways I could approach [situation]?\"",
          "\"Explain [concept] as if I'm completely new to this.\"",
          "\"What am I missing in my thinking about [topic]?\"",
        ],
      },
      {
        title: "When to move beyond this tool",
        content: "Consider other tools when you need verified facts, real-time data, or domain-specific expertise. ChatGPT excels at thinking with you, not thinking for you.",
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
          "Editing and improving existing documents",
          "Translating technical language into accessible prose",
          "Creating consistent voice across multiple pieces",
        ],
      },
      {
        title: "Practical prompts & patterns",
        content: [
          "\"Help me rewrite this to sound more [professional/warm/direct].\"",
          "\"I need to explain [topic] to someone who might be skeptical.\"",
          "\"Review this email and suggest where the tone could be softened.\"",
          "\"Make this clearer without losing the main message.\"",
        ],
      },
      {
        title: "When to move beyond this tool",
        content: "Consider other tools when you need highly creative or provocative copy, visual content, or when the writing task requires real-time collaboration with others.",
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
          "Creating consistent social media graphics",
          "Building simple pitch decks and presentations",
          "Designing one-pagers and handouts",
          "Making infographics from simple data",
        ],
      },
      {
        title: "Example workflows",
        content: [
          "Start with a template close to your goal, then simplify",
          "Use brand kit to maintain consistency across designs",
          "Export in multiple formats for different platforms",
          "Collaborate with team members on shared designs",
        ],
      },
      {
        title: "When to move beyond this tool",
        content: "Consider professional design tools when you need pixel-perfect control, complex animations, or branded assets that must follow strict guidelines.",
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
          "Building a personal knowledge base over time",
          "Summarising meeting notes and extracting action items",
          "Creating structured project documentation",
          "Connecting related ideas across different pages",
        ],
      },
      {
        title: "Example workflows",
        content: [
          "Capture rough notes → Use AI to structure → Review and refine",
          "Create templates for recurring tasks or projects",
          "Use databases to track and filter information",
          "Link related pages to build a web of knowledge",
        ],
      },
      {
        title: "When to move beyond this tool",
        content: "Consider simpler tools if Notion feels like overkill, or specialised tools if you need advanced project management, CRM features, or team workflows.",
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
          "Drafting emails directly in Outlook",
          "Creating presentation outlines in PowerPoint",
          "Analysing data patterns in Excel",
          "Summarising long documents in Word",
        ],
      },
      {
        title: "Comparisons",
        content: "Unlike standalone AI tools, Copilot works within apps you already use. It trades flexibility for convenience — you don't learn new software, but you're limited to Microsoft's interpretation of AI assistance.",
      },
      {
        title: "When to move beyond this tool",
        content: "Consider standalone AI tools when you need more control, creative flexibility, or features beyond what Microsoft offers. Copilot is best for routine enhancement, not exploration.",
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
