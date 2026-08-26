import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  /** Omitido no último item — ele é o "você está aqui", não um link. */
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-[1180px] px-5 py-3.5">
      <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted">
        <li>
          <Link href="/" className="hover:text-navy hover:underline">
            Início
          </Link>
        </li>
        {items.map((item, indice) => {
          const ehUltimo = indice === items.length - 1;
          return (
            <li key={`${item.label}-${indice}`} className="flex items-center gap-1.5">
              <span aria-hidden="true">/</span>
              {item.href && !ehUltimo ? (
                <Link href={item.href} className="hover:text-navy hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={ehUltimo ? 'page' : undefined}
                  className="font-semibold text-navy"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
