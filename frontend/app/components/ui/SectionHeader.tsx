import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  id?: string;
};

export default function SectionHeader({ title, description, action, id }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
      <div>
        <h2
          id={id}
          className="text-base font-semibold tracking-tight text-text-primary"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
