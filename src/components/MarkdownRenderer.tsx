import React from 'react';

function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:';
  } catch {
    return false;
  }
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    keyCounter += 1;
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={keyCounter} className="font-semibold text-[#000000] dark:text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={keyCounter} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={keyCounter}
          className="rounded-[3px] border border-[#EAEAEA] bg-[#F8F8F8] px-1.5 py-0.5 font-mono-tabular text-[0.875em] text-[#111111] dark:border-[#222222] dark:bg-[#161616] dark:text-[#EAEAEA]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch && isSafeHref(linkMatch[2])) {
        const external = linkMatch[2].startsWith('http');
        nodes.push(
          <a
            key={keyCounter}
            href={linkMatch[2]}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="font-medium text-[#111111] underline underline-offset-4 hover:opacity-75 dark:text-white"
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

/**
 * Safe React AST Markdown renderer (no dangerouslySetInnerHTML, immune to XSS).
 */
export function MarkdownRenderer({
  markdown,
  className = '',
}: {
  markdown: string;
  className?: string;
}) {
  if (!markdown || !markdown.trim()) return null;

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre
          key={blocks.length}
          className="overflow-x-auto rounded-[8px] border border-[#EAEAEA] bg-[#F8F8F8] p-4 font-mono-tabular text-xs leading-relaxed text-[#111111] dark:border-[#222222] dark:bg-[#111111] dark:text-[#E5E5E5]"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      blocks.push(
        <h3
          key={blocks.length}
          className="pt-3 text-lg font-semibold tracking-tight text-[#000000] dark:text-white"
        >
          {renderInline(line.slice(4))}
        </h3>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h2
          key={blocks.length}
          className="type-subheading pt-4 text-[#000000] dark:text-white"
        >
          {renderInline(line.slice(3))}
        </h2>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push(
        <h2
          key={blocks.length}
          className="type-subheading pt-4 text-[#000000] dark:text-white"
        >
          {renderInline(line.slice(2))}
        </h2>,
      );
      i += 1;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={blocks.length}
          className="rounded-[8px] border border-[#EAEAEA] bg-[#F8F8F8] px-5 py-4 text-sm italic text-[#111111] dark:border-[#222222] dark:bg-[#111111] dark:text-[#E5E5E5]"
        >
          {renderInline(quoteLines.join(' '))}
        </blockquote>,
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={blocks.length} className="list-disc space-y-2 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={blocks.length} className="list-decimal space-y-2 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph (gather until blank line or block starter)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('> ') &&
      !lines[i].trim().startsWith('```') &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p key={blocks.length} className="leading-[1.8]">
        {renderInline(paraLines.join(' '))}
      </p>,
    );
  }

  return <div className={`space-y-5 ${className}`}>{blocks}</div>;
}
