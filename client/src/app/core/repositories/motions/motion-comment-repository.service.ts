import { Injectable } from '@angular/core';

import { DEFAULT_FIELDSET, Fieldsets } from 'app/core/core-services/model-request-builder.service';
import { MotionComment } from 'app/shared/models/motions/motion-comment';
import { ViewMotionComment } from 'app/site/motions/models/view-motion-comment';
import { BaseRepositoryWithActiveMeeting } from '../base-repository-with-active-meeting';
import { RepositoryServiceCollector } from '../repository-service-collector';

@Injectable({
    providedIn: 'root'
})
export class MotionCommentRepositoryService extends BaseRepositoryWithActiveMeeting<ViewMotionComment, MotionComment> {
    public constructor(repositoryServiceCollector: RepositoryServiceCollector) {
        super(repositoryServiceCollector, MotionComment);
    }

    public getTitle = (viewMotionComment: ViewMotionComment) => {
        return 'Comment';
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Comments' : 'Comment');
    };

    public getFieldsets(): Fieldsets<ViewMotionComment> {
        const commentFields: (keyof ViewMotionComment)[] = ['comment'];
        return {
            [DEFAULT_FIELDSET]: commentFields
        };
    }
}
