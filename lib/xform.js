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

    Example:

    .. code-block:: javascript

        self.states.add('states:example-xformState', function(name){
            return new XFormState(name, {
                next: "states:end",
            });
        });

    */

    // Defaults
    opts = _.defaults(opts || {}, {
        next:null,
    });

    State.call(self, name, opts);

    // Store options
    self.next = opts.next;

    self.init = function() {
        return self.set_next_state(self.next, null);
    };


});

this.XFormState = XFormState;
