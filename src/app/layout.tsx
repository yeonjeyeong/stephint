import type { Metadata } from 'next';
import { Gowun_Dodum, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { RoleProvider } from '@/context/RoleContext';
import { getServerSession } from '@/lib/auth/session';

const bodyFont = Noto_Sans_KR({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const headingFont = Gowun_Dodum({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'StepHint | 막힐 때 곁에서 도와주는 학습 코치',
  description: '학생의 풀이 과정을 읽고, 정답 대신 다음 한 단계 힌트를 건네는 AI 학습 코치',
  keywords: ['StepHint', '학습 코치', '오개념 분석', '풀이 피드백', '교육 AI'],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <RoleProvider initialSession={session}>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
