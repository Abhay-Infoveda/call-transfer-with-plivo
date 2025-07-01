'use client';

import { useEffect, useState } from 'react';
import ToolTable from '@/app/components/ToolTable';
import Modal from '@/app/components/Modal';
import AddToolForm from '@/app/components/AddToolForm';
import EditToolForm from '@/app/components/EditToolForm';
import { Tool } from '@/app/types/tool';
import { useAuth } from '@/app/contexts/AuthContext';

const ToolsPage = () => {
  const { token } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [toolToEdit, setToolToEdit] = useState<Tool | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchTools = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/tools`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();
      setTools(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTools();
  }, [token]);

  const handleAddTool = async (toolData: Omit<Tool, '_id'>) => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(toolData),
      });
      if (!response.ok) throw new Error('Failed to add tool');
      await fetchTools(); // Refresh list
      setAddModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTool = async (toolData: Partial<Tool>) => {
    if (!toolToEdit) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/tools/${toolToEdit._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(toolData),
      });
      if (!response.ok) throw new Error('Failed to update tool');
      await fetchTools(); // Refresh list
      setEditModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${apiBaseUrl}/api/tools/${toolId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete tool');
      fetchTools(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Tools</h1>
        <button onClick={() => setAddModalOpen(true)} className="px-4 py-2 bg-gray-800 text-white rounded-md">
          Add Tool
        </button>
      </div>

      {isLoading && <p>Loading tools...</p>}
      {error && <p className="text-red-500">{`Error: ${error}`}</p>}
      {!isLoading && !error && (
        <ToolTable 
          tools={tools}
          onEdit={(tool) => { setToolToEdit(tool); setEditModalOpen(true); }}
          onDelete={(tool) => handleDeleteTool(tool._id)}
        />
      )}

      {isAddModalOpen && (
        <Modal title="New Tool" onClose={() => setAddModalOpen(false)} isOpen={isAddModalOpen}>
          <AddToolForm 
            onAddTool={handleAddTool} 
            onClose={() => setAddModalOpen(false)} 
            isLoading={isLoading}
          />
        </Modal>
      )}

      {isEditModalOpen && toolToEdit && (
        <Modal title="Edit Tool" onClose={() => setEditModalOpen(false)} isOpen={isEditModalOpen}>
          <EditToolForm 
            tool={toolToEdit}
            onUpdateTool={handleUpdateTool}
            onClose={() => setEditModalOpen(false)}
            isLoading={isLoading}
          />
        </Modal>
      )}
    </div>
  );
};

export default ToolsPage; 