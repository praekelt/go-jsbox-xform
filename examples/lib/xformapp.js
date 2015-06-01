var vumigo = require('vumigo_v02');
var xforms = require('../../lib');
var XFormState = xforms.XFormState;

var App = vumigo.App;


var XFormApp = App.extend(function(self) {
    App.call(self, 'states:xform');

    self.states.add('states:xform', function(name) {
        return new XFormState(name, {

        });
    });
});

vumigo.interact(this.api, XFormApp);
this.XFormApp = XFormApp;
