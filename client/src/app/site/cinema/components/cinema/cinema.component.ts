import { Component, OnInit } from '@angular/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { ProjectorService } from 'app/core/core-services/projector.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { ComponentServiceCollector } from 'app/core/ui-services/component-service-collector';
import { ViewListOfSpeakers } from 'app/site/agenda/models/view-list-of-speakers';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { BaseComponent } from 'app/site/base/components/base.component';
import { ViewProjector } from 'app/site/projector/models/view-projector';
import { CurrentListOfSpeakersService } from 'app/site/projector/services/current-list-of-speakers.service';
import { isDetailNavigable, DetailNavigable } from 'app/site/base/detail-navigable';

@Component({
    selector: 'os-cinema',
    templateUrl: './cinema.component.html',
    styleUrls: ['./cinema.component.scss']
})
export class CinemaComponent extends BaseComponent implements OnInit {
    public listOfSpeakers: ViewListOfSpeakers;
    public projector: ViewProjector;
    private currentProjectorElement: any /*ProjectorElement*/;
    public projectedViewModel: BaseProjectableViewModel;

    public get title(): string {
        if (this.projectedViewModel) {
            return this.projectedViewModel.getListTitle();
        } else if (this.currentProjectorElement) {
            return this.projectorService.getSlideTitle(this.currentProjectorElement)?.title;
        } else {
            return '';
        }
    }

    public get projectorTitle(): string {
        return this.projector?.getTitle() || '';
    }

    public get closUrl(): string {
        if (this.listOfSpeakers && this.operator.hasPerms(this.permission.agendaCanManageListOfSpeakers)) {
            return this.listOfSpeakers?.listOfSpeakersUrl;
        } else {
            return '';
        }
    }

    public get isLosClosed(): boolean {
        return this.listOfSpeakers?.closed;
    }

    public get viewModelUrl(): string {
        if (this.projectedViewModel && isDetailNavigable(this.projectedViewModel)) {
            return (this.projectedViewModel as DetailNavigable).getDetailStateURL();
        } else {
            return '';
        }
    }

    public get projectorUrl(): string {
        if (this.projector) {
            if (this.operator.hasPerms(this.permission.coreCanManageProjector)) {
                return `/projectors/detail/${this.projector.id}`;
            } else {
                return `/projector/${this.projector.id}`;
            }
        } else {
            return '';
        }
    }

    public get projectionTarget(): '_blank' | '_self' {
        if (this.operator.hasPerms(this.permission.coreCanManageProjector)) {
            return '_self';
        } else {
            return '_blank';
        }
    }

    public constructor(
        componentServiceCollector: ComponentServiceCollector,
        private operator: OperatorService,
        private projectorService: ProjectorService,
        private projectorRepo: ProjectorRepositoryService,
        private closService: CurrentListOfSpeakersService
    ) {
        super(componentServiceCollector);
    }

    public ngOnInit(): void {
        // TODO
        /*this.subscriptions.push(
            this.projectorRepo.getReferenceProjectorObservable().subscribe(refProjector => {
                this.projector = refProjector;
                this.currentProjectorElement = refProjector?.elements[0] || null;
                if (this.currentProjectorElement) {
                    this.projectedViewModel = this.projectorService.getViewModelFromProjectorElement(
                        this.currentProjectorElement
                    );
                } else {
                    this.projectedViewModel = null;
                }
            }),
            this.closService.currentListOfSpeakersObservable.subscribe(clos => {
                this.listOfSpeakers = clos;
            })
        );*/
    }
}
