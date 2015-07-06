module.exports = function(method, path) {
  return {
    method: method.toUpperCase(),
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    path: path,
    port: parseInt(window.location.port, 10)
  };
};