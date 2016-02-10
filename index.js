/* jshint node: true */
'use strict';

var Promise = require('ember-cli/lib/ext/promise');
var glob  = require('glob');
var DeployPluginBase = require('ember-cli-deploy-plugin');
var path = require('path');
var fs = require('fs');

module.exports = {
  name: 'ember-cli-deploy-build',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        environment: 'production',
        outputPath: 'tmp' + path.sep + 'deploy-dist'
      },

      willBuild: function() {
        var outputPath = this.readConfig('outputPath');
        this._deleteDistFolder(outputPath);
      },

      build: function(context) {
        var self       = this;
        var outputPath = this.readConfig('outputPath');
        var buildEnv   = this.readConfig('environment');

        var Builder  = this.project.require('ember-cli/lib/models/builder');
        var builder = new Builder({
          ui: this.ui,
          outputPath: outputPath,
          environment: buildEnv,
          project: this.project
        });

        this.log('building app to `' + outputPath + '` using buildEnv `' + buildEnv + '`...', { verbose: true });
        return builder.build()
          .finally(function() {
            return builder.cleanup();
          })
          .then(this._logSuccess.bind(this, outputPath))
          .then(function(files) {
            files = files || [];

            return {
              distDir: outputPath,
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
      },
      _deleteDistFolder: function(outputPath) {
        var self = this;

        try {
         if (fs.statSync(outputPath)) {
           self.log('Deleting dist folder ' + outputPath, { verbose: true });

           fs.readdirSync(outputPath).forEach(function(file /*, index*/) {
             var currentPath = path.join(outputPath, file);
             if (fs.lstatSync(currentPath).isDirectory()) {
               self._deleteDistFolder(currentPath);
             } else {
               fs.unlinkSync(currentPath);
             }
           });
           fs.rmdirSync(outputPath);
         }
       } catch (e) {
          // no such file or directory - skip
       }
     }
    });
    return new DeployPlugin();
  }
};
