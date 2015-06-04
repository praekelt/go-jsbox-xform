var _ = require('lodash');
var Q = require('q');

var vumigo = require('vumigo_v02');
var states = vumigo.states;
var State = states.State;
var HttpApi = vumigo.http.api.HttpApi;
var JsonApi = vumigo.http.api.JsonApi;
var BaseError = vumigo.utils.BaseError;

var XFormStateError = BaseError.extend(function(self, message) {
    self.name = 'XFormStateError';
    self.message = message;
});


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
        function of the form ``f(xform)`` returning either. The ``xform``
        is the completed xform. If ``next`` is ``null`` or  not defined, the
        state machine will be left in the current state. Defaults to ``null``.
    :param string opts.xforms_service_url:
        The URL where the XForms service is located. Defaults to
        ``prd-vumi-xforms.aws.prk-host.net``.
    :param string opts.xforms_service_error_message:
        The error message sent back to the user if the XForms service is
        inaccessable. Defaults to
        ``Error contacting the xforms service``.
    :param string_or_function_or_promise opts.xform:
        Must either be a string containing the xform, or a function that
        returns a string containing the xform, or a promise that returns with
        the xform. Required.


    Example:

    .. code-block:: javascript

        self.states.add('states:example-xformState', function(name){
            return new XFormState(name, {
                xform: "<?xml ...",
                next: function(result) {
                    do_something_with_result(result);
                    return "states:end";
                    },
            });
        });

    */

    // Defaults
    opts = _.defaults(opts || {}, {
        next: null,
        xforms_service_url: 'prd-vumi-xforms.aws.prk-host.net',
        xforms_service_error_message: 'Error contacting the xforms service',
    });

    State.call(self, name, opts);

    // Store options
    self.next = opts.next;
    self.xforms_service_url = opts.xforms_service_url;
    self.xforms_service_error_message = opts.xforms_service_error_message;

    if(opts.xform !== undefined) {
        self.xform = opts.xform;
    } else {
        throw new XFormStateError("opts.xform must be defined for XFormState");
    }

    self.init = function() {
        _.defaults(self.metadata, {xformstate: 'initial'});
        if(self.metadata.xformstate === 'initial') {
            return self.handlers.initial();
        }
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

    self.create_xform = function(xform_data) {
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
        }, function(err) {
            return self.im.log.error([
                "HTTP Error in connecting to the xforms service",
                err.message])
                .then(function() {
                    self.metadata.display_text = self.xforms_service_error_message;
                    self.metadata.xforms_state = null;
                    return false;
                });
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
            }, function(err) {
            return self.im.log.error([
                "HTTP Error in connecting to the xforms service",
                err.message])
                .then(function() {
                    self.metadata.display_text = self.xforms_service_error_message;
                    self.metadata.xforms_state = null;
                    return false;
                });
        });
    };

    self.handlers.initial = function(content) {
        if(typeof(self.xform) === 'function') {
            self.xform = self.xform();
        }
        return Q(self.xform)
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
            }, function(err) {
            return self.im.log.error([
                "HTTP Error in connecting to the xforms service",
                err.message])
                .then(function() {
                    self.metadata.display_text = self.xforms_service_error_message;
                    self.metadata.xforms_state = null;
                    return false;
                });
        });
    };

    self.set_next_question = function(question) {
        if(question === false) {
            return;
        }
        if(!question) {
            return self.get_responses()
                .then(function(responses) {
                    return self.set_next_state(self.next, responses);
                });
        }
        self.metadata.display_text = question;
        self.metadata.xformstate = 'next_question';
        return;
    };

    self.get_responses = function() {
        var http = new HttpApi(self.im);
        return http.get(
            self.xforms_service_url + '/answers/' + self.metadata.xform_id)
            .then(function(resp) {
                return resp.data;
            });
    };

    self.handlers.next_question = function(content) {
        return Q(content)
            .then(self.answer_question)
            .then(self.set_next_question);
    };

    self.display = function() {
        return self.metadata.display_text;
    };


});

this.XFormState = XFormState;
this.XFormStateError = XFormStateError;
