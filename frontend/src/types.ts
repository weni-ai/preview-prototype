export interface Message {
  text: string;
  type: 'user' | 'assistant';
}

export interface Trace {
  type: string;
  summary: string;
  modelInvocationOutput?: any;
  modelInvocationInput?: any;
  failureReason?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  sellerId: string;
} 