interface ToolBulletListProps {
  items: string[];
  variant?: "default" | "warning";
}

export const ToolBulletList = ({
  items,
  variant = "default",
}: ToolBulletListProps) => {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground"
        >
          <span
            className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${
              variant === "warning" ? "bg-amber-500" : "bg-primary"
            }`}
          />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
};
