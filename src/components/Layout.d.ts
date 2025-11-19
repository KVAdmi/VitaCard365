declare module '@/components/Layout' {
  import { FC, ReactNode } from 'react';
  interface LayoutProps {
    children?: ReactNode;
    title?: string;
    showBackButton?: boolean;
  }
  const Layout: FC<LayoutProps>;
  export default Layout;
}