import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Terminal, X, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function ImportLogPanel({ logs, isOpen, onClose }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      case 'loading':
        return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
      default:
        return <Terminal className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'loading':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const successCount = logs.filter(l => l.type === 'success').length;
  const errorCount = logs.filter(l => l.type === 'error').length;
  const warningCount = logs.filter(l => l.type === 'warning').length;

  return (
    <Card className="fixed bottom-4 right-4 w-[500px] max-w-[calc(100vw-2rem)] shadow-2xl z-50">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <CardTitle className="text-sm font-medium">Import Log</CardTitle>
          <div className="flex items-center gap-1.5 ml-2">
            {successCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                {successCount} ✓
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                {warningCount} ⚠
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                {errorCount} ✗
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] p-3" ref={scrollRef}>
          <div className="space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No logs yet</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <span className="text-muted-foreground/50 w-12 flex-shrink-0 text-right">
                    {log.timestamp}
                  </span>
                  <span className="flex-shrink-0 mt-0.5">{getLogIcon(log.type)}</span>
                  <span className={`${getLogColor(log.type)} break-all`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
