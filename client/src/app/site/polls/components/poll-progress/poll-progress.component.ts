import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ComponentServiceCollector } from 'app/core/ui-services/component-service-collector';
import { BaseComponent } from 'app/site/base/components/base.component';
import { ViewBasePoll } from 'app/site/polls/models/view-base-poll';

@Component({
    selector: 'os-poll-progress',
    templateUrl: './poll-progress.component.html',
    styleUrls: ['./poll-progress.component.scss']
})
export class PollProgressComponent extends BaseComponent implements OnInit {
    @Input()
    public poll: ViewBasePoll;
    public max: number;

    public get votescast(): number {
        return this.poll?.votescast || 0;
    }

    public constructor(
        componentServiceCollector: ComponentServiceCollector,
        private userRepo: UserRepositoryService
    ) {
        super(componentServiceCollector);
    }

    public ngOnInit(): void {
        if (this.poll) {
            this.subscriptions.push(
                this.userRepo
                    .getViewModelListObservable()
                    .pipe(
                        map(users =>
                            /**
                             * Filter the users who would be able to vote:
                             * They are present or have their right to vote delegated
                             * They are in one of the voting groups
                             */
                            users.filter(
                                user =>
                                    (user.is_present || user.isVoteRightDelegated) &&
                                    this.poll.groups_id.intersect(user.groups_id).length
                            )
                        )
                    )
                    .subscribe(users => {
                        this.max = users.length;
                    })
            );
        }
    }

    public get valueInPercent(): number {
        return (this.votescast / this.max) * 100;
    }
}
