/* jshint node: true */
'use strict';

var Promise = require('ember-cli/lib/ext/promise');
var glob  = require('glob');
var DeployPluginBase = require('ember-cli-deploy-plugin');
var path = require('path');

module.exports = {
  name: 'ember-cli-deploy-build',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        environment: 'production',
        outputPath: 'tmp' + path.sep + 'deploy-dist',
        distDir: function(context) {
          return context.distDir;
        }
      },

      setup: function() {
        var outputPath = this.readConfig('outputPath');
        return {
          distDir: outputPath
        };
      },

      build: function(/* context */) {
        var self       = this;
        var distDir    = this.readConfig('distDir');
        var buildEnv   = this.readConfig('environment');

        var Builder  = this.project.require('ember-cli/lib/models/builder');
        var builder = new Builder({
          ui: this.ui,
          outputPath: distDir,
          environment: buildEnv,
          project: this.project
        });

        this.log('building app to `' + distDir + '` using buildEnv `' + buildEnv + '`...', { verbose: true });
        return builder.build()
          .finally(function() {
            return builder.cleanup();
          })
          .then(this._logSuccess.bind(this, distDir))
          .then(function(files) {
            files = files || [];

            return {
              distFiles: files
            };
          })
          .catch(function(error) {
            self.log('build failed', { color: 'red' });
            return Promise.reject(error);
          });
      },
      _logSuccess: function(outputPath) {
        var self = this;
        var files = glob.sync('**/**/*', { nonull: false, nodir: true, cwd: outputPath });

        if (files && files.length) {
          files.forEach(function(path) {
            self.log('✔  ' + path, { verbose: true });
          });
        }
        self.log('build ok', { verbose: true });

        return Promise.resolve(files);
      }
    });
    return new DeployPlugin();
  }
};
