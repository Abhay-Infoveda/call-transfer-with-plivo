'use client';

import { useEffect, useState } from 'react';
import AgentTable from '@/app/components/AgentTable';
import Modal from '@/app/components/Modal';
import AddAgentForm from '@/app/components/AddAgentForm';
import EditAgentForm from '@/app/components/EditAgentForm';
import { Agent } from '@/app/types/agent';
import { useAuth } from '@/app/contexts/AuthContext';

const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Data for modals
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAgents = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:8080/api/agents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch: ${await res.text()}`);
      setAgents(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [token]);

  const handleAddAgent = async (agentData: any) => {
    if (!token) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('http://localhost:8080/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(agentData),
      });
      if (!res.ok) throw new Error(`Failed to add agent: ${await res.text()}`);
      setIsAddModalOpen(false);
      await fetchAgents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setIsEditModalOpen(true);
  };

  const handleUpdateAgent = async (agentId: string, agentData: any) => {
    if (!token) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`http://localhost:8080/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(agentData),
      });
      if (!res.ok) throw new Error(`Failed to update agent: ${await res.text()}`);
      setIsEditModalOpen(false);
      await fetchAgents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (agent: Agent) => {
    setDeletingAgent(agent);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAgent = async () => {
    if (!token || !deletingAgent) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`http://localhost:8080/api/agents/${deletingAgent._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to delete agent: ${await res.text()}`);
      setIsDeleteModalOpen(false);
      await fetchAgents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Agent Management</h2>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          + Add Agent
        </button>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Agent">
        <AddAgentForm onAddAgent={handleAddAgent} onClose={() => setIsAddModalOpen(false)} isLoading={isSubmitting} />
      </Modal>

      {editingAgent && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Agent">
          <EditAgentForm agentToEdit={editingAgent} onUpdateAgent={handleUpdateAgent} onClose={() => setIsEditModalOpen(false)} isLoading={isSubmitting} />
        </Modal>
      )}

      {deletingAgent && (
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
          <p>Are you sure you want to delete agent "{deletingAgent.name}"?</p>
          <div className="flex justify-end space-x-4 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button onClick={confirmDeleteAgent} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-md">
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {isLoading ? (
        <p>Loading agents...</p>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong> {error}
        </div>
      ) : (
        <AgentTable agents={agents} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
      )}
    </div>
  );
};

export default AgentsPage;
