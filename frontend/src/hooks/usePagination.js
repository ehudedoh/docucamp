import { useState } from 'react'
import { PAGE_SIZE } from '../utils/constants.js'

export default function usePagination(initialPage = 1, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(initialPage)
  return { page, setPage, pageSize }
}