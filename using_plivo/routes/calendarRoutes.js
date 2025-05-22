import express from 'express';
import { createCalendarEvent } from '../tools/googleCalendar/createEvent.js';
import { listUpcomingEvents } from '../tools/googleCalendar/listUpcomingEvents.js';
import { deleteCalendarEvent } from '../tools/googleCalendar/deleteEvent.js';
import { updateCalendarEvent } from '../tools/googleCalendar/updateEvent.js';

const router = express.Router();

// POST /tools/calendar/create
router.post('/create_event', async (req, res) => {
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

// GET /tools/calendar/upcoming?userEmail=someone@gmail.com&maxResults=5
router.get('/upcoming', async (req, res) => {
  const { userEmail, maxResults } = req.query;

  if (!userEmail) {
    return res.status(400).json({ error: 'Missing userEmail' });
  }

  try {
    const events = await listUpcomingEvents(userEmail, parseInt(maxResults || '10'));
    res.json({ events });
  } catch (error) {
    console.error('Error fetching upcoming events:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// DELETE /tools/calendar/delete
router.delete('/delete', async (req, res) => {
  const { userEmail, eventId } = req.body;

  if (!userEmail || !eventId) {
    return res.status(400).json({ error: 'Missing userEmail or eventId' });
  }

  try {
    const result = await deleteCalendarEvent(userEmail, eventId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting event:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /tools/calendar/update
router.patch('/update', async (req, res) => {
  const { userEmail, eventId, updatedFields } = req.body;

  if (!userEmail || !eventId || !updatedFields) {
    return res.status(400).json({ error: 'Missing userEmail, eventId, or updatedFields' });
  }

  try {
    const updated = await updateCalendarEvent(userEmail, eventId, updatedFields);
    res.json({ message: 'Event updated successfully', updated });
  } catch (error) {
    console.error('Event update failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;