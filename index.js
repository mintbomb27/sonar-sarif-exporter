const core = require('@actions/core');
const fs = require('fs');

function convertToSarif(sonarqubeData) {
    const sarifResult = {
        $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
        version: '2.1.0',
        runs: [
            {
                tool: {
                    driver: {
                        name: 'SonarQube',
                        version: '1.0.0'
                    }
                },
                results: []
            }
        ]
    };

    sonarqubeData.issues.forEach((issue) => {
        sarifResult.runs[0].results.push({
            ruleId: issue.rule,
            message: {
                text: issue.message
            },
            locations: [
                {
                    physicalLocation: {
                        artifactLocation: {
                            uri: issue.component.split(':')[1]
                        },
                        region: {
                            startLine: issue.line,
                            startColumn: issue.textRange.startOffset+1,
                            endColumn: issue.textRange.endOffset+1
                        }
                    }
                }
            ],
            properties: {
                severity: issue.severity,
                status: issue.status
            }
        });
    });

    return sarifResult;
}

const SONAR_URL = core.getInput("SONAR_URL");
const SONAR_TOKEN = core.getInput("SONAR_TOKEN");
fetch(`${SONAR_URL}/api/issues/search`, {
    method: "GET",
    headers: {
        "Authorization": `Bearer ${SONAR_TOKEN}`
    }
}).then(response => response.json())
.then((response) => {
    console.log(response);
    let sarifOutput = convertToSarif(response);
    fs.writeFileSync('output.sarif', JSON.stringify(sarifOutput, null, 2));
}).catch((error) => {
    core.setFailed(error.message);
});