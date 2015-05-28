var _ = require('lodash');

var vumigo = require('vumigo_v02');
var states = vumigo.states;
var State = states.State;


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
        return self.set_next_state(self.next, null);
    };


});

this.XFormState = XFormState;
