/* jshint node: true */
'use strict';

var chalk = require('chalk');
var glob  = require('glob');

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
          .then(function() {
            var files = glob.sync(outputPath + '/index.html', { nonull: false });

            if (files && files.length) {
              context.data.indexPath = files[0];
            }

            files = glob.sync(outputPath + '**/**/*', { nonull: false, ignore: '**/index.html' });

            if (files && files.length) {
              context.data.assetPaths = files;
            }
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
