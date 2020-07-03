/* eslint-disable */
'use strict';
Object.defineProperty (exports, '__esModule', {value: true});
const sinon_1 = require ('sinon');
class default_1 {
  constructor (config, opts) {
    this.showCommandHelp = sinon_1.spy (() => {
      console.log ('hello from test-help-plugin #showCommandHelp in the lib folder and in compiled javascript');
    });
    this.showHelp = sinon_1.spy (() => {
      console.log ('hello showHelp');
    });
    config.showCommandHelpSpy = this.showCommandHelp;
    config.showHelpSpy = this.showHelp;
  }
  command () {
    throw new Error ('not needed for testing @oclif/command');
  }
}
exports.default = default_1;
