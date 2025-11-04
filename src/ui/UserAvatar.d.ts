import { HTMLAttributes } from 'react';

export interface UserAvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps>;