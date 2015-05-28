var sample_xform = require('./sample_xform');
var vumigo = require('vumigo_v02');
var basic_auth = vumigo.utils.basic_auth;

module.exports = function() {
    return [
        {
            request: {
                method: "GET",
                url: "http://www.example.org/xform00",
            },
            response: {
                code: "200",
                data: sample_xform,
            },
        },
        {
            request: {
                method: "GET",
                url: "https://www.example.org/xform00",
                headers: {
                    Authorization: basic_auth('testuser', 'testpass')
                },
            },
            response: {
                code: "200",
                data: sample_xform,
            },
        },
        {
            request: {
                method: "GET",
                url: "http://www.example.org/xform01",
            },
            response: {
                code: "500",
                data: 'Server error',
            },
        },
        {
            request: {
                method: "GET",
                url: "https://www.example.org/xform01",
                headers: {
                    Authorization: basic_auth('testuser', 'testpass')
                },
            },
            response: {
                code: "500",
                data: 'Server error',
            },
        },
        {
            request: {
                method: "POST",
                url: "http://www.xforms.org/forms",
                headers: {
                    "Content-Type": "application/xml"
                },
                body: sample_xform,
            },
            response: {
                code: "201",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    "message": "Created XForm.",
                    "status": 201,
                    "id": "cc46192a-8aba-43f3-9d4e-8b78486346dc"
                },
            },
        },
        {
            request: {
                method: "GET",
                url: "http://www.xforms.org/responses/cc46192a-8aba-43f3-9d4e-8b78486346dc/0",
            },
            response: {
                code: "200",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    "message": "Question retrieved successfully.",
                    "status": 200,
                    "question": "What is your name?",
                    "id": "cc46192a-8aba-43f3-9d4e-8b78486346dc"
                },
            },
        },
        {
            request: {
                method: "POST",
                url: "http://www.xforms.org/responses/cc46192a-8aba-43f3-9d4e-8b78486346dc",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    answer: "Jon Snow",
                },
            },
            response: {
                code: "200",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    "id":"cc46192a-8aba-43f3-9d4e-8b78486346dc",
                    "question":"What is your age?",
                    "status":200,
                    "message":"Question completed."
                },
            },
        },
        {
            request: {
                method: "POST",
                url: "http://www.xforms.org/responses/cc46192a-8aba-43f3-9d4e-8b78486346dc",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    answer: "20",
                },
            },
            response: {
                code: "200",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    "message": "XForm completed.",
                    "status": 200,
                    "id": "cc46192a-8aba-43f3-9d4e-8b78486346dc"
                },
            },
        },
        {
            request: {
                method: "GET",
                url: "http://www.xforms.org/answers/cc46192a-8aba-43f3-9d4e-8b78486346dc",
            },
            response: {
                code: "200",
                headers: {
                    "Content-Type": "application/xml",
                },
                data: "<?xml version='1.0' ?><test id=\"test\" version=\"201505270916\"><formhub><uuid /></formhub><name>Jon Snow</name><age>20</age><meta><instanceID /></meta></test>",
            },
        },
        {
            request: {
                method: "POST",
                url: "http://www.badxforms.org/forms",
                headers: {
                    "Content-Type": "application/xml"
                },
                data: sample_xform,
            },
            response: {
                code: "400",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    "status": 400,
                    "message": "An error occurred while attempting to save the provided XForm. Please ensure the XML you provided is well-formed and valid.",
                },
            },
        },
        {
            request: {
                method: "POST",
                url: "http://www.testanswers.org",
                headers: {
                    "Content-Type": "application/xml"
                },
                data: "<?xml version='1.0' ?><test id=\"test\" version=\"201505270916\"><formhub><uuid /></formhub><name>Jon Snow</name><age>20</age><meta><instanceID /></meta></test>",
            },
            response: {
                code: "200",
            },
        },
        {
            request: {
                method: "POST",
                url: "http://www.badtestanswers.org",
                headers: {
                    "Content-Type": "application/xml"
                },
                data: "<?xml version='1.0' ?><test id=\"test\" version=\"201505270916\"><formhub><uuid /></formhub><name>Jon Snow</name><age>20</age><meta><instanceID /></meta></test>",
            },
            response: {
                code: "400",
            },
        },
    ];
};
