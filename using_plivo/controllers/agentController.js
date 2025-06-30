// controllers/userController.js
import User from '../models/userModel.js';
import Agent from '../models/agentModel.js';
import Tool from '../models/toolModel.js';

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

// @desc    Create a new agent
// @route   POST /api/agents
// @access  Private
const createAgent = async (req, res) => {
  const { name, description, systemPrompt, voice, temperature, tools } = req.body;

  try {
    // Verify that all provided tool IDs are valid and accessible to the user
    const userTools = await Tool.find({ 
      _id: { $in: tools },
      $or: [{ createdBy: req.user.id }, { isPublic: true }]
    });

    if (userTools.length !== tools.length) {
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
    });

    const createdAgent = await agent.save();

    // Add agent to user's list of agents
    const user = await User.findById(req.user.id);
    user.agents.push(createdAgent._id);
    await user.save();

    res.status(201).json(createdAgent);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: `An agent with the name '${name}' already exists.` });
    }
    res.status(400).json({ message: 'Error creating agent', error: error.message });
  }
};

// @desc    Get all agents for the logged-in user
// @route   GET /api/agents
// @access  Private
const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find({ owner: req.user.id }).populate('tools', 'name description');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agents', error: error.message });
  }
};

// @desc    Get a single agent by ID
// @route   GET /api/agents/:id
// @access  Private
const getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).populate('tools');

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Ensure the user owns the agent
    if (agent.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this agent' });
    }

    res.json(agent);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agent', error: error.message });
  }
};

// @desc    Update an agent
// @route   PUT /api/agents/:id
// @access  Private
const updateAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Ensure the user owns the agent
    if (agent.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this agent' });
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
     if (error.code === 11000) {
      return res.status(400).json({ message: `An agent with that name already exists.` });
    }
    res.status(400).json({ message: 'Error updating agent', error: error.message });
  }
};

// @desc    Delete an agent
// @route   DELETE /api/agents/:id
// @access  Private
const deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Ensure the user owns the agent
    if (agent.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to delete this agent' });
    }

    // Remove the agent
    await agent.deleteOne();

    // Remove agent reference from user document
    const user = await User.findById(req.user.id);
    user.agents.pull(agent._id);
    await user.save();

    res.json({ message: 'Agent removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting agent', error: error.message });
  }
};

export default {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
};
