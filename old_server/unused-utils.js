const { sign, verify } = require('jsonwebtoken');
const KEY = 'authsecret';

function createJSONToken(email, password) {
  return sign({ email, password }, KEY);  
}
  
function validateJSONToken(token) {
return verify(token, KEY);
}

exports.createJSONToken = createJSONToken;
exports.validateJSONToken = validateJSONToken;  