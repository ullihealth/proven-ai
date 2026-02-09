import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ContentBlock, QuizBlockData, QuizQuestion } from "@/lib/courses/lessonTypes";

interface LessonContentProps {
  blocks: ContentBlock[];
}

export const LessonContent = ({ blocks }: LessonContentProps) => {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {sortedBlocks.map((block) => (
        <ContentBlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
};

interface ContentBlockRendererProps {
  block: ContentBlock;
}

const ContentBlockRenderer = ({ block }: ContentBlockRendererProps) => {
  const mediaWidth = Math.min(100, Math.max(40, block.displayWidth ?? 100));
  const mediaWrapperStyle = { width: `${mediaWidth}%` };

  switch (block.type) {
    case "video":
      return (
        <div className="mx-auto" style={mediaWrapperStyle}>
          <VideoBlock content={block.content} title={block.title} />
        </div>
      );
    case "text":
      return <TextBlock content={block.content} />;
    case "image":
      return (
        <div className="mx-auto" style={mediaWrapperStyle}>
          <ImageBlock content={block.content} title={block.title} altText={block.altText} />
        </div>
      );
    case "pdf":
      return (
        <div className="mx-auto" style={mediaWrapperStyle}>
          <PdfBlock content={block.content} title={block.title} />
        </div>
      );
    case "audio":
      return (
        <div className="mx-auto" style={mediaWrapperStyle}>
          <AudioBlock content={block.content} title={block.title} />
        </div>
      );
    case "quiz":
      return <QuizBlock content={block.content} title={block.title} />;
    default:
      return null;
  }
};

// Video block - supports YouTube, Vimeo, Cloudflare Stream, or direct URLs
const VideoBlock = ({ content, title }: { content: string; title?: string }) => {
  if (!content || !content.trim()) return null;

  const isYouTube = content.includes("youtube.com") || content.includes("youtu.be");
  const isVimeo = content.includes("vimeo.com");
  const isStreamId = /^[a-f0-9]{32}$/.test(content.trim());
  const isStreamEmbed = content.includes("videodelivery.net") || content.includes("cloudflarestream.com");

  // Extract YouTube video ID
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  // Extract Vimeo video ID
  const getVimeoEmbedUrl = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : url;
  };

  let embedUrl = content;
  if (isStreamId) {
    embedUrl = `https://iframe.videodelivery.net/${content.trim()}`;
  } else if (isYouTube) {
    embedUrl = getYouTubeEmbedUrl(content);
  } else if (isVimeo) {
    embedUrl = getVimeoEmbedUrl(content);
  } else if (isStreamEmbed) {
    embedUrl = content;
  }

  const useIframe = isYouTube || isVimeo || isStreamId || isStreamEmbed;

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
        {useIframe ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title || "Video"}
          />
        ) : (
          <video
            src={content}
            controls
            className="absolute inset-0 h-full w-full"
            title={title || "Video"}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
};

// Text block - renders markdown-style content
const TextBlock = ({ content }: { content: string }) => {
  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Simple markdown-like rendering for headings and paragraphs
  const renderContent = () => {
    const lines = content.split("\n");
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith("# ")) {
        return (
          <h1 key={index} className="text-2xl font-bold text-foreground mt-6 mb-3 first:mt-0">
            {renderInlineMarkdown(trimmedLine.slice(2))}
          </h1>
        );
      }
      if (trimmedLine.startsWith("## ")) {
        return (
          <h2 key={index} className="text-xl font-semibold text-foreground mt-5 mb-2">
            {renderInlineMarkdown(trimmedLine.slice(3))}
          </h2>
        );
      }
      if (trimmedLine.startsWith("### ")) {
        return (
          <h3 key={index} className="text-lg font-medium text-foreground mt-4 mb-2">
            {renderInlineMarkdown(trimmedLine.slice(4))}
          </h3>
        );
      }
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        return (
          <li key={index} className="text-foreground ml-4 list-disc">
            {renderInlineMarkdown(trimmedLine.slice(2))}
          </li>
        );
      }
      if (trimmedLine === "") {
        return <br key={index} />;
      }
      return (
        <p key={index} className="text-foreground leading-relaxed mb-3">
          {renderInlineMarkdown(trimmedLine)}
        </p>
      );
    });
  };

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      {renderContent()}
    </div>
  );
};

