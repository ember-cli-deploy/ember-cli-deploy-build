/* jshint node: true */
'use strict';

var Promise = require('ember-cli/lib/ext/promise');

var glob  = require('glob');
var chalk = require('chalk');
var blue  = chalk.blue;

module.exports = {
  name: 'ember-cli-deploy-build',

  createDeployPlugin: function(options) {
    function _beginMessage(ui, outputPath) {
      ui.write(blue('|    '));
      ui.writeLine(blue('- building files to `' + outputPath + '`'));

      return Promise.resolve();
    }

    function _successMessage(ui, outputPath) {
      var files = glob.sync('**/**/*', { nonull: false, nodir: true, cwd: outputPath });

      if (files && files.length) {
        files.forEach(function(path) {
          ui.write(blue('|    '));
          ui.writeLine(blue('- built: ' + path));
        });
      }

      ui.write(blue('|    '));
      ui.writeLine(blue('- build ok'));

      return Promise.resolve(files);
    }

    return {
      name: options.name,

      build: function(context) {
        var deployment = context.deployment;
        var ui         = deployment.ui;
        var project    = deployment.project;
        var config     = deployment.config[this.name] || {};

        var outputPath = 'dist';
        var buildEnv   = config.buildEnv || 'production';

        var Builder  = require('ember-cli/lib/models/builder');
        var builder = new Builder({
          ui: ui,
          outputPath: outputPath,
          environment: buildEnv,
          project: project
        });

        return _beginMessage(ui, outputPath)
          .then(builder.build.bind(builder))
          .finally(function() {
            return builder.cleanup();
          })
          .then(_successMessage.bind(this, ui, outputPath))
          .then(function(files) {
            files = files || [];

            return {
              distDir: outputPath,
              distFiles: files
            };
          })
          .catch(function(error) {
            ui.write(blue('|    '));
            ui.writeLine(chalk.red('build failed'));

            return Promise.reject(error);
          });
      }
    }
  }
};
