import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/lib/courses/lessonTypes";

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
