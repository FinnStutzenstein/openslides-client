import { Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

import { Subject, Subscription } from 'rxjs';

import { OfflineBroadcastService } from 'app/core/core-services/offline-broadcast.service';
import { ProjectorDataService, SlideData } from 'app/core/core-services/projector-data.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { ComponentServiceCollector } from 'app/core/ui-services/component-service-collector';
import { MediaManageService } from 'app/core/ui-services/media-manage.service';
import { MeetingSettingsService } from 'app/core/ui-services/meeting-settings.service';
import { Projector } from 'app/shared/models/projector/projector';
import { BaseComponent } from 'app/site/base/components/base.component';
import { ViewProjector } from 'app/site/projector/models/view-projector';
import { Size } from 'app/site/projector/size';

/**
 * THE projector. Cares about scaling and the right size and resolution.
 * Watches the given projector and creates slide-containers for each projectorelement.
 */
@Component({
    selector: 'os-projector',
    templateUrl: './projector.component.html',
    styleUrls: ['./projector.component.scss']
})
export class ProjectorComponent extends BaseComponent implements OnDestroy {
    /**
     * The current projector id.
     */
    private projectorId: number | null = null;

    @Input()
    public set projector(projector: ViewProjector) {
        this._projector = projector;
        this.setProjector(projector.projector);
    }

    private _projector: ViewProjector;

    public get projector(): ViewProjector {
        return this._projector;
    }

    /**
     * The current projector size. This is for checking,
     * if the size actually has changed.
     */
    private currentProjectorSize: Size = { width: 0, height: 0 };

    /**
     * Ths subscription to the projectordata.
     */
    private dataSubscription: Subscription;

    /**
     * The container element. THis is neede to get the size of the element,
     * in which the projector must fit and be scaled to.
     */
    @ViewChild('container', { static: true })
    private containerElement: ElementRef;

    /**
     * The css class assigned to this projector.
     */
    private projectorClass: string;

    /**
     * The styleelement for setting projector-specific styles.
     */
    private styleElement?: HTMLStyleElement;

    /**
     * All current css rules for the projector. when updating this, call `updateCSS()` afterwards.
     */
    public css: {
        container: {
            height: string;
        };
        projector: {
            transform: string;
            width: string;
            height: string;
            color: string;
            backgroundColor: string;
            H1Color: string;
        };
        headerFooter: {
            color: string;
            backgroundColor: string;
            backgroundImage: string;
        };
    } = {
        container: {
            height: '0px'
        },
        projector: {
            transform: 'none',
            width: '0px',
            height: '0px',
            color: 'black',
            backgroundColor: 'white',
            H1Color: '#317796'
        },
        headerFooter: {
            color: 'white',
            backgroundColor: '#317796',
            backgroundImage: 'none'
        }
    };

    /**
     * All slides to show on this projector
     */
    public slides: SlideData<object>[] = [];

    /**
     * The scroll for this projector. 0 is the default.
     */
    public scroll = 0;

    /**
     * The scale for this projector. 0 is the default.
     */
    public scale = 0;

    /**
     * Info about if the user is offline.
     */
    public isOffline = false;

    /**
     * The subscription to the projector.
     */
    private projectorSubscription: Subscription;

    /**
     * Holds the subscription to the offline-service.
     */
    private offlineSubscription: Subscription;

    /**
     * A subject that fires, if the container is resized.
     */
    public resizeSubject = new Subject<void>();

    // Some settings for the view from the config.
    public enableHeaderAndFooter = true;
    public enableTitle = true;
    public projectorLogo;
    public eventName;
    public eventDescription;
    public eventDate;
    public eventLocation;

    public constructor(
        componentServiceCollector: ComponentServiceCollector,
        private projectorDataService: ProjectorDataService,
        private projectorRepository: ProjectorRepositoryService,
        private meetingSettingsService: MeetingSettingsService,
        private offlineBroadcastService: OfflineBroadcastService,
        private elementRef: ElementRef,
        private mediaManageService: MediaManageService
    ) {
        super(componentServiceCollector);

        this.projectorClass = 'projector-' + Math.random().toString(36).substring(4);
        this.elementRef.nativeElement.classList.add(this.projectorClass);
        this.styleElement = document.createElement('style');
        this.styleElement.appendChild(document.createTextNode('')); // Hack for WebKit to trigger update
        document.head.appendChild(this.styleElement);

        // projector logo / background-image
        this.mediaManageService.getLogoUrlObservable('projector_main').subscribe(url => {
            this.projectorLogo = url ? url : '';
        });
        this.mediaManageService.getLogoUrlObservable('projector_header').subscribe(url => {
            this.css.headerFooter.backgroundImage = url ? `url('${url}')` : 'none';
            this.updateCSS();
        });

        // event data
        this.meetingSettingsService.get('name').subscribe(val => (this.eventName = val));
        this.meetingSettingsService.get('description').subscribe(val => (this.eventDescription = val));
        this.meetingSettingsService.get('start_time').subscribe(val => (this.eventDate = val));
        this.meetingSettingsService.get('location').subscribe(val => (this.eventLocation = val));

        // Watches for resizing of the container.
        this.resizeSubject.subscribe(() => {
            if (this.containerElement) {
                this.updateScaling();
            }
        });

        this.offlineSubscription = this.offlineBroadcastService.isOfflineObservable.subscribe(
            isOffline => (this.isOffline = isOffline)
        );
    }

    /**
     * Regular routine to set a projector
     *
     * @param projector
     */
    public setProjector(projector: Projector): void {
        // check, if ID changed:
        const newId = projector ? projector.id : null;
        if (this.projectorId !== newId) {
            this.projectorIdChanged(this.projectorId, newId);
            this.projectorId = newId;
        }

        // Update scaling, if projector is set.
        if (projector) {
            const oldSize: Size = { ...this.currentProjectorSize };
            this.currentProjectorSize.height = projector.height;
            this.currentProjectorSize.width = projector.width;
            if (
                oldSize.height !== this.currentProjectorSize.height ||
                oldSize.width !== this.currentProjectorSize.width
            ) {
                this.updateScaling();
            }
            this.css.projector.color = projector.color;
            this.css.projector.backgroundColor = projector.background_color;
            this.css.projector.H1Color = projector.header_h1_color;
            this.css.headerFooter.color = projector.header_font_color;
            this.css.headerFooter.backgroundColor = projector.header_background_color;
            this.updateCSS();
        }
    }

    /**
     * Scales the projector to the right format.
     */
    private updateScaling(): void {
        if (
            !this.containerElement ||
            this.currentProjectorSize.width === 0 ||
            this.containerElement.nativeElement.offsetWidth === 0
        ) {
            return;
        }
        const scale = this.containerElement.nativeElement.offsetWidth / this.currentProjectorSize.width;
        if (isNaN(scale)) {
            return;
        }
        this.css.projector.transform = 'scale(' + scale + ')';
        this.css.projector.width = this.currentProjectorSize.width + 'px';
        this.css.projector.height = this.currentProjectorSize.height + 'px';
        this.css.container.height = Math.round(scale * this.currentProjectorSize.height) + 'px';
        this.updateCSS();
    }

    /**
     * Update the css element with the current css settings in `this.css`.
     */
    private updateCSS(): void {
        if (!this.styleElement) {
            return;
        }
        this.styleElement.innerHTML = `
            .${this.projectorClass} .projector-container {
                height: ${this.css.container.height};
            }
            .${this.projectorClass} .projector {
                transform: ${this.css.projector.transform};
                width: ${this.css.projector.width};
                height: ${this.css.projector.height};
                background-color: ${this.css.projector.backgroundColor};
                color: ${this.css.projector.color};
            }
            .${this.projectorClass} .projector h1 {
                color: ${this.css.projector.H1Color};
            }
            .${this.projectorClass} .headerFooter {
                color: ${this.css.headerFooter.color};
                background-color: ${this.css.headerFooter.backgroundColor};
                background-image: ${this.css.headerFooter.backgroundImage};
            }`;
    }

    /**
     * Called, if the projector id changes.
     */
    private projectorIdChanged(from: number, to: number): void {
        // Unsubscribe form data and projector subscriptions.
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
        if (this.projectorSubscription) {
            this.projectorSubscription.unsubscribe();
        }
        if (to > 0) {
            if (from > 0) {
                this.projectorDataService.projectorClosed(from);
            }

            this.dataSubscription = this.projectorDataService.getProjectorObservable(to).subscribe(data => {
                this.slides = data || [];
            });
            this.projectorSubscription = this.projectorRepository.getViewModelObservable(to).subscribe(projector => {
                if (projector) {
                    this.scroll = projector.scroll || 0;
                    this.scale = projector.scale || 0;
                }
            });
        } else if (!to && from > 0) {
            // no new projector
            this.projectorDataService.projectorClosed(from);
        }
    }

    /**
     * Deregister the projector from the projectordataservice.
     */
    public ngOnDestroy(): void {
        super.ngOnDestroy();
        if (this.projectorId > 0) {
            this.projectorDataService.projectorClosed(this.projectorId);
        }
        document.head.removeChild(this.styleElement);
        this.styleElement = null;
        if (this.offlineSubscription) {
            this.offlineSubscription.unsubscribe();
            this.offlineSubscription = null;
        }
    }
}
