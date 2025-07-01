export interface HttpConfig {
  baseUrlPattern: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: { [key: string]: string };
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  location: 'PARAMETER_LOCATION_BODY' | 'PARAMETER_LOCATION_HEADER' | 'PARAMETER_LOCATION_QUERY';
  knownValue?: string;
}

export interface Tool {
  _id: string;
  name: string;
  description: string;
  isPublic?: boolean;
  http: HttpConfig;
  parameters: ToolParameter[];
  createdBy?: any; // To match backend model
  createdAt?: string;
  updatedAt?: string;
  // Add other tool properties if needed
} 