import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';

export interface ServerEvent {
  type: string;
  payload: unknown;
  timestamp: string;
}

/**
 * SSE/WebSocket gateway placeholder.
 * Will be expanded to support real-time workflow progress updates.
 */
@Injectable()
export class EventsGateway {
  private readonly events$ = new Subject<ServerEvent>();

  emit(event: ServerEvent): void {
    this.events$.next(event);
  }

  subscribe(): Observable<ServerEvent> {
    return this.events$.asObservable();
  }
}
