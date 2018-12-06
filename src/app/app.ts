import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as alexa from 'alexa-app';
import HelloWorldIntentHandler from '../handler/HelloWorldIntentHandler';
import LaunchIntentHandler from '../handler/LaunchIntentHandler';
import DisplayTestIntentHandler from '../handler/DisplayTestIntentHandler';
import JiraIssueIntentHandler from '../handler/JiraIssueIntentHandler';
import JenkinsBuildsIntentHandler from '../handler/JenkinsBuildsIntentHandler';
import StopIntentHandler from '../handler/StopIntentHandler';
import HelpIntentHandler from '../handler/HelpIntentHandler';
import JiraHelpIntentHandler from '../handler/JiraHelpIntentHandler';
import JiraChartIntentHandler from '../handler/JiraChartIntentHandler';
import SendMailIntentHandler from '../handler/SendMailIntentHandler';
import SlotTestIntentHandler from '../handler/SlotTestIntentHandler';
import TimeoutHandler from '../handler/TimeoutHandler';
import AppState from './state/AppState';
import { Container } from 'typescript-ioc';
import {
    hasDisplaySupport,
    containsDialogDirective,
    isStopIntent,
    excludeDisplayDirectives,
    excludeGameEngineDirectives
} from './appUtils';

dotenv.config();

const appState: AppState = Container.get(AppState);
appState.getEmployeeState().setActive('Doe, John');

const app = express();
app.use(express.static('media-gen'));
app.use((req, res, next) => {
    appState.setHostname(req.hostname);
    return next();
});

const alexaApp = new alexa.app(process.env.ALEXA_SKILL_NAME);
alexaApp.express({
    expressApp: app,
    checkCert: true,
    debug: false
});

alexaApp.post = (request: alexa.request, response: alexa.response, type: string, exception: any) => {
    const responseObj = response.response.response;
    if (!hasDisplaySupport(request)) {
        responseObj.directives = excludeDisplayDirectives(response);
    }

    if (containsDialogDirective(response) || isStopIntent(request)) {
        responseObj.directives = excludeGameEngineDirectives(response);
        return;
    }

    responseObj.directives.push(TimeoutHandler.TIMEOUT_DIRECTIVE);

    // If shouldEndSession is true, set it to undefined to make timeout work.
    // If it is explicitly set to false, do nothing to keep session open.
    if (responseObj.shouldEndSession) {
        response.shouldEndSession(undefined);
    }
};

const jiraIssueIntentHandler: JiraIssueIntentHandler = Container.get(JiraIssueIntentHandler);
const jiraChartIntentHandler: JiraChartIntentHandler = Container.get(JiraChartIntentHandler);
const timeoutHandler: TimeoutHandler = Container.get(TimeoutHandler);

alexaApp.launch(LaunchIntentHandler);

alexaApp.intent('AMAZON.StopIntent', StopIntentHandler);

// 'hilfe'
alexaApp.intent('AMAZON.HelpIntent', HelpIntentHandler);

// 'jira hilfe'
alexaApp.intent('JiraHelpIntent', JiraHelpIntentHandler);

// TODO: add more HelpIntents

// 'hallo'
alexaApp.intent('HelloWorldIntent', HelloWorldIntentHandler);

// 'zeige'
alexaApp.intent('DisplayTestIntent', DisplayTestIntentHandler);

// 'starte informationsaggregator und öffne jira ticket'
alexaApp.intent('JiraIssueIntent', jiraIssueIntentHandler.handle.bind(jiraIssueIntentHandler));

// 'starte informationsaggregator und zeige burndown chart'
alexaApp.intent('JiraChartIntent', jiraChartIntentHandler.handle.bind(jiraChartIntentHandler));

// 'starte informationsaggregator und zeige jenkins status'
alexaApp.intent('JenkinsBuildsIntent', JenkinsBuildsIntentHandler);

// 'starte informationsaggregator und sende eine mail'
alexaApp.intent('SendMailIntent', SendMailIntentHandler);

// 'starte informationsaggregator und teste slots'
alexaApp.intent('SlotTestIntent', SlotTestIntentHandler);

alexaApp.on('GameEngine.InputHandlerEvent', timeoutHandler.handle.bind(timeoutHandler));

app.listen(process.env.ALEXA_APP_PORT, () => console.log(`Listening on port ${process.env.ALEXA_APP_PORT}`));
