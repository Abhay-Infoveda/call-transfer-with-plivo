import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import Agent from '../models/agentModel.js';
import Project from '../models/projectModel.js';

dotenv.config();

async function migrateToProjects() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('Connected to MongoDB');

    // Find all users who have agents but no projects
    const usersWithAgents = await User.find({
      agents: { $exists: true, $ne: [] }
    }).populate('agents');

    console.log(`Found ${usersWithAgents.length} users with agents`);

    for (const user of usersWithAgents) {
      console.log(`Processing user: ${user.username} (${user._id})`);

      // Check if user already has projects
      const existingProjects = await Project.find({ owner: user._id });
      
      if (existingProjects.length > 0) {
        console.log(`User ${user.username} already has projects, skipping...`);
        continue;
      }

      // Create default project
      const defaultProject = new Project({
        name: 'Default Project',
        description: 'Default project created during migration',
        status: 'active',
        owner: user._id,
        agents: user.agents.map(agent => agent._id)
      });

      const savedProject = await defaultProject.save();
      console.log(`Created default project for user ${user.username}: ${savedProject._id}`);

      // Update user to include the new project
      await User.findByIdAndUpdate(
        user._id,
        { $push: { projects: savedProject._id } }
      );

      // Update all agents to reference the project
      for (const agent of user.agents) {
        await Agent.findByIdAndUpdate(
          agent._id,
          { projectId: savedProject._id }
        );
        console.log(`Updated agent ${agent.name} to reference project ${savedProject._id}`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateToProjects();