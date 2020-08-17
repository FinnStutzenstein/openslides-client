import { Injectable } from '@angular/core';

import { MotionVote } from 'app/shared/models/motions/motion-vote';
import { ViewMotionVote } from 'app/site/motions/models/view-motion-vote';
import { BaseRepository } from '../base-repository';
import { MeetingModelBaseRepository } from '../meeting-model-base-repository';
import { RepositoryServiceCollector } from '../repository-service-collector';

/**
 * Repository Service for Assignments.
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class MotionVoteRepositoryService extends MeetingModelBaseRepository<ViewMotionVote, MotionVote> {
    public constructor(repositoryServiceCollector: RepositoryServiceCollector) {
        super(repositoryServiceCollector, MotionVote);
    }

    public getTitle = (viewMotionVote: object) => {
        return 'Vote';
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Votes' : 'Vote');
    };
}
