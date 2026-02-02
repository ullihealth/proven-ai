import { AppLayout } from "@/components/layout/AppLayout";
import { CheckCircle } from "lucide-react";

const WhatIsProvenAI = () => {
  return (
    <AppLayout>
      <div className="pai-content-width py-8 md:py-12">
        <article className="prose prose-slate max-w-none">
          <h1>What is Proven AI?</h1>
          
          <p>
            Proven AI is a membership community designed specifically for professionals over 40 
            who want to understand and use AI effectively — without the hype, jargon, or pressure 
            to keep up with every new development.
          </p>
          <p>
            We believe in clarity over complexity. Our approach is structured, calm, and practical. 
            Every piece of content is designed to help you feel confident and supported.
          </p>

          <h2>How This Space is Organised</h2>
          <p>
            The sidebar on your left is your navigation hub. Here's how it's structured:
          </p>

          <ul className="space-y-3 mt-4 list-none pl-0">
            {[
              { title: "Start Here", desc: "Foundational content explaining what Proven AI is, how it works, and membership details." },
              { title: "Daily Flow", desc: "Structured daily content organised by theme — one topic per day to maintain focus." },
              { title: "Learn", desc: "Courses, guides, prompts, and tools to build your AI knowledge systematically." },
              { title: "Tools", desc: "A curated directory of AI tools with honest assessments and practical guidance." },
              { title: "Go Deeper", desc: "Advanced courses for those ready to take the next step." },
              { title: "Support", desc: "Get help when you need it and connect with the community." },
            ].map((item) => (
              <li key={item.title} className="flex items-start gap-3 !my-0">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">{item.title}:</span>{" "}
                  <span className="text-pai-text-secondary">{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <h2>Where to go next</h2>
          <p>
            After reading this page, we recommend:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-pai-text-secondary">
            <li>Read "How Proven AI Works" to understand our philosophy and rhythm</li>
            <li>Check today's Daily Flow content for something practical</li>
            <li>Browse the free courses when you're ready to go deeper</li>
          </ol>

          <div className="mt-8 p-4 rounded-lg bg-pai-surface border border-pai-border-subtle">
            <p className="text-sm text-pai-text-secondary">
              <strong className="text-foreground">Remember:</strong> There's no rush. 
              Proven AI is designed for steady progress, not information overload. 
              Take your time and move at a pace that works for you.
            </p>
          </div>
        </article>
      </div>
    </AppLayout>
  );
};

export default WhatIsProvenAI;
