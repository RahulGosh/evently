"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Button } from '../ui/button';
import { formUrlQuery } from '@/lib/utils';

type PaginationProps = {
  page: number | string;
  totalPages: number;
  urlParamName?: string;
  onPageChange?: (page: number) => void; // ✅ Added onPageChange prop
};

const Pagination = ({ page, totalPages, urlParamName, onPageChange }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onClick = (btnType: string) => {
    const pageValue = btnType === 'next' 
      ? Number(page) + 1 
      : Number(page) - 1;

    if (onPageChange) {
      // ✅ Use onPageChange if available (for manual handling)
      onPageChange(pageValue);
    } else {
      // ✅ Otherwise, update URL
      const newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: urlParamName || 'page',
        value: pageValue.toString(),
      });

      router.push(newUrl, { scroll: false });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="lg"
        variant="outline"
        className="w-28"
        onClick={() => onClick('prev')}
        disabled={Number(page) <= 1}
      >
        Previous
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-28"
        onClick={() => onClick('next')}
        disabled={Number(page) >= totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