// Image block
const ImageBlock = ({ content, title, altText }: { content: string; title?: string; altText?: string }) => {
  return (
    <figure className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-border">
        <img
          src={content}
          alt={altText || title || "Lesson image"}
          className="w-full h-auto object-contain max-h-[500px]"
          loading="lazy"
        />
      </div>
      {title && (
        <figcaption className="text-sm text-muted-foreground text-center">
          {title}
        </figcaption>
      )}
    </figure>
  );
};

// PDF block
const PdfBlock = ({ content, title }: { content: string; title?: string }) => {
  const filename = title || content.split("/").pop() || "PDF";
  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div className="relative w-full h-[600px] overflow-hidden rounded-lg border border-border bg-muted">
        <iframe
          src={content}
          className="absolute inset-0 h-full w-full"
          title={title || "PDF Document"}
        />
      </div>
      <a
        href={content}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm text-primary hover:underline"
      >
        Open {filename} in new tab →
      </a>
    </div>
  );
};

const AudioBlock = ({ content, title }: { content: string; title?: string }) => {
  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div className="w-full rounded-lg border border-border bg-muted p-3">
        <audio controls className="w-full" src={content}>
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};

// Quiz block - renders an interactive quiz from JSON content
const QuizBlock = ({ content, title }: { content: string; title?: string }) => {
  let data: QuizBlockData;
  try {
    data = JSON.parse(content);
  } catch {
    return null;
  }

  if (!data.questions || data.questions.length === 0) return null;

  return <QuizBlockInner data={data} title={title} />;
};

const QuizBlockInner = ({ data, title }: { data: QuizBlockData; title?: string }) => {
  const [answers, setAnswers] = useState<(number | null)[]>(data.questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; correctCount: number } | null>(null);

  const handleAnswer = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    const next = [...answers];
    next[qIndex] = optIndex;
    setAnswers(next);
  };

  const handleSubmit = () => {
    let correct = 0;
    data.questions.forEach((q: QuizQuestion, i: number) => {
      if (answers[i] === q.correctOptionIndex) correct++;
    });
    const score = Math.round((correct / data.questions.length) * 100);
    const passed = score >= (data.passThreshold || 70);
    setResult({ score, passed, correctCount: correct });
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers(data.questions.map(() => null));
    setSubmitted(false);
    setResult(null);
  };

  const allAnswered = answers.every((a) => a !== null);

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-5">
      <div>
        <h3 className="text-lg font-semibold">{title || data.title || "Quiz"}</h3>
        <p className="text-sm text-muted-foreground">
          {data.questions.length} question{data.questions.length !== 1 ? "s" : ""} · {data.passThreshold}% to pass
        </p>
      </div>

      <div className="space-y-6">
        {data.questions.map((q: QuizQuestion, qi: number) => (
          <div key={q.id} className="space-y-2">
            <p className="text-sm font-medium">{qi + 1}. {q.text}</p>
            <div className="space-y-1.5 pl-1">
              {q.options.map((opt: string, oi: number) => {
                const isSelected = answers[qi] === oi;
                const isCorrect = oi === q.correctOptionIndex;
                let optClass = "border-border";
                if (submitted) {
                  if (isCorrect) optClass = "border-green-500 bg-green-50 dark:bg-green-950/30";
                  else if (isSelected && !isCorrect) optClass = "border-red-500 bg-red-50 dark:bg-red-950/30";
                }
                return (
                  <label
                    key={oi}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors",
                      optClass,
                      !submitted && isSelected && "border-primary bg-primary/5"
                    )}
                  >
                    <input
                      type="radio"
                      name={`quiz-block-${q.id}`}
                      checked={isSelected}
                      onChange={() => handleAnswer(qi, oi)}
                      disabled={submitted}
                      className="accent-primary"
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={cn(
            "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
            allAnswered
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Submit
        </button>
      )}

      {submitted && result && (
        <div className={cn(
          "rounded-md px-4 py-3 text-sm",
          result.passed
            ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
            : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
        )}>
          <p className="font-medium">
            {result.passed ? "Passed!" : "Not quite"} — {result.score}% ({result.correctCount}/{data.questions.length})
          </p>
          <button
            onClick={handleRetry}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
};
