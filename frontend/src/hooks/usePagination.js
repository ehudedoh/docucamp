import { useState } from 'react';
export default function usePagination(initialPage = 1) { const [page, setPage] = useState(initialPage); return { page, next: () => setPage(value => value + 1), previous: () => setPage(value => Math.max(1, value - 1)), setPage }; }
