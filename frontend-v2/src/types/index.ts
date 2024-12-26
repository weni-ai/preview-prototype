export interface Message {
  type: 'user' | 'assistant';
  text: string;
}

export interface Trace {
  type: string;
  summary: string;
  modelInvocationOutput?: any;
  modelInvocationInput?: any;
  failureReason?: string;
}

export interface ChatResponse {
  response?: string;
  traces?: Trace[];
}