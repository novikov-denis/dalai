import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div className={cn("prose prose-stone max-w-none font-body leading-relaxed", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="font-serif text-3xl font-bold text-primary mt-8 mb-4" {...props} />,
          h2: ({node, ...props}) => <h2 className="font-serif text-2xl font-bold text-primary/90 mt-6 mb-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="font-serif text-xl font-bold text-primary/80 mt-4 mb-2" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 text-foreground/90" {...props} />,
          a: ({node, ...props}) => <a className="text-accent hover:underline decoration-accent/50 underline-offset-2 font-medium transition-colors" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-accent/40 pl-4 italic text-muted-foreground my-6 bg-accent/5 py-2 pr-2 rounded-r" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1 marker:text-accent" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1 marker:text-primary font-medium" {...props} />,
          code: ({node, inline, className, children, ...props}: any) => {
            return inline ? (
              <code className="bg-primary/5 text-primary px-1.5 py-0.5 rounded text-sm font-mono border border-primary/10" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg overflow-x-auto my-4 border border-border/50 shadow-inner font-mono text-sm leading-relaxed">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            )
          },
          img: ({node, ...props}) => (
            <div className="my-6">
              <img className="rounded-lg border border-border shadow-sm mx-auto max-h-[500px] object-contain bg-white p-1" {...props} />
              {props.alt && <p className="text-center text-xs text-muted-foreground mt-2 italic">{props.alt}</p>}
            </div>
          ),
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm">
              <table className="w-full text-sm text-left" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-primary/5 text-primary font-serif uppercase tracking-wider text-xs" {...props} />,
          th: ({node, ...props}) => <th className="px-6 py-3 font-bold border-b border-border" {...props} />,
          td: ({node, ...props}) => <td className="px-6 py-4 border-b border-border last:border-0" {...props} />,
          hr: ({node, ...props}) => <hr className="my-8 border-border/60" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}