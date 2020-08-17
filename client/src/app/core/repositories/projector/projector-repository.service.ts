import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService } from 'app/core/core-services/http.service';
import { Projector } from 'app/shared/models/projector/projector';
import { ViewProjector } from 'app/site/projector/models/view-projector';
import { BaseRepository } from '../base-repository';
import { MeetingModelBaseRepository } from '../meeting-model-base-repository';
import { RepositoryServiceCollector } from '../repository-service-collector';

/**
 * Directions for scale and scroll requests.
 */
export enum ScrollScaleDirection {
    Up = 'up',
    Down = 'down',
    Reset = 'reset'
}

/**
 * Manages all projector instances.
 */
@Injectable({
    providedIn: 'root'
})
export class ProjectorRepositoryService extends MeetingModelBaseRepository<ViewProjector, Projector> {
    public constructor(repositoryServiceCollector: RepositoryServiceCollector, private http: HttpService) {
        super(repositoryServiceCollector, Projector);
    }

    public getTitle = (viewProjector: ViewProjector) => {
        return viewProjector.name;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Projectors' : 'Projector');
    };

    /**
     * Scroll the given projector.
     *
     * @param projector The projector to scroll
     * @param direction The direction.
     * @param step (default 1) The amount of scroll-steps
     */
    public async scroll(projector: ViewProjector, direction: ScrollScaleDirection, step: number = 1): Promise<void> {
        await this.controlView(projector, direction, 'scroll', step);
    }

    /**
     * Scale the given projector.
     *
     * @param projector The projector to scale
     * @param direction The direction.
     * @param step (default 1) The amount of scale-steps
     */
    public async scale(projector: ViewProjector, direction: ScrollScaleDirection, step: number = 1): Promise<void> {
        await this.controlView(projector, direction, 'scale', step);
    }

    /**
     * Controls the view of a projector.
     *
     * @param projector The projector to control.
     * @param direction The direction
     * @param action The action. Can be scale or scroll.
     * @param step The amount of steps to make.
     */
    private async controlView(
        projector: ViewProjector,
        direction: ScrollScaleDirection,
        action: 'scale' | 'scroll',
        step: number
    ): Promise<void> {
        await this.http.post<void>(`/rest/core/projector/${projector.id}/control_view/`, {
            action: action,
            direction: direction,
            step: step
        });
    }

    /**
     * Sets the given projector as the new reference projector for all projectors
     * @param projector the new reference projector id
     */
    public async setReferenceProjector(projector_id: number): Promise<void> {
        await this.http.post<void>(`/rest/core/projector/${projector_id}/set_reference_projector/`);
    }

    /**
     * return the id of the current reference projector
     * prefer the observable whenever possible
     */
    public getReferenceProjectorId(): number {
        // TODO: After logging in, this is null this.getViewModelList() is null
        return this.getViewModelList().find(projector => projector.isReferenceProjector).id;
    }

    public getReferenceProjectorIdObservable(): Observable<number> {
        return this.getViewModelListObservable().pipe(
            map(projectors => {
                const refProjector = projectors.find(projector => projector.isReferenceProjector);
                if (refProjector) {
                    return refProjector.id;
                }
            })
        );
    }
}
