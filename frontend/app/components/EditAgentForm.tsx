'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Tool } from '@/app/types/tool';
import { Agent } from '@/app/types/agent';

interface EditAgentFormProps {
  agentToEdit: Agent;
  onUpdateAgent: (agentId: string, agentData: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

const EditAgentForm = ({ agentToEdit, onUpdateAgent, onClose, isLoading }: EditAgentFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    voice: '',
    temperature: 1.0,
    tools: [] as string[],
  });
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    // Pre-fill form with agent data
    setFormData({
      name: agentToEdit.name,
      description: agentToEdit.description,
      systemPrompt: agentToEdit.systemPrompt,
      voice: agentToEdit.voice,
      temperature: agentToEdit.temperature,
      tools: agentToEdit.tools.map(t => t._id), // Pre-select existing tools
    });

    // Fetch all available tools
    const fetchTools = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:8080/api/tools', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch tools');
        setAvailableTools(await res.json());
      } catch (error) {
        console.error(error);
      }
    };
    fetchTools();
  }, [agentToEdit, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, tools: selectedIds }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAgent(agentToEdit._id, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields are the same as AddAgentForm but are controlled by this component's state */}
      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Agent Name" required className="w-full p-2 border rounded" />
      <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required className="w-full p-2 border rounded" />
      <textarea name="systemPrompt" value={formData.systemPrompt} onChange={handleChange} placeholder="System Prompt" required className="w-full p-2 border rounded" rows={4}/>
      <div>
        <label className="block text-sm font-medium">Voice</label>
        <input type="text" name="voice" value={formData.voice} onChange={handleChange} required className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium">Temperature: {formData.temperature}</label>
        <input type="range" name="temperature" min="0" max="2" step="0.1" value={formData.temperature} onChange={handleChange} className="w-full"/>
      </div>
      <div>
        <label className="block text-sm font-medium">Tools (Ctrl+Click to select multiple)</label>
        <select name="tools" multiple value={formData.tools} onChange={handleToolChange} className="w-full p-2 border rounded" style={{ height: '150px' }}>
          {availableTools.map(tool => (
            <option key={tool._id} value={tool._id}>{tool.name}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
          {isLoading ? 'Updating...' : 'Update Agent'}
        </button>
      </div>
    </form>
  );
};

export default EditAgentForm;
