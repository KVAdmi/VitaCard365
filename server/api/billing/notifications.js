const express = require('express');
const router = express.Router();
const { schedulePushNotification } = require('../../lib/push');

// Endpoint para programar notificación push antes del vencimiento
router.post('/schedule-renewal-push', async (req, res) => {
  try {
    const { userId, nextPaymentDate, subscription } = req.body;
    if (!userId || !nextPaymentDate) return res.status(400).json({ error: 'Missing userId or nextPaymentDate' });
    // Programar notificación push (ejemplo: 3 días antes)
    await schedulePushNotification({ userId, nextPaymentDate, subscription });
    res.json({ success: true });
  } catch (e) {
    console.error('Push schedule error:', e);
    res.status(500).json({ error: 'push_schedule_error', detail: e.message });
  }
});

module.exports = router;
