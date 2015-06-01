var vumigo = require('vumigo_v02');
var AppTester = vumigo.AppTester;
var XFormApp = require('../lib/xformapp').XFormApp;
var fixtures = require('./fixtures');


describe('XForm example app', function() {
    var app;
    var tester;

    beforeEach(function() {
        app = new XFormApp();
        tester = new AppTester(app);

        return tester
            .setup.config.app({
                name: 'test_xform_app',
            })
            .setup(function(api) {
                fixtures().forEach(function(fixture) {
                    api.http.fixtures.add(fixture);
                });
            });
    });

    describe('When the user starts a session', function() {
        it('should ask them the first question', function() {
            return tester
                .start()
                .check.interaction({
                    state: 'states:xform',
                    reply: 'What is your name?',
                })
                .run();
        });
    });

    describe('When the first question is answered', function() {
        it('should ask the second question', function() {
            return tester
                .inputs('Jon Snow')
                .check.interaction({
                    state: 'states:xform',
                    reply: 'What is your age?',
                })
                .run();
        });
    });

    describe('When the second question is answered', function() {
        it('should display the success message', function() {
            return tester
                .inputs('Jon Snow', '23')
                .check.interaction({
                    state: 'states:end',
                    reply: 'Thank you for your submission!',
                })
                .run();
        });

        it('should submit the answers to the the server', function() {
            return tester
                .inputs('Jon Snow', '23')
                .check(function(api) {
                    http_request = api.http.requests.slice(-1)[0];
                    assertNotEqual(http.request.data.indexOf('Jon Snow', -1));
                    assertNotEqual(http.request.data.indexOf('23', -1));
                })
                .run();
        });

    });
});
