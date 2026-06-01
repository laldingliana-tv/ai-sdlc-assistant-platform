'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface WorkflowEvent {
  type: string;
  workflowId: string;
  step?: string;
  status?: string;
  timestamp?: string;
  data?: unknown;
}

export function useEventStream(workflowId: string | undefined) {
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!workflowId) return;

    const url = `/api/events?workflowId=${encodeURIComponent(workflowId)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WorkflowEvent;
        setEvents((prev) => [...prev, data]);
      } catch {
        // Ignore malformed events
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };
  }, [workflowId]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      setIsConnected(false);
    };
  }, [connect]);

  const reset = useCallback(() => {
    setEvents([]);
  }, []);

  return { events, isConnected, reset };
}
