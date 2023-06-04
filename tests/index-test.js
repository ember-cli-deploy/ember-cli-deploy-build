/*eslint-env node*/
'use strict';

var path = require('path');
var chai  = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var assert = chai.assert;
var Project  = require('ember-cli/lib/models/project');

describe('build plugin', function() {
  var subject, mockUi, config;

  beforeEach(function() {
    subject = require('../index');
    mockUi = {
      messages: [],
      verbose: true,
      spinner: {},
      startProgress: function() { },
      stopProgress: function() { },
      write: function() { },
      writeLine: function(message) {
        this.messages.push(message);
      },
      writeError: function(message) {
        this.messages.push(message);
      },
      writeDeprecateLine: function(message) {
        this.messages.push(message);
      },
      writeWarnLine: function(message) {
        this.messages.push(message);
      }
    };
  });

  it('has a name', function() {
    var plugin = subject.createDeployPlugin({
      name: 'test-plugin'
    });

    assert.equal(plugin.name, 'test-plugin');
  });

  it('implements the correct hooks', function() {
    var plugin = subject.createDeployPlugin({
      name: 'test-plugin'
    });

    assert.equal(typeof plugin.configure, 'function');
    assert.equal(typeof plugin.build, 'function');
  });

  describe('configure hook', function() {
    var plugin, context;
    describe('without providing config', function () {
      beforeEach(function() {
        config = { };
        plugin = subject.createDeployPlugin({
          name: 'build'
        });
        context = {
          ui: mockUi,
          config: config
        };
        plugin.beforeHook(context);
      });
      it('warns about missing optional config', function() {
        plugin.configure(context);
        var messages = mockUi.messages.reduce(function(previous, current) {
          if (/- Missing config:\s.*, using default:\s/.test(current)) {
            previous.push(current);
          }

          return previous;
        }, []);

        assert.equal(messages.length, 2);
      });

      it('adds default config to the config object', function() {
        plugin.configure(context);
        assert.isDefined(config.build.environment);
        assert.isDefined(config.build.outputPath);
      });
    });

    describe('with a build environment and outputPath provided', function () {
      beforeEach(function() {
        config = {
          build: {
            environment: 'development',
            outputPath: 'tmp/dist-deploy'
          }
        };
        plugin = subject.createDeployPlugin({
          name: 'build'
        });
        context = {
          ui: mockUi,
          config: config
        };
        plugin.beforeHook(context);
      });
      it('does not warn about missing optional config', function() {
        plugin.configure(context);
        var messages = mockUi.messages.reduce(function(previous, current) {
          if (/- Missing config:\s.*, using default:\s/.test(current)) {
            previous.push(current);
          }

          return previous;
        }, []);
        assert.equal(messages.length, 0);
      });
    });
  });

  describe('build hook', function() {
    var plugin, context;

    beforeEach(function() {
      plugin = subject.createDeployPlugin({
        name: 'build'
      });
      var mockCli = {
        root: path.resolve(__dirname, '..')
      };
      context = {
        ui: mockUi,
        project: Project.projectOrnullProject(mockUi, mockCli),
        config: {
          build: {
            buildEnv: 'development',
            outputPath: 'tmp/dist-deploy',
          }
        }
      };
      plugin.beforeHook(context);
    });

    afterEach(function() {
      delete process.env.EMBER_CLI_DEPLOY_REUSE_BUILD;
    });


    it('builds the app and resolves with distDir and distFiles', function(done) {
      this.timeout(50000);

      var willInterruptProcess = require('ember-cli/lib/utilities/will-interrupt-process');
      willInterruptProcess.capture(process);

      assert.isFulfilled(plugin.build(context))
        .then(function(result) {
          assert.deepEqual(result, {
            distDir: 'tmp/dist-deploy',
            distFiles: [
              'testem.js',
              'robots.txt',
              'index.html',
              'tests/index.html',
              'assets/vendor.map',
              'assets/vendor.js',
              'assets/vendor.css',
              'assets/tests.map',
              'assets/tests.js',
              'assets/test-support.map',
              'assets/test-support.js',
              'assets/dummy.map',
              'assets/dummy.js',
              'assets/dummy.css',
            ]
          });
          done();
        }).catch(function(reason){
          done(reason);
        });
    });

    it('can reuse build results and resolve with distDir and distFiles', function(done) {
      process.env.EMBER_CLI_DEPLOY_REUSE_BUILD = 'true';
      context.config.build.outputPath = __dirname + '/fixtures/fake-build-output';

      assert.isFulfilled(plugin.build(context))
        .then(function(result) {
          assert.deepEqual(result, {
            distDir: __dirname + '/fixtures/fake-build-output',
            distFiles: [
              'top-file-example.js',
              'assets/inner-example.css'
            ]
          });
          done();
        }).catch(function(reason){
          done(reason);
        });
    });

  });
});
