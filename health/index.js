const liveness = (req, res) => {
  res.json({
    server: 'Up'
  });
};

const readiness = (req, res) => {
  const mongoStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  res.json({
    server: 'Up'
  });
};

module.exports = {
  liveness,
  readiness
};
