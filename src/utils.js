const fs = require("fs");

function testFileExists(fileName) {
  try {
    fs.accessSync(fileName, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  testFileExists,
};
