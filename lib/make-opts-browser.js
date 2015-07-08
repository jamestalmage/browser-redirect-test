module.exports = function(method, path) {
  if (arguments.length === 1) {
    path = method;
    method = 'GET';
  }
  return {
    method: method.toUpperCase(),
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    path: path,
    port: parseInt(window.location.port, 10)
  };
};