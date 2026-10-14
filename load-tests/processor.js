module.exports = {
  extractToken: extractToken,
  logError: logError,
  setNextCursor: setNextCursor
};

// Extracts the JWT from login response
function extractToken(requestParams, response, context, ee, next) {
  if (response.statusCode === 200) {
    try {
      const body = JSON.parse(response.body);
      if (body.data && body.data.token) {
        context.vars.token = body.data.token;
      }
    } catch (e) {
      // Ignored
    }
  }
  return next();
}

// Logs errors if status code is not 2xx
function logError(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.error(`[Error] ${requestParams.method} ${requestParams.url} - Status: ${response.statusCode}`);
    try {
      const body = JSON.parse(response.body);
      console.error(body);
    } catch(e) {
      console.error(response.body);
    }
  }
  return next();
}

// Extracts next cursor for pagination tests
function setNextCursor(requestParams, response, context, ee, next) {
  if (response.statusCode === 200) {
    try {
      const body = JSON.parse(response.body);
      if (body.data && body.data.nextCursor) {
        context.vars.cursor = body.data.nextCursor;
      } else {
        context.vars.cursor = null;
      }
    } catch (e) {
      context.vars.cursor = null;
    }
  }
  return next();
}
