import { EventEmitter } from "events";
import { ScriptElement } from "./importer/elements";

interface EventTypes {
  "bus:script:set-elements": [elements: ScriptElement[]];
}

class EventBus<TEvents extends Record<string, any>> {
  private emitter = new EventEmitter();

  emit<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    ...eventArg: TEvents[TEventName]
  ) {
    this.emitter.emit(eventName, ...(eventArg as []));
  }

  on<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.emitter.on(eventName, handler as any);
  }

  off<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.emitter.off(eventName, handler as any);
  }
}

export const eventBus = new EventBus<EventTypes>();
export default eventBus;
