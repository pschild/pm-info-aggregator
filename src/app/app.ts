// tslint:disable-next-line:no-var-requires
require('module-alias/register');
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as alexa from 'alexa-app';
import LaunchIntentHandler from '../handler/builtin/LaunchIntentHandler';
import StopIntentHandler from '../handler/builtin/StopIntentHandler';
import HelpIntentHandler from '../handler/builtin/HelpIntentHandler';
import JiraIssueIntentHandler from '../handler/jira/JiraIssueIntentHandler';
import JiraChartIntentHandler from '../handler/jira/JiraChartIntentHandler';
import JiraHelpIntentHandler from '../handler/jira/JiraHelpIntentHandler';
import JiraSearchIssuesIntentHandler from '../handler/jira/JiraSearchIssuesIntentHandler';
import DisplayTestIntentHandler from '../handler/DisplayTestIntentHandler';
import JenkinsBuildsIntentHandler from '../handler/jenkins/JenkinsBuildsIntentHandler';
import SendMailIntentHandler from '../handler/SendMailIntentHandler';
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
import AggregateIntentHandler from '../handler/AggregateIntentHandler';
import ProjectDashboardIntentHandler from '../handler/ProjectDashboardIntentHandler';
import JiraXrayStatusIntentHandler from '../handler/jira/JiraXrayStatusIntentHandler';
import TestIntentHandler from '../handler/TestIntentHandler';
import JiraChangeIssueStatusIntentHandler from '../handler/jira/JiraChangeIssueStatusIntentHandler';
import JiraVelocityIntentHandler from '../handler/jira/JiraVelocityIntentHandler';

dotenv.config();

const appState: AppState = Container.get(AppState);

const app = express();
app.use('/static', express.static('media-static'));
app.use(express.static('media-gen'));
app.use((req, res, next) => {
    appState.setHostname(req.hostname);
    return next();
});

app.get('/playground', (req, res) => {
    const testIntentHandler: TestIntentHandler = Container.get(TestIntentHandler);
    testIntentHandler.handle(req, res).then((x) => {
        res.send('<img src="' + x + '"/>');
    });
});

const alexaApp = new alexa.app(process.env.ALEXA_SKILL_NAME);
alexaApp.express({
    expressApp: app,
    checkCert: true,
    debug: false
});

alexaApp.error = (exception, request, response) => {
    if (exception.directives) {
        exception.directives.map((d) => response.directive(d));
    }
    if (exception.message) {
        response.say(exception.message);
    } else {
        response.say(`Es ist ein Fehler aufgetreten.`);
    }
};

alexaApp.post = (request: alexa.request, response: alexa.response, type: string, exception: any) => {
    const responseObj = response.response.response;
    if (!hasDisplaySupport(request)) {
        responseObj.directives = excludeDisplayDirectives(response);
    }

    if (containsDialogDirective(response) || isStopIntent(request)) {
        responseObj.directives = excludeGameEngineDirectives(response);
        return;
    }

    // responseObj.directives.push(TimeoutHandler.TIMEOUT_DIRECTIVE);

    // If shouldEndSession is true, set it to undefined to make timeout work.
    // If it is explicitly set to false, do nothing to keep session open.
    if (responseObj.shouldEndSession) {
        response.shouldEndSession(undefined);
    }
};

const jiraIssueIntentHandler: JiraIssueIntentHandler = Container.get(JiraIssueIntentHandler);
const jiraChangeIssueStatusIntentHandler: JiraChangeIssueStatusIntentHandler = Container.get(JiraChangeIssueStatusIntentHandler);
const jiraXrayStatusIntentHandler: JiraXrayStatusIntentHandler = Container.get(JiraXrayStatusIntentHandler);
const jiraChartIntentHandler: JiraChartIntentHandler = Container.get(JiraChartIntentHandler);
const jiraVelocityIntentHandler: JiraVelocityIntentHandler = Container.get(JiraVelocityIntentHandler);
const timeoutHandler: TimeoutHandler = Container.get(TimeoutHandler);
const displayTestIntentHandler: DisplayTestIntentHandler = Container.get(DisplayTestIntentHandler);
const projectDashboardIntentHandler: ProjectDashboardIntentHandler = Container.get(ProjectDashboardIntentHandler);

