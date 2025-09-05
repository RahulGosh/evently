'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const SortableHeader = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const sort = searchParams.get('sort') || 'desc';
  
  // Create new URLSearchParams object to preserve all existing parameters
  const params = new URLSearchParams(searchParams);
  // Update only the sort parameter
  params.set('sort', sort === 'desc' ? 'asc' : 'desc');

  return (
    <Link 
      href={`${pathname}?${params.toString()}`}
      className="flex items-center gap-2"
    >
      Created 
      <span>{sort === 'desc' ? '↓' : '↑'}</span>
    </Link>
  );
};

export default SortableHeader;