import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ApiStatus {
  endpoint: string;
  status: 'checking' | 'success' | 'error' | 'not-checked';
  message?: string;
  responseTime?: number;
}

export default function ApiHealth() {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
    { endpoint: '/api/ping', status: 'not-checked' },
    { endpoint: '/api/config', status: 'not-checked' },
    { endpoint: '/api/features', status: 'not-checked' },
  ]);

  const checkEndpoint = async (endpoint: string): Promise<ApiStatus> => {
    const startTime = Date.now();
    try {
      const response = await fetch(endpoint);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          endpoint,
          status: 'success',
          message: `${response.status} OK`,
          responseTime
        };
      } else {
        return {
          endpoint,
          status: 'error',
          message: `${response.status} ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        endpoint,
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  };

  const checkAllEndpoints = async () => {
    setApiStatuses(prev => prev.map(api => ({ ...api, status: 'checking' })));
    
    const results = await Promise.all(
      apiStatuses.map(api => checkEndpoint(api.endpoint))
    );
    
    setApiStatuses(results);
  };

  useEffect(() => {
    checkAllEndpoints();
  }, []);

  const getStatusIcon = (status: ApiStatus['status']) => {
    switch (status) {
      case 'checking': return <Activity className="h-4 w-4 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ApiStatus['status']) => {
    switch (status) {
      case 'checking': return <Badge variant="secondary">Checking...</Badge>;
      case 'success': return <Badge variant="default" className="bg-green-600">OK</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">Not Checked</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API Health Check
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={checkAllEndpoints}
            disabled={apiStatuses.some(api => api.status === 'checking')}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {apiStatuses.map((api) => (
          <div key={api.endpoint} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(api.status)}
              <code className="text-sm">{api.endpoint}</code>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(api.status)}
              {api.responseTime && (
                <span className="text-xs text-muted-foreground">
                  {api.responseTime}ms
                </span>
              )}
            </div>
          </div>
        ))}
        
        {apiStatuses.some(api => api.status === 'error') && (
          <div className="pt-2 border-t space-y-2">
            <div className="text-sm font-medium text-red-600">Error Details:</div>
            {apiStatuses.filter(api => api.status === 'error').map(api => (
              <div key={api.endpoint} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                <strong>{api.endpoint}:</strong> {api.message}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
