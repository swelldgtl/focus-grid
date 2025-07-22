import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Database, Users } from "lucide-react";

interface DatabaseTestResult {
  success: boolean;
  message?: string;
  connectionTime?: string;
  clientsCount?: number;
  clients?: Array<{
    id: string;
    name: string;
    slug: string;
    created_at: string;
  }>;
  availableFeatures?: string[];
  error?: string;
}

export default function DatabaseTest() {
  const [testResult, setTestResult] = useState<DatabaseTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/database/test");

      // Check if response is ok first
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setTestResult({
            success: false,
            error: errorData.error || `HTTP ${response.status}`,
          });
        } catch {
          setTestResult({
            success: false,
            error: `HTTP ${response.status}: ${errorText}`,
          });
        }
        return;
      }

      // Parse JSON response
      const data = await response.json();

      setTestResult({
        success: true,
        message: data.message,
        connectionTime: data.connectionTime,
        clientsCount: data.clientsCount,
        clients: data.clients,
        availableFeatures: data.availableFeatures,
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-run test on mount
  useEffect(() => {
    runTest();
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTest} disabled={isLoading} className="w-full">
          {isLoading ? "Testing..." : "Test Database Connection"}
        </Button>

        {testResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span
                className={
                  testResult.success ? "text-green-600" : "text-red-600"
                }
              >
                {testResult.success
                  ? "Connection Successful"
                  : "Connection Failed"}
              </span>
            </div>

            {testResult.success && (
              <div className="space-y-3">
                {testResult.connectionTime && (
                  <div className="text-sm text-muted-foreground">
                    Connected at:{" "}
                    {new Date(testResult.connectionTime).toLocaleString()}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Clients: {testResult.clientsCount}</span>
                </div>

                {testResult.clients && testResult.clients.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Existing Clients:</h4>
                    {testResult.clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">
                            /{client.slug}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {client.id.slice(0, 8)}...
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {testResult.availableFeatures && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Available Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {testResult.availableFeatures.map((feature) => (
                        <Badge key={feature} variant="secondary">
                          {feature.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {testResult.error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                Error: {testResult.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
