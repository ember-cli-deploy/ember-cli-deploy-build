/*jshint globalstrict: true*/
'use strict';

var RSVP = require('ember-cli/lib/ext/promise');

var assert  = require('ember-cli/tests/helpers/assert');

describe('build plugin', function() {
  var subject;

  before(function() {
    subject = require('../../index');
  });

  it('has a name', function() {
    var result = subject.createDeployPlugin({
      name: 'test-plugin'
    });

    assert.equal(result.name, 'test-plugin');
  });

  it('implements the correct hooks', function() {
    var result = subject.createDeployPlugin({
      name: 'test-plugin'
    });

    assert.equal(typeof result.configure, 'function');
    assert.equal(typeof result.build, 'function');
  });

  describe('configure hook', function() {
    it('resolves if config is ok', function() {
      var plugin = subject.createDeployPlugin({
        name: 'build'
      });

      var context = {
        deployment: {
          ui: { write: function() {}, writeLine: function() {} },
          config: {
          }
        }
      };
      return assert.isFulfilled(plugin.configure.call(plugin, context));
    });
  });

  describe('build hook', function() {
    var plugin;
    var context;

    beforeEach(function() {
      plugin = subject.createDeployPlugin({
        name: 'build'
      });

      context = {
        redisClient: {
          upload: function() {
            return RSVP.resolve('redis-key');
          }
        },
        tag: 'some-tag',
        deployment: {
          ui: { write: function() {},  writeLine: function() {} },
          project: { name: function() { return 'test-project'; }, addons: [], root: 'tests/dummy' },
          config: {
            build: {
              buildEnv: 'development',
              outputPath: 'tmp/dist-deploy',
            }
          }
        }
      };
    });

    it('builds the app and returns distDir and distFiles', function(done) {
      this.timeout(50000);
      return assert.isFulfilled(plugin.build.call(plugin, context))
        .then(function(result) {
          assert.deepEqual(result, {
            distDir: 'tmp/dist-deploy',
            distFiles: [
               'assets/dummy.css',
               'assets/dummy.js',
               'assets/dummy.map',
               'assets/ember-data.js.map',
               'assets/failed.png',
               'assets/passed.png',
               'assets/test-loader.js',
               'assets/test-support.css',
               'assets/test-support.js',
               'assets/test-support.map',
               'assets/vendor.css',
               'assets/vendor.js',
               'assets/vendor.map',
               'crossdomain.xml',
               'index.html',
               'robots.txt',
               'testem.js',
               'tests/index.html'
            ]
          });
          done();
        }).catch(function(reason){
          console.log(reason.actual.stack);
          done(reason.actual);
        });
    });
  });
});
