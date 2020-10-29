import { Injectable } from '@angular/core';

import { MeetingAction } from 'app/core/actions/meeting-action';
import { DEFAULT_FIELDSET, Fieldsets } from 'app/core/core-services/model-request-builder.service';
import { Id } from 'app/core/definitions/key-types';
import { MeetingSettingsDefinitionProvider } from 'app/core/ui-services/meeting-settings-definition-provider.service';
import { Meeting } from 'app/shared/models/event-management/meeting';
import { ViewMeeting } from 'app/site/event-management/models/view-meeting';
import { BaseRepository } from '../base-repository';
import { RepositoryServiceCollectorWithoutActiveMeetingService } from '../repository-service-collector-without-active-meeting-service';

@Injectable({
    providedIn: 'root'
})
export class MeetingRepositoryService extends BaseRepository<ViewMeeting, Meeting> {
    public constructor(
        repositoryServiceCollector: RepositoryServiceCollectorWithoutActiveMeetingService,
        private meetingSettingsDefinitionProvider: MeetingSettingsDefinitionProvider
    ) {
        super(repositoryServiceCollector, Meeting);
    }

    public getFieldsets(): Fieldsets<Meeting> {
        return {
            [DEFAULT_FIELDSET]: ['description'],
            settings: this.meetingSettingsDefinitionProvider.getSettingsKeys()
        };
    }

    public getTitle = (viewMeeting: ViewMeeting) => {
        return viewMeeting.name;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Meetings' : 'Meeting');
    };

    public deleteAllSpeakersOfAllListsOfSpeakersInAMeeting(meetingId: Id): Promise<void> {
        const payload: MeetingAction.DeleteAllSpeakersOfAllListsPayload = {
            id: meetingId
        };
        return this.sendActionToBackend(MeetingAction.DELETE_ALL_SPEAKERS_OF_ALL_LISTS, payload);
    }
}
