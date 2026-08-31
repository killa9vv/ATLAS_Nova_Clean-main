'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { estaLogadoComoAdmin } from '@/lib/admin-auth';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(estaLogadoComoAdmin() ? '/admin/dashboard' : '/admin/login');
  }, [router]);

  return null;
}
