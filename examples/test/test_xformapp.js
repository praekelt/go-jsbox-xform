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
});
