'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { registerAction } from './actions';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' as const });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await registerAction(form);
      if (!res.ok) {
        const msg =
          res.error === 'WEAK_PASSWORD'
            ? t('weakPassword')
            : res.error === 'EMAIL_EXISTS'
              ? t('emailExists')
              : res.error === 'RATE_LIMIT'
                ? t('rateLimit')
                : t('registerFailed');
        toast({ title: msg, variant: 'destructive' });
        return;
      }
      toast({ title: t('registerSuccess') });

      const loginRes = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push('/login');
      } else {
        router.push('/channels');
        router.refresh();
      }
    });
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">{t('registerTitle')}</CardTitle>
        <CardDescription>{t('registerSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t('name')}</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">{t('passwordHint')}</p>
          </div>
          <div className="space-y-1.5">
            <Label>{t('role')}</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">{t('roleStudent')}</SelectItem>
                <SelectItem value="MENTOR">{t('roleMentor')}</SelectItem>
                <SelectItem value="EMPLOYER">{t('roleEmployer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {t('submitRegister')}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-primary underline-offset-2 hover:underline">
            {t('submitLogin')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
