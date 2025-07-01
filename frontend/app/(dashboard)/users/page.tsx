'use client';

import { useEffect, useState } from 'react';
import UserTable from '@/app/components/UserTable';
import Modal from '@/app/components/Modal';
import AddUserForm from '@/app/components/AddUserForm';
import EditUserForm from '@/app/components/EditUserForm';
import { User } from '@/app/types/user';
import { useAuth } from '@/app/contexts/AuthContext';

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // State for modal data
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:8080/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch users: ${await res.text()}`);
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleAddUser = async (userData: any) => {
    if (!token) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      if (!res.ok) throw new Error(`Failed to add user: ${await res.text()}`);
      setIsAddModalOpen(false);
      await fetchUsers(); // Refresh the list
    } catch (err: any) {
      setError(err.message); // You might want a separate error state for the modal
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    if (!token) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(userData),
      });
      if (!res.ok) throw new Error(await res.text());
      setIsEditModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!token || !deletingUser) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`http://localhost:8080/api/users/${deletingUser._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setIsDeleteModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">User Management</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          + Add User
        </button>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New User">
        <AddUserForm
          onAddUser={handleAddUser}
          onClose={() => setIsAddModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {editingUser && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User">
          <EditUserForm userToEdit={editingUser} onUpdateUser={handleUpdateUser} onClose={() => setIsEditModalOpen(false)} isLoading={isSubmitting} />
        </Modal>
      )}

      {deletingUser && (
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
          <p>Are you sure you want to delete the user "{deletingUser.username}"?</p>
          <div className="flex justify-end space-x-4 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button onClick={confirmDeleteUser} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-md">
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {isLoading ? (
        <p>Loading users...</p>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <UserTable users={users} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
      )}
    </div>
  );
};

export default UsersPage; 