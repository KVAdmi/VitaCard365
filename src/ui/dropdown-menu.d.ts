import { HTMLAttributes } from 'react';

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end' | 'center';
  children: React.ReactNode;
}

export interface DropdownMenuTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

export interface DropdownMenuItemProps extends HTMLAttributes<HTMLDivElement> {
  onSelect?: () => void;
  children: React.ReactNode;
}

export interface DropdownMenuLabelProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {}

export const DropdownMenu: React.FC<DropdownMenuProps>;
export const DropdownMenuContent: React.FC<DropdownMenuContentProps>;
export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps>;
export const DropdownMenuItem: React.FC<DropdownMenuItemProps>;
export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps>;
export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps>;