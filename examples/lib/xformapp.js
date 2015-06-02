var vumigo = require('vumigo_v02');
var xforms = require('../../lib');
var XFormState = xforms.XFormState;
var EndState = vumigo.states.EndState;
var HttpApi = vumigo.http.api.HttpApi;

var App = vumigo.App;


var XFormApp = App.extend(function(self) {
    App.call(self, 'states:xform');

    self.get_xform = function() {
        http = new HttpApi(self.im);
        return http.get(self.im.config.xform_url)
            .then(function(resp) {
                return resp.data;
            }, function(err) {
                return self.im.log.error([
                    "HTTP error in getting xform",
                    err]);
            });
    };

    self.states.add('states:xform', function(name) {
        return new XFormState(name, {
            xform: self.get_xform,
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
