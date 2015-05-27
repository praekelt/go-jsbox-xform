var sample_xform = require('./sample_xform');

module.exports = function() {
    return [
        {
            request: {
                method: "GET",
                url: "http://www.example.org/xform00",
                params: {},
            },
            response: {
                code: "200",
                data: sample_xform,
            },
        },
    ];
};
