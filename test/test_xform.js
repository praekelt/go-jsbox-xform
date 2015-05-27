var vumigo = require('vumigo_v02');
var App = vumigo.App;
var AppTester = vumigo.AppTester;

var xform = require('../lib');
var XFormState = xform.XFormState;

var fixtures = require('./fixtures');

describe('XFormState', function(){
    var app;
    var tester;

    beforeEach(function(){
        app = new App('states:test');

        tester = new AppTester(app);

        tester.data.opts = {};

        app.states.add('states:test', function(name){
            _.defaults(tester.data.opts, {next:'states:end'});
            return new XFormState(name, tester.data.opts);
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
});
