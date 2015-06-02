var sample_xform = require('../../test/fixtures/sample_xform');

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
                url: "http://www.example.org/badxform",
            },
            response: {
                code: "500",
            },
        },
        {
            request: {
                method: "POST",
                url: "prd-vumi-xforms.aws.prk-host.net/forms",
                headers: {
                    "Content-Type": "application/xml"
                },
                body: JSON.stringify(sample_xform),
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
                url: "prd-vumi-xforms.aws.prk-host.net/responses/cc46192a-8aba-43f3-9d4e-8b78486346dc/0",
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
                url: "prd-vumi-xforms.aws.prk-host.net/responses/cc46192a-8aba-43f3-9d4e-8b78486346dc",
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
                // TODO: Find out why it is necessary to stringify
                // or if I'm doing something wrong
                data: JSON.stringify({
                    "id":"cc46192a-8aba-43f3-9d4e-8b78486346dc",
                    "question":"What is your age?",
                    "status":200,
                    "message":"Question completed."
                }),
            },
        },
        {
            request: {
                method: "POST",
                url: "prd-vumi-xforms.aws.prk-host.net/responses/cc46192a-8aba-43f3-9d4e-8b78486346dc",
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
                data: JSON.stringify({
                    "message": "XForm completed.",
                    "status": 200,
                    "id": "cc46192a-8aba-43f3-9d4e-8b78486346dc"
                }),
            },
        },
        {
            request: {
                method: "GET",
                url: "prd-vumi-xforms.aws.prk-host.net/answers/cc46192a-8aba-43f3-9d4e-8b78486346dc",
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
    ];
};
