import * as alexa from 'alexa-app';
import { JiraEndpointController } from '../endpoint/jira/JiraEndpointController';
import { JiraIssue } from '../endpoint/jira/domain/JiraIssue';
import { Container } from 'typescript-ioc';

export default async (request: alexa.request, response: alexa.response): Promise<alexa.response> => {
    let errorSpeechOutput;

    if (request.getDialog().isStarted()) {
        const updatedIntent = request.data.request.intent;
        return response
            .directive({
                type: 'Dialog.Delegate',
                updatedIntent
            })
            .shouldEndSession(false);

    } else if (!request.getDialog().isCompleted()) {
        const updatedIntent = request.data.request.intent;
        return response
            .directive({
                type: 'Dialog.Delegate',
                updatedIntent
            })
            .shouldEndSession(false);

    }

    const ticketIdentifierValue = request.slot('JiraTicketIdentifier');
    const ticketNumberValue = request.slot('JiraTicketNumber');
    console.log(ticketIdentifierValue, ticketNumberValue);

    const controller: JiraEndpointController = Container.get(JiraEndpointController);
    const issue: JiraIssue = await controller
        .getIssue(`${ticketIdentifierValue}-${ticketNumberValue}`)
        .catch((error) => {
            errorSpeechOutput = `Ich konnte das Ticket ${ticketIdentifierValue}-${ticketNumberValue} nicht finden.`;
            return null;
        });

    // TODO: cleaner error handling
    if (!issue || !issue.getAssignee() || !issue.getAssignee().displayName) {
        errorSpeechOutput = `Ich habe Probleme, das Ticket ${ticketIdentifierValue}-${ticketNumberValue} auszuwerten.`;
    }

    if (errorSpeechOutput) {
        return response.say(errorSpeechOutput);
    }

    response
        .directive({
            type: 'Display.RenderTemplate',
            template: {
                type: 'BodyTemplate1',
                backButton: 'HIDDEN',
                backgroundImage: {
                    contentDescription: '',
                    sources: [{
                        url: issue.getAssignee().avatarUrls['48x48'],
                        size: 'LARGE'
                    }]
                },
                textContent: {
                    primaryText: {
                        text: `<div align='center'>${issue.getAssignee().displayName}</div>`,
                        type: 'RichText'
                    }
                }
            }
        })
        .say(`Das Ticket ${ticketIdentifierValue}-${ticketNumberValue} ist ${issue.getAssignee().displayName} zugewiesen.`);
};
