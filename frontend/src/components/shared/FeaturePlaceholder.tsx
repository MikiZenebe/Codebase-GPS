interface FeaturePlaceholderProps {
  title: string;
  description: string;
}

export function FeaturePlaceholder({
  title,
  description,
}: FeaturePlaceholderProps) {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-bold">{title}</h1>

      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
