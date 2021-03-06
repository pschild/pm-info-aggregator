import * as alexa from 'alexa-app';
import { JiraEndpointController } from '../../endpoint/jira/JiraEndpointController';
import { Inject } from 'typescript-ioc';
import { buildSprintProgressDirective } from '../../apl/datasources';
import { IssueType, SwimlaneStatus } from '../../endpoint/jira/domain/enum';
import { JiraIssue } from '../../endpoint/jira/domain/JiraIssue';
import { sayAsDecimal, sayAsDate } from '../utils/speechUtils';
import { ProgressBarChartController } from '../../media/ProgressBarChartController';
import * as dateFormat from 'dateformat';
import { HandlerError } from '../error/HandlerError';
import AppState from '../../app/state/AppState';
import IIntentHandler from '../IIntentHandler';
import { sendProgressiveResponse } from '../utils/handlerUtils';

export default class JiraSprintProgressIntentHandler implements IIntentHandler {

    @Inject
    private appState: AppState;

    @Inject
    private controller: JiraEndpointController;

    @Inject
    private progressBarChartController: ProgressBarChartController;

    public async handle(request: alexa.request, response: alexa.response): Promise<alexa.response> {
        sendProgressiveResponse(request, 'Ok, ich erstelle eine Übersicht vom aktuellen Sprint.');
        const activeSprint = await this.controller.getCurrentSprint();
        const issuesOfSprint = await this.controller.getIssuesOfSprint(activeSprint.id);

        const nonSubtasks = issuesOfSprint.issues.filter((i: JiraIssue) => i.fields.issuetype.name !== IssueType.SUBTASK);
        const workableIssues = issuesOfSprint.issues.filter((i: JiraIssue) => (
            i.fields.issuetype.name === IssueType.BUG || // Bugs
            i.fields.issuetype.name === IssueType.SUBTASK || // Subtasks
            (i.fields.issuetype.name === IssueType.TASK && (!i.getSubtasks() || !i.getSubtasks().length)) // Tasks without subtasks
        ));

        const todoWorkableIssues = workableIssues.filter((i: JiraIssue) => i.getSwimlaneStatus() === SwimlaneStatus.TODO).length;
        const doingWorkableIssues = workableIssues.filter((i: JiraIssue) => i.getSwimlaneStatus() === SwimlaneStatus.IN_PROGRESS).length;
        const doneWorkableIssues = workableIssues.filter((i: JiraIssue) => i.getSwimlaneStatus() === SwimlaneStatus.DONE).length;
        const sprintTaskProgress = ((doneWorkableIssues / workableIssues.length) * 100).toFixed(0);

        const sprintTimeProgress = (activeSprint.getProgress() * 100).toFixed(0);

        let sumOriginalEst = 0;
        let sumRemainingEst = 0;
        nonSubtasks.forEach((issue: JiraIssue) => {
            sumOriginalEst += issue.getOriginalEstimateSeconds() || 0;
            sumRemainingEst += issue.getRemainingEstimateSeconds() || 0;
        });
        const taskTimeProgress = ((1 - (sumRemainingEst / sumOriginalEst)) * 100).toFixed(0);

        const workableIssuesProgressChartUrl = await this.progressBarChartController.generateChart([
            { label: `${doneWorkableIssues}/${workableIssues.length}`, percent: sprintTaskProgress }
        ]).catch((e) => {
            throw new HandlerError(`Ich konnte das Diagramm nicht erstellen. Bitte versuche es erneut.`);
        });

        const timeProgressChartUrl = await this.progressBarChartController.generateChart([
            { label: `${sprintTimeProgress}%`, percent: sprintTimeProgress }
        ]).catch((e) => {
            throw new HandlerError(`Ich konnte das Diagramm nicht erstellen. Bitte versuche es erneut.`);
        });

        const taskProgressChartUrl = await this.progressBarChartController.generateChart([
            { label: `${taskTimeProgress}%`, percent: taskTimeProgress }
        ]).catch((e) => {
            throw new HandlerError(`Ich konnte das Diagramm nicht erstellen. Bitte versuche es erneut.`);
        });

        let progressInfo;
        if (+sprintTimeProgress > +taskTimeProgress) {
            progressInfo = `Momentan liegt ihr mit den Aufgaben etwas zurück. Wenn ihr euch beeilt, schafft ihr es vielleicht!`;
        } else {
            progressInfo = `Super! Ihr liegt aktuell gut in der Zeit! Weiter so!`;
        }

        return response
            .say(`Der aktuelle Sprint läuft bis zum ${sayAsDate(activeSprint.endDate)}.`)
            .say(progressInfo)
            .directive(buildSprintProgressDirective({
                backgroundImageUrl: this.appState.getBaseUrl() + 'static/neon60l.png',
                sprintName: activeSprint.name,
                sprintGoal: activeSprint.goal,
                sprintFrom: dateFormat(activeSprint.startDate, 'dd.mm.yyyy HH:MM'),
                sprintTo: dateFormat(activeSprint.endDate, 'dd.mm.yyyy HH:MM'),
                workableIssuesProgressImageUrl: workableIssuesProgressChartUrl,
                timeProgressImageUrl: timeProgressChartUrl,
                taskProgressImageUrl: taskProgressChartUrl
            }));
    }
}
