interface ToolBulletListProps {
  items: string[];
  variant?: "default" | "warning";
}

export const ToolBulletList = ({
  items,
  variant = "default",
}: ToolBulletListProps) => {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-3 text-sm text-muted-foreground"
        >
          <span
            className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              variant === "warning" ? "bg-amber-500" : "bg-primary"
            }`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};
