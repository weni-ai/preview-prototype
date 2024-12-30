export interface Message {
  text: string;
  type: 'user' | 'assistant';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
} 