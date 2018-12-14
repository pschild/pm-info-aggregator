export enum NotificationType {
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error'
}

export interface IImageDocumentPayload {
    title: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    imageUrl: string;
    logoUrl: string;
}

export interface ITouchableTextDocumentPayload {
    text: string;
}

export interface ITextSamplesDocumentPayload {
    title: string;
    backgroundImageUrl?: string;
    logoUrl: string;
    textContent: {primaryText: any};
}

export interface INotificationDocumentPayload {
    title: string;
    backgroundImageUrl?: string;
    logoUrl: string;
    type: NotificationType;
    textContent: {primaryText: any};
}

export interface IListItem {
    listItemIdentifier: string;
    textContent: {primaryText: any, secondaryText: any};
    imageUrl: string;
    token?: string;
}

export interface IListDocumentPayload {
    title: string;
    logoUrl: string;
    hintText?: string;
    backgroundImageUrl?: string;
    listItems: IListItem[];
}

export const buildImageDirective = (data: IImageDocumentPayload) => {
    return {
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'imageDocument',
        document: require(`@apl/imageDocument.json`),
        datasources: { data }
    };
};

export const buildTouchableTextDirective = (data: ITouchableTextDocumentPayload) => {
    return {
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'touchableTextDocument',
        document: require(`@apl/touchableTextDocument.json`),
        datasources: { data }
    };
};

export const buildTextSamplesDirective = (data: ITextSamplesDocumentPayload) => {
    return {
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'textSamplesDocument',
        document: require(`@apl/textSamplesDocument.json`),
        datasources: { data }
    };
};

export const buildNotificationDirective = (data: INotificationDocumentPayload) => {
    return {
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'notificationDocument',
        document: require(`@apl/notificationDocument.json`),
        datasources: { data }
    };
};

export const buildListDirective = (data: IListDocumentPayload) => {
    return {
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'listDocument',
        document: require(`@apl/listDocument.json`),
        datasources: { data }
    };
};

export const buildListItem = (identifier: string, primaryText: string, secondaryText: string, imageUrl: string): IListItem => {
    return {
        listItemIdentifier: identifier,
        textContent: {
            primaryText: {
                type: 'PlainText',
                text: primaryText
            },
            secondaryText: {
                type: 'PlainText',
                text: secondaryText
            }
        },
        imageUrl,
        token: identifier
    };
};
