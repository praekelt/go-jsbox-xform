var vumigo = require('vumigo_v02');
var xforms = require('../../lib');
var crypto = require('crypto');
var XFormState = xforms.XFormState;
var EndState = vumigo.states.EndState;
var HttpApi = vumigo.http.api.HttpApi;

var App = vumigo.App;


var XFormApp = App.extend(function(self) {
    App.call(self, 'states:xform');

    self.get_id = function() {
        return crypto.randomBytes(12).toString('hex');
    };

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

    self.post_results = function(xml) {
        var boundary = self.get_id();
        http = new HttpApi(self.im, {
            auth: {
                username: self.im.config.results_username,
                password: self.im.config.results_password,
            },
            headers: {
                'Expect': '100-continue',
                'Content-Type': 'multipart/form-data; boundary=' + boundary,
            }
        });
        return http.post(self.im.config.results_url, {
            data: [
                '--' + boundary,
                'Content-Disposition: form-data; name="xml_submission_file"',
                'Content-Type: application/xml',
                '',
                xml,
                '',
                '--' + boundary + '--',
               ].join('\n')
        }).then(function(resp) {
            return 'states:end';
        }, function(err) {
            return self.im.log.error([
                "HTTP error in submitting xform",
                err]);
        });
    };

    self.states.add('states:xform', function(name) {
        return new XFormState(name, {
            xform: self.get_xform,
            next: self.post_results,
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
