var vumigo = require('vumigo_v02');
var xforms = require('../../lib');
var XFormState = xforms.XFormState;

var App = vumigo.App;


var XFormApp = App.extend(function(self) {
    App.call(self, 'states:xform');

    self.states.add('states:xform', function(name) {
        return new XFormState(name, {
            next: 'states:end',
        });
    });

   self.states.add('states:end', function(name) {
       return new EndState(name, {
           text: 'Thank you for your submission!',
           next: 'states:xform',
       });
   });
});

vumigo.interact(this.api, XFormApp);
this.XFormApp = XFormApp;
