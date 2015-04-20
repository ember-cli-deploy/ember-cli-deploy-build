/* jshint node: true */
'use strict';

var chalk = require('chalk');

module.exports = {
  name: 'ember-cli-deploy-build',

  createDeployPlugin: function(options) {
    return {
      name: options.name,

      build: function(context) {
        var config  = context.config.rawConfig.build;
        var ui      = context.ui;
        var project = context.project;

        var outputPath = 'dist';
        var buildEnv   = config.buildEnv;

        ui.startProgress(chalk.green('Building'), chalk.green('.'));

        var Builder  = require('ember-cli/lib/models/builder');
        var builder = new Builder({
          ui: ui,
          outputPath: outputPath,
          environment: buildEnv,
          project: project
        });

        return builder.build()
          .finally(function() {
            ui.stopProgress();
            return builder.cleanup();
          })
          .then(function() {
            ui.writeLine(chalk.green('Built project successfully. Stored in "' +
              outputPath + '".'));
          })
          .catch(function(err) {
            ui.writeLine(chalk.red('Build failed.'));
            ui.writeError(err);

            return 1;
          });
      }
    }
  }
};
