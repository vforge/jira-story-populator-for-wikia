/* global chrome */
(function () {
    'use strict';

    var JIRAPopulator = function () {
        var
            SUBTASK_TYPE_ID = 5,
            currentUrl = null,
            issueId = null,
            projectKey = null,
            throbberElement = null,


            stopThrobbing = function () {
                throbberElement.style.visibility = 'hidden';
            },

            startThrobbing = function () {
                throbberElement.style.visibility = 'visible';
            },

            addAllSubtasks = function () {
                addCodeReviewSubtask( function() {
                    addTestingSubtask( function() {
                        addDoDSubtask();
                    });
                });   
            },

            addImplementationSubtask = function (callback) {
                addSubTask({
                    name: 'Implement'
                }, callback);
            },

            addCodeReviewSubtask = function (callback) {
                addSubTask({
                    name: 'Code Review'
                }, callback);
            },

            addDoDSubtask = function (callback) {
                addSubTask({
                    name: 'DoD',
                    originalEstimate: "15m"
                }, callback);
            },

            addTestingSubtask = function (callback) {
                addSubTask({
                    name: 'Acceptance Testing'
                }, callback);
            },

            addSubTask = function (params, callback) {
                var xmlHttp = new XMLHttpRequest(),
                    createIssueUrl = 'https://wikia-inc.atlassian.net/rest/api/2/issue/',
                    responseJSON,
                    createSubtaskJSON = {
                        "fields": {
                            "project": {
                                "key": projectKey
                            },
                            "parent": {
                                "key": issueId
                            },
                            "summary": params.name,
                            "issuetype": {
                                "id": SUBTASK_TYPE_ID
                            }
                        }
                    };

                if (params.originalEstimate) {
                    createSubtaskJSON.fields.timetracking = {
                        "originalEstimate": params.originalEstimate
                    };
                }

                var request = JSON.stringify(createSubtaskJSON);
                xmlHttp.open('POST', createIssueUrl, true);
                xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState === 4) {
                        // JSON.parse does not evaluate the attacker's scripts.
                        responseJSON = JSON.parse(xmlHttp.responseText);
                        stopThrobbing();
                        if (callback) {
                           callback();
                        } else {
                           alert('Done!');
                        }
                    }
                };
                console.log(createSubtaskJSON);
                console.log(request);
                startThrobbing();
                xmlHttp.send(request);
            },

            initOnCurrentTab = function (tabs) {
                currentUrl = tabs.shift().url;
                issueId = currentUrl.split('/').pop();
                throbberElement = document.getElementById('throbber');

                var pattern = /^https:\/\/wikia-inc.atlassian.net\/browse\/[A-Z]+-[0-9]+$/,
                    implementationButton = document.getElementById('implementation'),
                    codeReviewButton = document.getElementById('codereview'),
                    dodButton = document.getElementById('dod'),
                    testingButton = document.getElementById('testing'),
                    allButton = document.getElementById('addall'),
                    storyIdSpan = document.getElementById('storyId'),
                    xmlHttp = null,
                    getIssueUrl = null,
                    jsonResponse = null;

                codeReviewButton.disabled = 'disabled';
                dodButton.disabled = 'disabled';
                testingButton.disabled = 'disabled';
                allButton.disabled = 'disabled';

                if (currentUrl.match(pattern) !== null) {
                    // unbind (if bound)
                    implementationButton.removeEventListener('click', addImplementationSubtask);
                    codeReviewButton.removeEventListener('click', addCodeReviewSubtask);
                    dodButton.removeEventListener('click', addDoDSubtask);
                    testingButton.removeEventListener('click', addTestingSubtask);
                    allButton.removeEventListener('click', addAllSubtasks);

                    // rebind
                    implementationButton.addEventListener('click', addImplementationSubtask);
                    codeReviewButton.addEventListener('click', addCodeReviewSubtask);
                    dodButton.addEventListener('click', addDoDSubtask);
                    testingButton.addEventListener('click', addTestingSubtask);
                    allButton.addEventListener('click', addAllSubtasks);

                    getIssueUrl = 'https://wikia-inc.atlassian.net/rest/api/2/issue/' + issueId;
                    xmlHttp = new XMLHttpRequest();
                    xmlHttp.open('get', getIssueUrl, true);
                    xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
                    xmlHttp.onreadystatechange = function () {
                        if (xmlHttp.readyState === 4) {
                            jsonResponse = JSON.parse(xmlHttp.responseText);
                            projectKey = jsonResponse.fields.project.key;

                            storyIdSpan.innerHTML = issueId;
                            implementationButton.disabled = false;
                            codeReviewButton.disabled = false;
                            dodButton.disabled = false;
                            testingButton.disabled = false;
                            allButton.disabled = false;

                            stopThrobbing();
                        }
                    };
                    startThrobbing();
                    xmlHttp.send(null);
                } else {
                    storyIdSpan.innerHTML = '[You are not on a story page]';
                }
            },

            init = function () {
                chrome.tabs.query({active: true}, initOnCurrentTab);
            };

        return {
            init: init,
            initOnCurrentTab: initOnCurrentTab
        };
    };


    document.addEventListener('DOMContentLoaded', function () {
        var JIRAPopulatorInstance = new JIRAPopulator();
        JIRAPopulatorInstance.init();
        chrome.tabs.onActivated.addListener(JIRAPopulatorInstance.init);
        chrome.tabs.onUpdated.addListener(JIRAPopulatorInstance.init);
    });

})();
