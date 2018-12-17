export enum IssueType {
    BUG = 'Bug',
    TASK = 'Aufgabe',
    SUBTASK = 'Unteraufgabe',
    STORY = 'Story',
    EPIC = 'Epic',
    IMPROVEMENT = 'Verbesserung'
}

export enum IssuePriority {
    HIGHEST = 'Highest',
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
    LOWEST = 'Lowest'
}

export enum IssueStatus {
    OPEN = 'Offen',
    NEW = 'Neu',
    CLOSED = 'Closed',
    DONE = 'Erledigt',
    IN_PROGRESS = 'In Progress',
    FINISHED = 'Fertig',
    RESOLVED = 'Resolved',
    REOPENED = 'Reopened'
}

export enum SprintStatus {
    ACTIVE = 'active',
    CLOSED = 'closed',
    FUTURE = 'future'
}

export enum TestCoverageStatus {
    FAILED = 'NOK',
    SUCCESSFUL = 'OK',
    NOT_RUN = 'NOTRUN',
    UNCOVERED = 'UNCOVERED'
}

export enum SwimlaneStatus {
    TODO = 'To Do',
    IN_PROGRESS = 'In Progress',
    DONE = 'Done'
}
