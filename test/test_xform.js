var _ = require('lodash');
var vumigo = require('vumigo_v02');
var App = vumigo.App;
var AppTester = vumigo.AppTester;
var EndState = vumigo.states.EndState;
var assert = require('assert');
var Q = require('q');

var xform = require('../lib');
var XFormState = xform.XFormState;

var fixtures = require('./fixtures');
var test_xform = require('./fixtures/sample_xform');

describe('XFormState', function(){
    var app;
    var tester;

    beforeEach(function(){
        app = new App('states:test');

        tester = new AppTester(app);

        tester.data.opts = {};
        _.defaults(tester.data.opts, {
            next: 'states:end',
            xforms_service_url: 'http://www.xforms.org'
        });

        app.states.add('states:end', function(name) {
            return new EndState(name, {
                text: 'This is the end state.'
            });
        });

        tester
            .setup.config.app({
                name: 'xform-state-tester'
            })
            .setup(function(api){
                fixtures().forEach(api.http.fixtures.add);
            });
    });

    var sources = [
        {
            name: 'function',
            opts: {
                'xform': function() {
                    return test_xform;
                },
            }
        },
        {
            name: 'promise',
            opts: {
                'xform': Q().then(function() {
                    return test_xform;
                }),
            }
        },
        {
            name: 'string',
            opts: {
                'xform': test_xform
            }
        }
    ];

    sources.map(function(source){
        describe('When getting the xform from ' + source.name, function() {
            beforeEach(function() {
                app.states.add('states:test', function(name) {
                    var opts = _.clone(tester.data.opts);
                    _.defaults(opts, source.opts);
                    return new XFormState(name, opts);
                });
            });

            it('should ask the first question from the xform', function() {
                return tester
                    .start()
                    .check.interaction({
                        state: 'states:test',
                        reply: 'What is your name?',
                    })
                    .run();
            });

            it('should ask the second question after answering the first', function() {
                return tester
                    .inputs('Jon Snow')
                    .check.interaction({
                        state: 'states:test',
                        reply: 'What is your age?',
                    })
                    .run();
            });

            it('should show the end screen after answering both questions', function() {
                return tester
                    .inputs('Jon Snow', '20')
                    .check.interaction({
                        state: 'states:end',
                        reply: 'This is the end state.',
                    })
                    .run();
            });
        });

    });

    var xform_service_error_sources = [
        {
            error_msg: 'custom',
            opts: {
                'xform': test_xform,
                'xforms_service_error_message': "Custom error message",
            }
        },
        {
            error_msg: 'default',
            opts: {
                'xform': test_xform,
            }
        }
    ];

    xform_service_error_sources.map(function(source){
        describe('When connecting to the xforms service with ' +
            source.error_msg + ' http error', function() {

            beforeEach(function() {
                app.states.add('states:test', function(name) {
                    var opts = _.clone(tester.data.opts);
                    _.defaults(opts, source.opts);
                    opts.xforms_service_url = 'http://www.badxforms.org';
                    return new XFormState(name, opts);
                });
            });


            it('should respond with the correct error message', function() {
                var message = (
                    source.opts.xforms_service_error_message ||
                    'Error contacting the xforms service');
                return tester
                    .start()
                    .check.interaction({
                        state: 'states:test',
                        reply: message,
                    })
                    .run();
            });

            it('should log the http error', function() {
                return tester
                    .start()
                    .check(function(api) {
                        assert.deepEqual(api.log.error[0][0], 
                            'HTTP Error in connecting to the xforms service'
                        );
                    })
                    .run();
            });
        });
    });

    describe('If the contact_namespace parameter is set', function() {
        beforeEach(function() {
            app.states.add('states:test', function(name) {
                var opts = _.clone(tester.data.opts);
                _.defaults(opts, {
                    contact_namespace: 'test_answers',
                    xform: test_xform,
                });
                return new XFormState(name, opts);
            });
        });

        it('should save the responses to the contact under that namespace', function() {
            return tester
                .inputs('Jon Snow', '20')
                .check(function(api){
                    var contact = api.contacts.store[0];
                    assert.deepEqual(JSON.parse(contact.extra.test_answers), [
                        "<?xml version='1.0' ?>",
                        "<test id=\"test\" version=\"201505270916\"><formhub>",
                        "<uuid /></formhub><name>Jon Snow</name><age>20</age>",
                        "<meta><instanceID /></meta></test>"
                        ].join('')
                    );
                })
                .run();
        });
    });

    describe('If the results_url parameter is set', function() {
        beforeEach(function() {
            app.states.add('states:test', function(name) {
                var opts = _.clone(tester.data.opts);
                _.defaults(opts, {
                    results_url: 'http://www.testanswers.org',
                    xform: test_xform,
                });
                return new XFormState(name, opts);
            });
        });

        it('should send the xform response to the specified URL', function() {
            return tester
                .inputs('Jon Snow', '20')
                .check(function(api){
                    http_request = api.http.requests.slice(-1)[0];
                    assert.equal(http_request.method, "POST");
                    assert.deepEqual(http_request.data, [
                        "<?xml version='1.0' ?>",
                        "<test id=\"test\" version=\"201505270916\"><formhub>",
                        "<uuid /></formhub><name>Jon Snow</name><age>20</age>",
                        "<meta><instanceID /></meta></test>"
                        ].join('')
                    );
                })
                .run();
        });
    });

    var result_error_sources = [
        {
            error_msg: 'custom',
            opts: {
                'xform': test_xform,
                'result_error_message': "Result custom error message",
                'results_url': 'http://www.badtestanswers.org',
            }
        },
        {
            error_msg: 'default',
            opts: {
                'xform': test_xform,
                'results_url': 'http://www.badtestanswers.org',
            }
        }
    ];

    result_error_sources.map(function(source){
        describe('If the results url is down with ' +
            source.error_msg + ' error message', function() {

            beforeEach(function() {
                app.states.add('states:test', function(name) {
                    var opts = _.clone(tester.data.opts);
                    _.defaults(opts, source.opts);
                    return new XFormState(name, opts);
                });
            });


            it('should respond with the correct error message', function() {
                var message = (
                    source.opts.result_error_message ||
                    'Error, cannot submit results');
                return tester
                    .inputs('Jon Snow', '20')
                    .check.interaction({
                        state: 'states:test',
                        reply: message,
                    })
                    .run();
            });

            it('should log the HTTP error', function() {
                return tester
                    .inputs('Jon Snow', '20')
                    .check(function(api) {
                        assert.deepEqual(api.log.error[0][0], 
                            'HTTP Error in submitting results'
                        );
                    })
                    .run();
            });
        });
    });

});
