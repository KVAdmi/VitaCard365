import { HTMLAttributes, ReactNode } from 'react';

export interface DropdownMenuRootProps {
  children: ReactNode;
}

export interface DropdownMenuTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: ReactNode;
}

export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end' | 'center';
  sideOffset?: number;
  children: ReactNode;
}

export interface DropdownMenuItemProps extends HTMLAttributes<HTMLDivElement> {
  onSelect?: () => void;
  inset?: boolean;
  children: ReactNode;
}

export interface DropdownMenuLabelProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
  children: ReactNode;
}

export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {
  children?: never;
}

declare const DropdownMenu: React.FC<DropdownMenuRootProps> & {
  Trigger: React.FC<DropdownMenuTriggerProps>;
  Content: React.FC<DropdownMenuContentProps>;
  Item: React.FC<DropdownMenuItemProps>;
  Label: React.FC<DropdownMenuLabelProps>;
  Separator: React.FC<DropdownMenuSeparatorProps>;
};

export {
  DropdownMenu,
  type DropdownMenuRootProps,
  type DropdownMenuTriggerProps,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
  type DropdownMenuLabelProps,
  type DropdownMenuSeparatorProps,
};

export const DropdownMenu: React.FC<DropdownMenuProps>;
export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps>;
export const DropdownMenuContent: React.FC<DropdownMenuContentProps>;
export const DropdownMenuItem: React.FC<DropdownMenuItemProps>;
export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps>;
export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps>;