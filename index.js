/* jshint node: true */
'use strict';

var chalk = require('chalk');
var glob  = require('glob');

module.exports = {
  name: 'ember-cli-deploy-build',

  createDeployPlugin: function(options) {
    function pipelineData(outputPath) {
      var data = {};

      var files = glob.sync(outputPath + '/index.html', { nonull: false });

      if (files && files.length) {
        data.indexPath = files[0];
      }

      files = glob.sync(outputPath + '**/**/*', { nonull: false, ignore: '**/index.html' });

      if (files && files.length) {
        data.assetPaths = files;
      }

      return data;
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
          .then(pipelineData.bind(this, outputPath))
          .catch(function(err) {
            ui.writeLine(chalk.red('Build failed.'));
            ui.writeError(err);

            return 1;
          });
      }
    }
  }
};
