import * as React from 'react';

export interface LayoutProps {
	title?: string;
	showBackButton?: boolean;
	children?: React.ReactNode;
}

// Declaración de tipos para Layout.jsx
declare const Layout: React.FC<LayoutProps>;

export default Layout;
