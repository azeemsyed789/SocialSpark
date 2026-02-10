import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Platform {
  id: string;
  name: string;
  available: boolean;
}

interface PlatformConnectButtonProps {
  platform: Platform;
  onSuccess?: () => void;
  label?: string;
}

export function PlatformConnectButton({ platform, onSuccess, label }: PlatformConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!platform.available) {
      toast({
        title: "Platform Unavailable",
        description: `${platform.name} OAuth is not configured yet.`,
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      // Get OAuth URL from backend
      const response = await fetch(`/api/oauth-secure/connect/${platform.id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate OAuth');
      }
      
      const { authUrl } = await response.json();
      
      // Open OAuth window
      const popup = window.open(
        authUrl,
        'oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      // Listen for postMessage from OAuth popup
      const handleMessage = (event: MessageEvent) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data.type === 'oauth_success') {
          setIsConnecting(false);
          toast({
            title: "Account Connected!",
            description: `Successfully connected ${platform.name} account (@${event.data.username}).`
          });
          onSuccess?.();
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'oauth_error') {
          setIsConnecting(false);
          let errorMessage = "Failed to connect account";
          switch (event.data.error) {
            case 'oauth_cancelled':
              errorMessage = "OAuth flow was cancelled";
              break;
            case 'invalid_state':
              errorMessage = "Security validation failed";
              break;
            case 'connection_failed':
              errorMessage = "Failed to establish connection";
              break;
            case 'no_organization':
              errorMessage = "No organization found. Please create one first.";
              break;
          }
          toast({
            title: "Connection Failed",
            description: errorMessage,
            variant: "destructive"
          });
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Fallback: Check if popup is closed without message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);
      
    } catch (error) {
      console.error('OAuth error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to start OAuth flow",
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };

  const getPlatformIcon = (platformId: string) => {
    const icons: Record<string, string> = {
      linkedin: 'fab fa-linkedin',
      youtube: 'fab fa-youtube',
      discord: 'fab fa-discord',
      instagram: 'fab fa-instagram',
      tiktok: 'fab fa-tiktok'
    };
    return icons[platformId] || 'fas fa-link';
  };

  const getPlatformColor = (platformId: string) => {
    const colors: Record<string, string> = {
      linkedin: 'hover:bg-blue-600',
      youtube: 'hover:bg-red-500',
      discord: 'hover:bg-indigo-500',
      instagram: 'hover:bg-pink-500',
      tiktok: 'hover:bg-black'
    };
    return colors[platformId] || 'hover:bg-gray-500';
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`w-full justify-start space-x-3 transition-colors`}
      variant="outline"
      data-testid={`button-connect-${platform.id}`}
    >
      {isConnecting ? (
        <span>Connecting...</span>
      ) : (
        <>
          <i className={getPlatformIcon(platform.id) + " mr-2"}></i>
          {label || `Connect ${platform.name}`}
        </>
      )}
    </Button>
  );
}