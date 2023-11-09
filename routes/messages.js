const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const User = require('../models/user');
const { authenticateJWT, ensureCorrectUser } = require('../middleware/auth');


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', authenticateJWT, async function (req, res, next) {
    try {
      const message = await Message.get(req.params.id);
      const { username } = req.user;
  
      if (message.from_user.username !== username && message.to_user.username !== username) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
  
      return res.json({ message });
    } catch (error) {
      return next(error);
    }
});
  

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', authenticateJWT, async function (req, res, next) {
    try {
      const { to_username, body } = req.body;
      const from_username = req.user.username;
  
      const message = await Message.create({ from_username, to_username, body });
      return res.status(201).json({ message });
    } catch (error) {
      return next(error);
    }
});
  

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', authenticateJWT, ensureCorrectUser, async function (req, res, next) {
    try {
      const message = await Message.get(req.params.id);
      const { username } = req.user;
  
      if (message.to_user.username !== username) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
  
      const readMessage = await Message.markAsRead(req.params.id);
      return res.json({ message: readMessage });
    } catch (error) {
      return next(error);
    }
});
  
module.exports = router;