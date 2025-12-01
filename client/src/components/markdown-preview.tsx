import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const components: Partial<Components> = {
    h1: ({ children, ...props }) => <h1 className="font-serif text-3xl font-bold text-foreground mt-8 mb-4" {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 className="font-serif text-2xl font-bold text-foreground mt-6 mb-3" {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 className="font-serif text-xl font-bold text-foreground mt-4 mb-2" {...props}>{children}</h3>,
    p: ({ children, ...props }) => <p className="mb-4 text-foreground" {...props}>{children}</p>,
    a: ({ children, ...props }) => <a className="text-foreground hover:underline decoration-foreground/50 underline-offset-2 font-medium transition-colors" {...props}>{children}</a>,
    blockquote: ({ children, ...props }) => <blockquote className="border-l-4 border-foreground/30 pl-4 italic text-foreground/80 my-6 bg-muted/30 py-2 pr-2 rounded-r" {...props}>{children}</blockquote>,
    ul: ({ children, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1 marker:text-foreground" {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1 marker:text-foreground font-medium" {...props}>{children}</ol>,
    code: ({ children, className: codeClassName, ...props }) => {
      const isInline = !codeClassName;
      return isInline ? (
        <code className="bg-primary/5 text-primary px-1.5 py-0.5 rounded text-sm font-mono border border-primary/10" {...props}>
          {children}
        </code>
      ) : (
        <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg overflow-x-auto my-4 border border-border/50 shadow-inner font-mono text-sm leading-relaxed">
          <code className={codeClassName} {...props}>
            {children}
          </code>
        </pre>
      );
    },
    img: ({ alt, ...props }) => (
      <span className="block my-6">
        <img className="rounded-lg border border-border shadow-sm mx-auto max-h-[500px] object-contain bg-white p-1" alt={alt} {...props} />
        {alt && <span className="block text-center text-xs text-muted-foreground mt-2 italic">{alt}</span>}
      </span>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm">
        <table className="w-full text-sm text-left" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }) => <thead className="bg-primary/5 text-primary font-serif uppercase tracking-wider text-xs" {...props}>{children}</thead>,
    th: ({ children, ...props }) => <th className="px-6 py-3 font-bold border-b border-border" {...props}>{children}</th>,
    td: ({ children, ...props }) => <td className="px-6 py-4 border-b border-border last:border-0" {...props}>{children}</td>,
    hr: () => <hr className="my-8 border-border/60" />,
  };

  return (
    <div className={cn("prose prose-stone max-w-none font-body leading-relaxed", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}