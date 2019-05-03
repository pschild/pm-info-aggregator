import { Inject } from 'typescript-ioc';
import * as alexa from 'alexa-app';
import { sayJiraTicket, sayInEnglish, pause } from '../utils/speechUtils';
import { buildHelpDetailDirective } from '../../apl/datasources';
import AppState from '../../app/state/AppState';

export default class JiraHelpIntentHandler {

    @Inject
    private appState: AppState;

    public async handle(request: alexa.request, response: alexa.response): Promise<alexa.response> {
        const speech = `Du kannst mich nach Informationen aus ${sayInEnglish('jira')} Tickets fragen. Frage zum Beispiel:`
            + `${pause(500)}`
            + `Gib mir eine Zusammenfassung von Ticket ${sayJiraTicket('MDK', '2871')}`;

        return response
            .say(speech)
            .reprompt(speech)
            .directive(buildHelpDetailDirective({
                imageUrl: this.appState.getBaseUrl() + 'static/jira.png',
                hints: [
                    'Andere den Status von AX-2 auf geschlossen!',
                    'Zeige den Aufwand für das nächste Release!',
                    'Zeige den Sprint Fortschritt!',
                    'Zeige mir das Burn Down Chart!'
                ]
            }))
            .shouldEndSession(false);
    }
}
