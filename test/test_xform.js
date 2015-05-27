var _ = require('lodash');
var vumigo = require('vumigo_v02');
var App = vumigo.App;
var AppTester = vumigo.AppTester;
var EndState = vumigo.states.EndState;

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
        _.defaults(tester.data.opts, {next:'states:end'});

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
});
