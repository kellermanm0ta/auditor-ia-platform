'use client';

import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { createRouter } from '@/lib/routes';

export default function AppPage() {
  const [router, setRouter] = useState<ReturnType<typeof createRouter> | null>(null);

  useEffect(() => {
    setRouter(createRouter());
  }, []);

  if (!router) return null;

  return <RouterProvider router={router} />;
}