alexaApp.launch(LaunchIntentHandler);

alexaApp.intent('AMAZON.StopIntent', StopIntentHandler);

// 'hilfe'
alexaApp.intent('AMAZON.HelpIntent', HelpIntentHandler);

// 'jira hilfe'
alexaApp.intent('JiraHelpIntent', JiraHelpIntentHandler);

// TODO: add more HelpIntents

// 'zeige'
alexaApp.intent('DisplayTestIntent', displayTestIntentHandler.handle.bind(displayTestIntentHandler));

// 'gesamtstatus', 'übersicht', 'dashboard'
alexaApp.intent('ProjectDashboardIntent', projectDashboardIntentHandler.handle.bind(projectDashboardIntentHandler));

// 'starte pm assistent und öffne jira ticket'
alexaApp.intent('JiraIssueIntent', jiraIssueIntentHandler.handle.bind(jiraIssueIntentHandler));

// 'starte pm assistent und schließe jira ticket'
alexaApp.intent('JiraChangeIssueStatusIntent', jiraChangeIssueStatusIntentHandler.handle.bind(jiraChangeIssueStatusIntentHandler));

// 'starte pm assistent und teststatus INK 42'
alexaApp.intent('JiraXrayStatusIntent', jiraXrayStatusIntentHandler.handle.bind(jiraXrayStatusIntentHandler));

// 'starte pm assistent und zeige burndown chart'
alexaApp.intent('JiraChartIntent', jiraChartIntentHandler.handle.bind(jiraChartIntentHandler));

// 'starte pm assistent und zeige die velocity'
alexaApp.intent('JiraVelocityIntent', jiraVelocityIntentHandler.handle.bind(jiraVelocityIntentHandler));

// 'starte pm assistent und suche nach offenen jira bugs'
alexaApp.intent('JiraSearchIssuesIntent', JiraSearchIssuesIntentHandler);

// 'starte pm assistent und zeige jenkins status'
alexaApp.intent('JenkinsBuildsIntent', JenkinsBuildsIntentHandler);

// 'starte pm assistent und sende eine mail'
alexaApp.intent('SendMailIntent', SendMailIntentHandler);

// 'starte pm assistent und gib mir einen aktuellen status'
alexaApp.intent('AggregateIntent', AggregateIntentHandler);

alexaApp.on('GameEngine.InputHandlerEvent', timeoutHandler.handle.bind(timeoutHandler));

alexaApp.on('Alexa.Presentation.APL.UserEvent', (request: alexa.request, response: alexa.response) => {
    // TODO: move to own handler
    console.log(`Received TouchEvent, arguments: ${request.data.request.arguments}`);
    const action = request.data.request.arguments[0];
    const selectedItemIdentifier = request.data.request.arguments[1];
    if (action === 'HelpItemSelected') {
        switch (selectedItemIdentifier) {
            case 'jira':
                return request.getRouter().intent('JiraHelpIntent');
            case 'confluence':
            case 'gitlab':
            case 'sonarqube':
            default:
                return response.say(`Diese Hilfe ist noch nicht implementiert.`);
        }
    } else if (action === 'XRayTestSelected') {
        return request.getRouter().intent('DisplayTestIntent');
        // return response
        //     .directive({
        //         type: 'Dialog.Delegate',
        //         updatedIntent: {
        //             name: 'JiraXRayTestDetailsIntent',
        //             confirmationStatus: 'NONE',
        //             slots: {
        //                 Nummer: {
        //                     name: 'Nummer',
        //                     value: '999'
        //                 }
        //             }
        //           }
        //     })
        //     .say(`${selectedItemIdentifier} ausgewählt`);
    }
});

app.listen(process.env.ALEXA_APP_PORT, () => console.log(`Listening on port ${process.env.ALEXA_APP_PORT}`));
