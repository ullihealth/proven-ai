export interface ToolSection {
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
  },
];

export const getToolById = (id: string): ToolData | undefined => {
  return toolsData.find((tool) => tool.id === id);
};

export const getToolCategories = (): string[] => {
  return [...new Set(toolsData.map((tool) => tool.category))];
};
