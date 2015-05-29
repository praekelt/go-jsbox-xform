var _ = require('lodash');
var Q = require('q');

var vumigo = require('vumigo_v02');
var states = vumigo.states;
var State = states.State;
var HttpApi = vumigo.http.api.HttpApi;
var JsonApi = vumigo.http.api.JsonApi;


var XFormState = State.extend(function (self, name, opts) {
    /**class:XformState(name, opts)

    A state which asks a user a series of questions according to a given
    XForm, and stores the answers.

    :param string name:
        name used to identify and refer to the state
    :param boolean opts.continue_session:
        whether or not this is the last state in a session. Defaults to ``true``.
    :param boolean opts.send_reply:
        whether or not a reply should be sent to the user's message. Defaults
        to ``true``.
    :param function_or_string_or_object opts.next:
        The state that the user should visit after this state. May be the name
        of the next state, an options object representing the next state, or a
        function of the form ``f(address)`` returning either. The ``address``
        is the :class:`location.providers.utils.AddressResult` chosen by the
        user or ``null`` if no address was chosen. If ``next`` is ``null`` or
        not defined, the state machine will be left in the current state.
        See :meth:`State.set_next_state`. Defaults to ``null``
    :param string opts.xforms_service_url:
        The URL where the XForms service is located. Defaults to
        ``prd-vumi-xforms.aws.prk-host.net``.
    :param string opts.xforms_service_error_message:
        The error message sent back to the user if the XForms service is
        inaccessable. Defaults to
        ``Error contacting the xforms service``.
    :param string opts.xform:
        The XForm that is processed. Required.
    :param string opts.xform_url:
        The URL to fetch the xform from. If specified, it overrides the
        ``opts.xform`` field. Required if ``opts.xform`` isn't specified.
    :param string opts.xform_url_username:
        The username to use when fetching the XForm from the XForm URL.
        If not specified, no authentication is sent.
    :param string opts.xform_url_password:
        The password to use when fetching the XForm from the XForm URL.
        If not specified, no authentication is sent.
    :param string opts.xform_error_message:
        The error message that is sent to the user if an xform cannot be
        retreived from the XForm URL. Defaults to
        ``Error in getting form from server``.
    :param string opts.contact_namespace:
        The namespace to user when storing the answer data onto the contact
        under extras. If not specified, no data is saved onto the contact.
    :param string opts.results_url:
        The URL to POST the completed XForm to. If not specified, then the
        completed form is not posted.
    :param string opts.result_error_message:
        The error message to display to the user if the form results could not
        be posted. Defaults to ``Error, cannot submit results``.


    Example:

    .. code-block:: javascript

        self.states.add('states:example-xformState', function(name){
            return new XFormState(name, {
                next: "states:end",
                xform_url: "http://www.example.org/myxform.xml",
            });
        });

    */

    // Defaults
    opts = _.defaults(opts || {}, {
        next: null,
        xforms_service_url: 'prd-vumi-xforms.aws.prk-host.net',
        xforms_service_error_message: 'Error contacting the xforms service',
        xform_error_message: 'Error in getting form from server',
        result_error_message: 'Error, cannot submit results',
    });

    State.call(self, name, opts);

    // Store options
    self.next = opts.next;
    self.xforms_service_url = opts.xforms_service_url;
    self.xforms_service_error_message = opts.xforms_service_error_message;
    self.xform = opts.xform;
    self.xform_url = opts.xform_url;
    self.xform_url_username = opts.xform_url_username;
    self.xform_url_password = opts.xform_url_password;
    self.xform_error_message = opts.xform_error_message;
    self.contact_namespace = opts.contact_namespace;
    self.results_url = opts.results_url;
    self.result_error_message = opts.result_error_message;
    

    self.init = function() {
        _.defaults(self.metadata, {xformstate: 'initial'});
        return Q()
            .then(function() {
                return self.im.contacts.for_user();
            })
            .then(function(user_contact) {
                self.contact = user_contact;
            })
            .then(function() {
                if(self.metadata.xformstate === 'initial') {
                    return self.handlers.initial();
                }
            });
    };

    self.on('state:input', function(event) {
        var content = (event.content || "").trim();
        var handler = self.handlers[self.metadata.xformstate];
        handler = handler || self.handlers.default;
        return handler(content);
    });

    self.handlers = {};

    self.handlers.default = function(content) {
        return self.set_next_state(self.next, null);
    };

    self.get_xform = function() {
        if(!self.xform_url) {
            return Q(self.xform);
        }
        // Get the XForm from the URL
        var http;
        if(self.xform_url_username && self.xform_url_password) {
            http = new HttpApi(self.im, {
                auth: {
                    username: self.xform_url_username,
                    password: self.xform_url_password,
                }
            });
        } else {
            http = new HttpApi(self.im);
        }
        return http.get(self.xform_url)
            .then(function(resp) {
                // For some reason this body gets encoded
                // TODO: Look into this to see if it's an HTTP API
                // issue or a fixtures issue.
                return JSON.parse(resp.data);
            }, function(err) {
                return self.im.log.error([
                    "HTTP Error in getting XForm",
                    err.message])
                    .then(function() {
                        self.metadata.display_text = self.xform_error_message;
                        self.metadata.xform_state = null;
                        return false;
                    });
            });
    };

    self.create_xform = function(xform_data) {
        if(!xform_data) {
            return false;
        }
        var http = new HttpApi(self.im, {
            headers: {
                'Content-Type': 'application/xml'
            }
        });
        return http.post(
            self.xforms_service_url + '/forms', {data: xform_data}
            ).then(function(resp) {
                var data = resp.data;
                self.metadata.xform_id = data.id;
                return data.id;
        });
    };

    self.get_first_xform_question = function(xform_id) {
        if(!xform_id) {
            return false;
        }
        var http = new JsonApi(self.im);
        return http.get(
                self.xforms_service_url + '/responses/' + xform_id + '/0')
            .then(function(resp) {
                return resp.data.question;
            });
    };

    self.handlers.initial = function(content) {
        return Q()
            .then(self.get_xform)
            .then(self.create_xform)
            .then(self.get_first_xform_question)
            .then(function(question) {
                if(!question) {
                    return;
                }
                self.metadata.display_text = question;
                self.metadata.xformstate = 'next_question';
                return;
            });
    };

    self.answer_question = function(answer) {
        http = new JsonApi(self.im);
        return http.post(
                self.xforms_service_url + '/responses/' +
                self.metadata.xform_id,
                {
                    data: {
                        'answer': answer,
                    }
                }
            ).then(function(resp) {
                return resp.data.question;
            });
    };

    self.set_next_question = function(question) {
        if(!question) {
            return self.set_next_state(self.next, null);
        }
        self.metadata.display_text = question;
        self.metadata.xformstate = 'next_question';
        return;
    };

    self.handlers.next_question = function(content) {
        return Q(content)
            .then(self.answer_question)
            .then(self.set_next_question);
    };

    self.display = function() {
        return self.metadata.display_text || '';
    };


});

this.XFormState = XFormState;
