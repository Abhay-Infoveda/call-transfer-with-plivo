// controllers/userController.js
import User from '../models/userModel.js';

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
