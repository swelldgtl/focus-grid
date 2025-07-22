import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bug } from "lucide-react";

export default function ApiTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConfigApi = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log("Testing config API...");
      const response = await fetch("/api/config");
      console.log("Response status:", response.status);

      const text = await response.text();
      console.log("Response text:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: "Invalid JSON", rawResponse: text };
      }

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
      });
    } catch (error) {
      console.error("API Test Error:", error);
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          API Debug Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConfigApi} disabled={loading}>
          {loading ? "Testing..." : "Test Config API"}
        </Button>

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={result.ok ? "default" : "destructive"}>
                Status: {result.status}
              </Badge>
            </div>

            <div className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
