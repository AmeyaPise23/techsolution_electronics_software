import { Page, Pageable } from "../types";

const DEFAULT_PAGE: Pageable = { page: 0, size: 25 };

export function paginate<T>(items: T[], pageable: Pageable = DEFAULT_PAGE): Page<T> {
  const { page, size } = pageable;
  const totalElements = items.length;
  const totalPages = size > 0 ? Math.max(1, Math.ceil(totalElements / size)) : 1;
  const start = page * size;
  return {
    content: items.slice(start, start + size),
    page,
    size,
    totalElements,
    totalPages,
  };
}
