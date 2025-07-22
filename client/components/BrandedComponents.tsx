import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBranding } from '@/hooks/use-branding';
import { Palette } from 'lucide-react';

export function BrandedButton({ children, className = '', ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button 
      className={`bg-primary hover:bg-primary/90 text-primary-foreground ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

export function BrandedBadge({ children, className = '', ...props }: React.ComponentProps<typeof Badge>) {
  return (
    <Badge 
      className={`bg-primary hover:bg-primary/90 text-primary-foreground ${className}`}
      {...props}
    >
      {children}
    </Badge>
  );
}

export function BrandingDemo() {
  const { primaryColor, clientName } = useBranding();

  if (!primaryColor) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Client Branding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Primary Color:</span>
          <div 
            className="w-6 h-6 rounded border-2 border-gray-300"
            style={{ backgroundColor: primaryColor.startsWith('#') ? primaryColor : `hsl(${primaryColor})` }}
          />
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            {primaryColor}
          </code>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Branded Elements:</div>
          <div className="flex flex-wrap gap-2">
            <BrandedButton size="sm">Primary Button</BrandedButton>
            <BrandedBadge>Branded Badge</BrandedBadge>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Current client: <strong>{clientName}</strong>
        </div>
      </CardContent>
    </Card>
  );
}
