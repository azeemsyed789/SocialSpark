import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformConnectButton } from './platform-connect-button';
import { PlatformBadge } from '../ui/platform-badge';

interface Platform {
  id: string;
  name: string;
  available: boolean;
}

interface ConnectedAccount {
  id: string;
  handle: string;
  platform: string;
  status: 'active' | 'inactive';
}

interface OAuthConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  accountCounts?: Record<string, number>;
  accounts?: ConnectedAccount[];
}

export function OAuthConnectDialog({ open, onOpenChange, onSuccess, accountCounts = {}, accounts = [] }: OAuthConnectDialogProps) {
  const { data: platforms, isLoading, isError } = useQuery<Platform[]>({
    queryKey: ['/api/oauth-secure/platforms'],
    enabled: open
  });
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
    setSelectedPlatform(null);
  };

  // Filter connected accounts for selected platform
  const connectedAccounts = selectedPlatform
    ? accounts.filter(acc => acc.platform === selectedPlatform)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Social Media Account</DialogTitle>
          <DialogDescription>
            Choose a platform to connect with OAuth. This will securely link your account for posting and analytics.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {selectedPlatform ? (
            <div>
              <Button variant="ghost" className="mb-2" onClick={() => setSelectedPlatform(null)}>
                ← Back to platforms
              </Button>
              <h4 className="font-semibold mb-2">Connected Accounts ({connectedAccounts.length})</h4>
              {connectedAccounts.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {connectedAccounts.map(acc => (
                    <div key={acc.id} className="flex items-center p-2 rounded-lg bg-muted/10 border border-border">
                      <PlatformBadge platform={acc.platform} className="mr-2" />
                      <span className="text-sm font-medium text-foreground mr-2">{acc.handle}</span>
                      <span className={`text-xs px-2 py-1 rounded ${acc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {acc.status === 'active' ? 'Live' : 'Disconnected'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground mb-4">No accounts connected yet.</div>
              )}
              <div className="mt-2 mb-2">
                <PlatformConnectButton
                  platform={platforms?.find(p => p.id === selectedPlatform)!}
                  onSuccess={handleSuccess}
                  label="Connect a new account"
                />
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">
                {accountCounts[selectedPlatform] > 0
                  ? `${accountCounts[selectedPlatform]} account${accountCounts[selectedPlatform] > 1 ? 's' : ''} connected`
                  : 'No accounts connected'}
              </span>
            </div>
          ) : isLoading ? (
            <>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Skeleton className="h-6 w-6" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
            </>
          ) : isError ? (
            <div className="text-center text-destructive">Failed to load platforms. Please try again.</div>
          ) : (platforms ?? []).length === 0 ? (
            <div className="text-center text-muted-foreground">No platforms available for connection.</div>
          ) : (
            <>
            {(platforms ?? []).map((platform) => (
              <div key={platform.id} className="flex flex-col items-center">
                <Button
                  variant="outline"
                  className="w-full mb-1"
                  onClick={() => setSelectedPlatform(platform.id)}
                  data-testid={`button-select-${platform.id}`}
                >
                  {platform.name}
                </Button>
                <span className="text-xs text-muted-foreground mt-1">
                  {accountCounts[platform.id] > 0
                    ? `${accountCounts[platform.id]} account${accountCounts[platform.id] > 1 ? 's' : ''} connected`
                    : 'No accounts connected'}
                </span>
              </div>
            ))}
            </>
          )}
        </div>
        <div className="mt-6 border-t pt-4">
          <h4 className="font-semibold mb-2">OAuth Benefits:</h4>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Secure authentication with platform APIs</li>
            <li>Real posting capabilities to your accounts</li>
            <li>Access to engagement metrics and analytics</li>
            <li>Automatic token refresh and management</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}