'use client';

import { useState } from 'react';
import { ToolParameter } from '@/app/types/tool';

interface AddToolFormProps {
  onAddTool: (toolData: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

const defaultParam: ToolParameter = {
  name: '',
  type: 'string',
  description: '',
  required: true,
  location: 'PARAMETER_LOCATION_BODY',
};

const AddToolForm = ({ onAddTool, onClose, isLoading }: AddToolFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrlPattern, setBaseUrlPattern] = useState('');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [parameters, setParameters] = useState<ToolParameter[]>([]);
  const [headers, setHeaders] = useState<{ key: string, value: string }[]>([{ key: '', value: '' }]);
  
  const handleAddHeader = () => setHeaders([...headers, { key: '', value: '' }]);
  const handleRemoveHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));
  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };
  
  const handleAddParam = () => setParameters([...parameters, { ...defaultParam }]);
  const handleRemoveParam = (index: number) => setParameters(parameters.filter((_, i) => i !== index));
  
  const handleParamChange = (index: number, field: keyof ToolParameter, value: any) => {
    const newParams = [...parameters];
    (newParams[index] as any)[field] = value;
    setParameters(newParams);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const headersObject = headers.reduce((acc, header) => {
      if (header.key) {
        acc[header.key] = header.value;
      }
      return acc;
    }, {} as { [key: string]: string });

    const toolData = {
      name,
      description,
      http: { baseUrlPattern, httpMethod, headers: headersObject },
      parameters,
    };
    onAddTool(toolData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-gray-700">
      <div>
        <label className="block text-sm font-medium">Tool Name*</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 mt-1 border rounded"/>
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 mt-1 border rounded" rows={3}/>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Integration</h3>
        <div>
          <label className="block text-sm font-medium">Custom Endpoint URL*</label>
          <input type="url" value={baseUrlPattern} onChange={e => setBaseUrlPattern(e.target.value)} required className="w-full p-2 mt-1 border rounded" placeholder="https://api.example.com/data"/>
        </div>
        <div>
          <label className="block text-sm font-medium">Type*</label>
          <select value={httpMethod} onChange={e => setHttpMethod(e.target.value as any)} className="w-full p-2 mt-1 border rounded">
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Headers</h3>
        <p className="text-sm text-gray-500">Enter any Key/Value pairs here</p>
        {headers.map((header, index) => (
          <div key={index} className="space-y-2 border p-3 rounded-md">
            <div className="flex space-x-2">
              <input type="text" placeholder="Key" value={header.key} onChange={e => handleHeaderChange(index, 'key', e.target.value)} className="w-full p-2 border rounded"/>
              <input type="text" placeholder="Value" value={header.value} onChange={e => handleHeaderChange(index, 'value', e.target.value)} className="w-full p-2 border rounded"/>
            </div>
            <button type="button" onClick={() => handleRemoveHeader(index)} className="text-red-500 text-sm">Delete Header</button>
          </div>
        ))}
        <button type="button" onClick={handleAddHeader} className="w-full p-2 border-2 border-dashed rounded-md hover:bg-gray-50">
          + Add Header
        </button>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Parameters</h3>
        {parameters.map((param, index) => (
          <div key={index} className="space-y-2 border p-3 rounded-md">
            <input type="text" placeholder="Parameter Name" value={param.name} onChange={e => handleParamChange(index, 'name', e.target.value)} className="w-full p-2 border rounded"/>
            <textarea placeholder="Description" value={param.description} onChange={e => handleParamChange(index, 'description', e.target.value)} className="w-full p-2 border rounded" rows={2}/>
            <select value={param.location} onChange={e => handleParamChange(index, 'location', e.target.value)} className="w-full p-2 border rounded">
              <option value="PARAMETER_LOCATION_BODY">Body</option>
              <option value="PARAMETER_LOCATION_HEADER">Header</option>
              <option value="PARAMETER_LOCATION_QUERY">Query</option>
            </select>
            <button type="button" onClick={() => handleRemoveParam(index)} className="text-red-500 text-sm">Remove Parameter</button>
          </div>
        ))}
        <button type="button" onClick={handleAddParam} className="w-full p-2 border-2 border-dashed rounded-md hover:bg-gray-50">
          + Add Parameter
        </button>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold">Cancel</button>
        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-gray-800 text-white rounded-md font-semibold disabled:bg-gray-400">
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default AddToolForm;
 