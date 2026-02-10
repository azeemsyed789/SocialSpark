import { useQuery } from "@tanstack/react-query";
import type { AuthUser } from '../types/api';

export function useAuth() {
  if (process.env.NODE_ENV === 'development') {
    // Always authenticated in development
    return {
      user: {
        id: 'dev-user',
        email: 'dev@localhost',
        firstName: 'Dev',
        lastName: 'User',
        profileImageUrl: '',
      } as AuthUser,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
