// controllers/userController.js
import User from '../models/userModel.js';
import Agent from '../models/agentModel.js';
import Tool from '../models/toolModel.js';
import Project from '../models/projectModel.js';

export const updateAgentConfig = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.agentConfig = req.body.agentConfig; // Assumes full agentConfig is sent
    await user.save();

    res.status(200).json({ message: "Agent config updated", agentConfig: user.agentConfig });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Helper function to validate project access
const validateProjectAccess = async (projectId, userId) => {
  if (!projectId) return null; // Legacy mode
  
  const project = await Project.findOne({ 
    _id: projectId, 
    owner: userId 
  });
  
  if (!project) {
    throw new Error('Project not found or access denied');
  }
  
  return project;
};

// @desc    Create a new agent (supports both project and legacy context)
// @route   POST /api/agents OR POST /api/projects/:projectId/agents
// @access  Private
export const createAgent = async (req, res) => {
  console.log('[AGENT CONTROLLER] Received request to create agent.');
  console.log('[AGENT CONTROLLER] Request Body:', req.body);

  const { name, description, systemPrompt, voice, temperature, tools } = req.body;
  const projectId = req.params.projectId; // Will be undefined for legacy routes

  try {
    // Validate project access if projectId is provided
    const project = await validateProjectAccess(projectId, req.user.id);

    // Verify that all provided tool IDs are valid and accessible to the user
    const userTools = await Tool.find({ 
      _id: { $in: tools },
      $or: [{ createdBy: req.user.id }, { isPublic: true }]
    });

    console.log(`[AGENT CONTROLLER] Found ${userTools.length} valid tools out of ${tools.length} requested.`);

    if (userTools.length !== tools.length) {
      console.error('[AGENT CONTROLLER] Error: Tool validation failed.');
      return res.status(400).json({ message: 'One or more provided tools are invalid or not accessible.' });
    }

    const agent = new Agent({
      name,
      description,
      systemPrompt,
      voice,
      temperature,
      tools,
      owner: req.user.id,
      projectId: projectId || null,
    });

    console.log('[AGENT CONTROLLER] Attempting to save new agent...');
    const createdAgent = await agent.save();
    console.log('[AGENT CONTROLLER] Agent saved successfully:', createdAgent);

    // Add agent to user's list of agents
    const user = await User.findById(req.user.id);
    user.agents.push(createdAgent._id);
    console.log('[AGENT CONTROLLER] Attempting to update user with new agent...');
    await user.save();
    console.log('[AGENT CONTROLLER] User updated successfully.');

    // If project context, add agent to project
    if (project) {
      project.agents.push(createdAgent._id);
      await project.save();
    }

    res.status(201).json(createdAgent);
  } catch (error) {
    console.error('[AGENT CONTROLLER] An error occurred:', error);
    if (error.message === 'Project not found or access denied') {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: `An agent with the name '${name}' already exists.` });
    }
    res.status(400).json({ message: 'Error creating agent', error: error.message });
  }
};

// @desc    Get all agents for the logged-in user (supports both project and legacy context)
// @route   GET /api/agents OR GET /api/projects/:projectId/agents
// @access  Private
export const getAgents = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    let query = { owner: req.user.id };
    
    if (projectId) {
      // Project context: get agents for specific project
      await validateProjectAccess(projectId, req.user.id);
      query.projectId = projectId;
    } else {
      // Legacy context: get all agents (including those without projectId)
      query.$or = [
        { projectId: { $exists: false } },
        { projectId: null }
      ];
    }
    
    const agents = await Agent.find(query).populate('tools', 'name description');
    res.json(agents);
  } catch (error) {
    if (error.message === 'Project not found or access denied') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error fetching agents', error: error.message });
  }
};

// @desc    Get a single agent by ID (supports both project and legacy context)
// @route   GET /api/agents/:id OR GET /api/projects/:projectId/agents/:agentId
// @access  Private
export const getAgent = async (req, res) => {
  try {
    const agentId = req.params.agentId || req.params.id;
    const projectId = req.params.projectId;
    
    let query = { _id: agentId, owner: req.user.id };
    
    if (projectId) {
      // Project context: validate project access
      await validateProjectAccess(projectId, req.user.id);
      query.projectId = projectId;
    }
    
    const agent = await Agent.findOne(query).populate('tools');

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    if (error.message === 'Project not found or access denied') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error fetching agent', error: error.message });
  }
};

// @desc    Update an agent (supports both project and legacy context)
// @route   PUT /api/agents/:id OR PUT /api/projects/:projectId/agents/:agentId
// @access  Private
export const updateAgent = async (req, res) => {
  try {
    const agentId = req.params.agentId || req.params.id;
    const projectId = req.params.projectId;
    
    let query = { _id: agentId, owner: req.user.id };
    
    if (projectId) {
      // Project context: validate project access
      await validateProjectAccess(projectId, req.user.id);
      query.projectId = projectId;
    }
    
    const agent = await Agent.findOne(query);

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Update fields
    const { name, description, systemPrompt, voice, temperature, status, tools } = req.body;
    
    // If tools are being updated, verify them
    if (tools) {
      const userTools = await Tool.find({ 
        _id: { $in: tools },
        $or: [{ createdBy: req.user.id }, { isPublic: true }]
      });
      if (userTools.length !== tools.length) {
        return res.status(400).json({ message: 'One or more provided tools are invalid or not accessible.' });
      }
       agent.tools = tools;
    }

    agent.name = name || agent.name;
    agent.description = description || agent.description;
    agent.systemPrompt = systemPrompt || agent.systemPrompt;
    agent.voice = voice || agent.voice;
    agent.temperature = temperature || agent.temperature;
    agent.status = status || agent.status;

    const updatedAgent = await agent.save();
    res.json(updatedAgent);
  } catch (error) {
    if (error.message === 'Project not found or access denied') {
      return res.status(404).json({ message: error.message });
    }
     if (error.code === 11000) {
      return res.status(400).json({ message: `An agent with that name already exists.` });
    }
    res.status(400).json({ message: 'Error updating agent', error: error.message });
  }
};

// @desc    Delete an agent (supports both project and legacy context)
// @route   DELETE /api/agents/:id OR DELETE /api/projects/:projectId/agents/:agentId
// @access  Private
export const deleteAgent = async (req, res) => {
  try {
    const agentId = req.params.agentId || req.params.id;
    const projectId = req.params.projectId;
    
    let query = { _id: agentId, owner: req.user.id };
    
    if (projectId) {
      // Project context: validate project access
      const project = await validateProjectAccess(projectId, req.user.id);
      
      // Remove agent from project
      project.agents.pull(agentId);
      await project.save();
    }
    
    const agent = await Agent.findOne(query);

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Remove the agent
    await agent.deleteOne();

    // Remove agent reference from user document
    const user = await User.findById(req.user.id);
    user.agents.pull(agent._id);
    await user.save();

    res.json({ message: 'Agent removed' });
  } catch (error) {
    if (error.message === 'Project not found or access denied') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting agent', error: error.message });
  }
};
