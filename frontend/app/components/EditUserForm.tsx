'use client';

import { useEffect, useState } from 'react';
import { User } from '@/app/types/user';

interface EditUserFormProps {
  user: User;
  onUpdateUser: (userData: Partial<User>) => void;
  onClose: () => void;
  isLoading: boolean;
}

const EditUserForm = ({ user, onUpdateUser, onClose, isLoading }: EditUserFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData: Partial<User> = { name, email, role };
    if (password) {
      updatedData.password = password;
    }
    onUpdateUser(updatedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-gray-700">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Full Name*</label>
        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 mt-1 border rounded"/>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email*</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 mt-1 border rounded"/>
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Password</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep unchanged" className="w-full p-2 mt-1 border rounded"/>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium">Role*</label>
        <select id="role" value={role} onChange={e => setRole(e.target.value as any)} className="w-full p-2 mt-1 border rounded">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold">Cancel</button>
        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-gray-800 text-white rounded-md font-semibold disabled:bg-gray-400">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditUserForm;
