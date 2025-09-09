// server/lib/entitlements.js
module.exports = function getEntitlements(plan, frequency) {
  return { plan, frequency, features: ['telemedicina', 'asistencia'] };
};
