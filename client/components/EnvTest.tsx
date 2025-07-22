import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Settings } from 'lucide-react';

interface EnvTestResult {
  message: string;
  hasDatabaseUrl: boolean;
  clientId?: string;
  databaseUrlLength: number;
}

export default function EnvTest() {
  const [testResult, setTestResult] = useState<EnvTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/env-test');
      
      if (!response.ok) {
        setError(`HTTP ${response.status}`);
        return;
      }

      const data = await response.json();
      setTestResult(data);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-run test on mount
  useEffect(() => {
    runTest();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Environment Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTest} 
          disabled={isLoading}
          className="w-full"
          size="sm"
        >
          {isLoading ? 'Testing...' : 'Test Environment'}
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Error: {error}</span>
          </div>
        )}

        {testResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {testResult.hasDatabaseUrl ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                Database URL: {testResult.hasDatabaseUrl ? 'Set' : 'Missing'}
              </span>
            </div>
            
            {testResult.hasDatabaseUrl && (
              <div className="text-xs text-muted-foreground">
                Length: {testResult.databaseUrlLength} characters
              </div>
            )}

            {testResult.clientId && (
              <div className="text-xs text-muted-foreground">
                Client ID: {testResult.clientId.slice(0, 8)}...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
