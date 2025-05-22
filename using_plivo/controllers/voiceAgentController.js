import jwt from 'jsonwebtoken';

export const getVoiceAgentUrl = async (req, res) => {
  try {
    const userId = req.user.id; // Requires authMiddleware to populate req.user

    // Generate a short-lived token (optional: adjust expiresIn as needed)
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Construct the URL the user can use for Plivo
    const answerUrl = `${process.env.BASE_URL}/plivo/incoming?token=${token}`;

    return res.json({ answerUrl });
  } catch (error) {
    console.error("Failed to generate voice agent URL:", error);
    res.status(500).json({ error: 'Failed to generate answer URL' });
  }
};
