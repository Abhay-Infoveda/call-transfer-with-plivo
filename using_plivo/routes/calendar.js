import express from 'express';
import { createCalendarEvent } from '../tools/calendar.js';

const router = express.Router();

// POST /tools/calendar/create
router.post('/create', async (req, res) => {
    try {
      const { userEmail, summary, startDateTime, endDateTime, attendees, location, description } = req.body;
  
      if (!userEmail || !summary || !startDateTime || !endDateTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      const eventDetails = {
        summary,
        startDateTime,
        endDateTime,
        location: location || '',
        description: description || '',
        attendees: Array.isArray(attendees) ? attendees.map(email => ({ email })) : []
      };
  
      const result = await createCalendarEvent(userEmail, eventDetails);
      res.status(200).json({ message: 'Event created successfully', event: result });
  
    } catch (error) {
      console.error('Calendar event creation failed:', error.message);
      res.status(500).json({ error: error.message });
    }
  });
  
export default router;