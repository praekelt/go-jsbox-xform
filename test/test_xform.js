var _ = require('lodash');
var vumigo = require('vumigo_v02');
var App = vumigo.App;
var AppTester = vumigo.AppTester;
var EndState = vumigo.states.EndState;
var assert = require('assert');

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
            name: 'external server with auth',
            opts: {
                'xform_url': 'http://www.example.org/xform00',
                'xform_url_username': 'testuser',
                'xform_url_password': 'testpass',
                // This should be ignored since xform_url is present
                'xform': 'test xforms data',
            }
        },
        {
            name: 'external server without auth',
            opts: {
                'xform_url': 'http://www.example.org/xform00',
                // This should be ignored since xform_url is present
                'xform': 'test xforms data',
            }
        },
        {
            name: 'config specified xform',
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
                        reply: 'What is your name?',
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

    var error_sources = [
        {
            name: 'external server with auth',
            error_msg: 'custom',
            opts: {
                'xform_url': 'http://www.example.org/xform01',
                'xform_url_username': 'testuser',
                'xform_url_password': 'testpass',
                // This should be ignored since xform_url is present
                'xform': 'test xforms data',
                'xform_error_message': 'custom xform http error message',
            }
        },
        {
            name: 'external server with auth',
            error_msg: 'default',
            opts: {
                'xform_url': 'http://www.example.org/xform01',
                'xform_url_username': 'testuser',
                'xform_url_password': 'testpass',
                // This should be ignored since xform_url is present
                'xform': 'test xforms data',
            }
        },
        {
            name: 'external server without auth',
            error_msg: 'custom',
            opts: {
                'xform_url': 'http://www.example.org/xform01',
                // This should be ignored since xform_url is present
                'xform': 'test xforms data',
                'xform_error_message': 'custom_xform_http_error_message',
            }
        },
        {
            name: 'external server without auth',
            error_msg: 'default',
            opts: {
                'xform_url': 'http://www.example.org/xform01',
                // This should be ignored since xform_url is present
                'xform': 'test xforms data',
            }
        },
    ];

    error_sources.map(function(source){
        describe('When getting the xform from ' + source.name + 
            ' with ' + source.error_msg + ' http error', function() {

            beforeEach(function() {
                app.states.add('states:test', function(name) {
                    var opts = _.clone(tester.data.opts);
                    _.defaults(opts, source.opts);
                    return new XFormState(name, opts);
                });
            });

            it('should respond with the correct error message', function() {
                error_msg = (
                    source.opts.xform_error_message || 
                    'HTTP error in getting form from server');
                return tester
                    .start()
                    .check.interaction({
                        state: 'states:test',
                        reply: error_msg,
                    })
                    .run();
            });

            it('should log the http error', function() {
                return tester
                    .start()
                    .check(function(api) {
                        assert.deepEqual(api.log.error[0], [
                            'HTTP Error in getting XForm',
                        ]);
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
                    opts.xform_service_url = 'http://www.badxforms.org';
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
                        assert.deepEqual(api.log.error[0], [
                            'HTTP Error in connecting to the xforms service'
                        ]);
                    })
                    .run();
            });
        });
    });

    describe('If the contact_namespace parameter is set', function() {
        beforeEach(function() {
            app.states.add('states:test', function(name) {
                var opts = _.clone(tester.data.opts);
                _.defaults(opts, {contact_namespace: 'test_answers'});
                return new XFormState(name, opts);
            });
        });

        it('should save the responses to the contact under that namespace', function() {
            return tester
                .inputs('Jon Snow', '20')
                .check(function(api){
                    var contact = api.contacts.store[0];
                    assert.deepEqual(contact.extra.test_answers,
                        {
                            name: 'Jon Snow',
                            age: '20',
                        }
                    );
                })
                .run();
        });
    });

    describe('If the results_url parameter is set', function() {
        beforeEach(function() {
            app.states.add('states:test', function(name) {
                var opts = _.clone(tester.data.opts);
                _.defaults(opts, {results_url: 'http://www.testanswers.org'});
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
                        "<test>",
                        "   <name>Jon Snow</name>",
                        "   <age>20</age>",
                        "</test>"
                        ].join('\n')
                    );
                })
                .run();
        });
    });
});
