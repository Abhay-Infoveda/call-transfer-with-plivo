import Project from '../models/projectModel.js';
import User from '../models/userModel.js';

// Create a new project
export const createProject = async (req, res) => {
  try {
    const { name, description, status = 'active' } = req.body;
    const userId = req.user.id; // Assuming user is authenticated

    // Check if project name already exists for this user
    const existingProject = await Project.findOne({ 
      owner: userId, 
      name: name 
    });

    if (existingProject) {
      return res.status(400).json({ 
        error: 'A project with this name already exists' 
      });
    }

    const project = new Project({
      name,
      description,
      status,
      owner: userId
    });

    const savedProject = await project.save();

    // Add project to user's projects array
    await User.findByIdAndUpdate(
      userId,
      { $push: { projects: savedProject._id } }
    );

    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// Get all projects for a user
export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.find({ owner: userId })
      .populate('agents', 'name description status')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// Get a specific project by ID
export const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({ 
      _id: projectId, 
      owner: userId 
    }).populate('agents', 'name description status voice temperature');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

// Update a project
export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const userId = req.user.id;

    // Check if project exists and belongs to user
    const existingProject = await Project.findOne({ 
      _id: projectId, 
      owner: userId 
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingProject.name) {
      const duplicateProject = await Project.findOne({ 
        owner: userId, 
        name: name,
        _id: { $ne: projectId }
      });

      if (duplicateProject) {
        return res.status(400).json({ 
          error: 'A project with this name already exists' 
        });
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { name, description, status },
      { new: true, runValidators: true }
    );

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// Delete a project
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({ 
      _id: projectId, 
      owner: userId 
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Remove project from user's projects array
    await User.findByIdAndUpdate(
      userId,
      { $pull: { projects: projectId } }
    );

    // Delete the project
    await Project.findByIdAndDelete(projectId);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
}; 