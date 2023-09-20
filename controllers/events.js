const { log } = require('@spaship/common/lib/logging/pino');
const { processResponse } = require('../services/events');

module.exports.post = async (req, res) => {
  const payload = req.body;
  log.info(payload);
  try {
    const response = await processResponse(payload);
    res.status(200);
    return res.send(response);
  } catch (error) {
    res.status(500);
    return res.send(error);
  }
};
