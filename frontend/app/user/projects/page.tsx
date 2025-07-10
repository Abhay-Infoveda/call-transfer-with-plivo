"use client";
import { useState } from 'react';
import LoadingSkeleton from '../../components/LoadingSkeleton';

type Project = {
  id: string;
  name: string;
  description?: string;
};

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
};

function CreateProjectModal({ open, onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onCreate({ name, description, id: Date.now().toString() });
      setIsSubmitting(false);
      setName('');
      setDescription('');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 backdrop-blur-md border border-white/0">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-[var(--primary-blue)] mb-6">Create Project</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Project Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] font-medium"
              placeholder="Project Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Description</label>
            <textarea
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] font-medium"
              placeholder="Project Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-[var(--primary-blue)] text-white font-bold text-lg shadow-md hover:bg-[var(--accent-teal)] hover:text-white transition"
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Set to true when fetching projects
  const [showModal, setShowModal] = useState(false);

  const handleCreateProject = (project: Project) => {
    setProjects((prev) => [...prev, project]);
    setShowModal(false);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <LoadingSkeleton width="300px" height="40px" className="mb-2" />
          <LoadingSkeleton width="160px" height="48px" />
        </div>
        <div className="bg-[var(--accent-white)] rounded-xl shadow-md p-8">
          <LoadingSkeleton width="180px" height="32px" className="mb-6" />
          <div className="flex flex-col gap-4">
            <LoadingSkeleton width="100%" height="24px" />
            <LoadingSkeleton width="100%" height="24px" />
            <LoadingSkeleton width="100%" height="24px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4">
      <CreateProjectModal open={showModal} onClose={() => setShowModal(false)} onCreate={handleCreateProject} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--primary-blue)] mb-2">Your Projects</h1>
        <button
          className="px-6 py-3 rounded-lg bg-[var(--primary-blue)] text-white font-bold shadow-md hover:bg-[var(--accent-teal)] hover:text-white transition text-lg mt-4 md:mt-0"
          onClick={() => setShowModal(true)}
        >
          + Create Project
        </button>
      </div>
      <div className="bg-[var(--accent-white)] rounded-xl shadow-md p-8">
        {projects.length === 0 ? (
          <div className="text-gray-500 text-center py-12">
            <p className="text-lg">You haven&apos;t created any projects yet.</p>
            <p className="mt-2">Click &quot;Create Project&quot; to get started!</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <li key={project.id} className="bg-white rounded-lg shadow p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-[var(--primary-blue)] mb-2">{project.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{project.description || 'No description provided.'}</p>
                {/* Add project actions here */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 