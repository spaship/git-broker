const liveness = (req, res) => {
  res.json({
    server: 'Up'
  });
};

const readiness = (req, res) => {
  res.json({
    server: 'Up'
  });
};

module.exports = {
  liveness,
  readiness
};
