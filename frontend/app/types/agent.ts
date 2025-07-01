import { Tool } from './tool';

export interface Agent {
  _id: string;
  name: string;
  description: string;
  systemPrompt: string;
  voice: string;
  temperature: number;
  tools: Tool[];
  owner: string;
  createdAt: string;
  updatedAt: string;
} 