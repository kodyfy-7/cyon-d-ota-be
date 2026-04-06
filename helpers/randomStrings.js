const randomString = require("random-string");
const crypto = require('crypto');

const RandomStrings = {};

RandomStrings.generateNumericOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

RandomStrings.generateTag = (prefix, suffix) => {
  let tag = `${prefix}${Math.random().toString(36).substr(2, 6).toUpperCase()}${suffix}`;
  return tag;
};

RandomStrings.generateID = () => {
  return randomString({
    length: 12,
    numeric: true,
    letters: false,
    special: false,
    exclude: ["a", "b", "1"]
  });
};
RandomStrings.randomCharacters = (
  length,
  numeric = true,
  letters = false,
  capitalization = true
) => {
  return randomString({
    length,
    numeric,
    letters,
    capitalization
  });
};
RandomStrings.hashedCharacters = length => {
  return randomString({
    length,
    spec: true
  });
};

module.exports = RandomStrings;
