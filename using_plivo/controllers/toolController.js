import Tool from '../models/toolModel.js';
import User from '../models/userModel.js';

// @desc    Create a new tool
// @route   POST /api/tools
// @access  Private
const createTool = async (req, res) => {
  const { name, description, http, parameters, isPublic } = req.body;
  
  try {
    const tool = new Tool({
      name,
      description,
      http,
      parameters,
      isPublic,
      createdBy: req.user.id,
    });

    const createdTool = await tool.save();
    res.status(201).json(createdTool);
  } catch (error) {
    res.status(400).json({ message: 'Error creating tool', error: error.message });
  }
};

// @desc    Get tools available to the user (own tools + public tools)
// @route   GET /api/tools
// @access  Private
const getTools = async (req, res) => {
  try {
    const tools = await Tool.find({
      $or: [{ createdBy: req.user.id }, { isPublic: true }],
    }).populate('createdBy', 'username');
    res.json(tools);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tools', error: error.message });
  }
};

// @desc    Get a single tool by ID
// @route   GET /api/tools/:id
// @access  Private
const getToolById = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (tool) {
      // Check if the user has access (is owner or tool is public)
      if (tool.createdBy.toString() !== req.user.id && !tool.isPublic) {
        return res.status(403).json({ message: 'Not authorized to view this tool' });
      }
      res.json(tool);
    } else {
      res.status(404).json({ message: 'Tool not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tool', error: error.message });
  }
};

// @desc    Update a tool
// @route   PUT /api/tools/:id
// @access  Private
const updateTool = async (req, res) => {
  const { name, description, http, parameters, isPublic } = req.body;

  try {
    const tool = await Tool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    // Check if user is the owner
    if (tool.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this tool' });
    }

    tool.name = name || tool.name;
    tool.description = description || tool.description;
    tool.http = http || tool.http;
    tool.parameters = parameters || tool.parameters;
    tool.isPublic = isPublic !== undefined ? isPublic : tool.isPublic;

    const updatedTool = await tool.save();
    res.json(updatedTool);
  } catch (error) {
    res.status(400).json({ message: 'Error updating tool', error: error.message });
  }
};

// @desc    Delete a tool
// @route   DELETE /api/tools/:id
// @access  Private
const deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    // Check if user is the owner
    if (tool.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to delete this tool' });
    }

    await tool.deleteOne();
    res.json({ message: 'Tool removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tool', error: error.message });
  }
};

export default {
  createTool,
  getTools,
  getToolById,
  updateTool,
  deleteTool,
}; 