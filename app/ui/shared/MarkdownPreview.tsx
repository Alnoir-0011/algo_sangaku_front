import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface Props {
  content: string;
}

export default function MarkdownPreview({ content }: Props) {
  return (
    <div>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        code({ children, className }) {
          const isBlock = className?.startsWith("language-");
          return isBlock ? (
            <code
              className={className}
              style={{
                display: "block",
                backgroundColor: "#f0e6cc",
                padding: "0.8rem",
                borderRadius: "4px",
                overflowX: "auto",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              {children}
            </code>
          ) : (
            <code
              className={className}
              style={{
                backgroundColor: "#f0e6cc",
                padding: "0.1em 0.3em",
                borderRadius: "3px",
                fontFamily: "monospace",
                fontSize: "0.875em",
              }}
            >
              {children}
            </code>
          );
        },
        pre({ children }) {
          return (
            <pre
              style={{
                margin: "0.5rem 0",
                background: "transparent",
              }}
            >
              {children}
            </pre>
          );
        },
        table({ children }) {
          return (
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                margin: "0.5rem 0",
              }}
            >
              {children}
            </table>
          );
        },
        th({ children }) {
          return (
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.8rem",
                backgroundColor: "#F4CE93",
                textAlign: "left",
              }}
            >
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.8rem",
              }}
            >
              {children}
            </td>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
