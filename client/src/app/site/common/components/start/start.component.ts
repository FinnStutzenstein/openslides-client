import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { OperatorService } from 'app/core/core-services/operator.service';
import { ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';
import { ComponentServiceCollector } from 'app/core/ui-services/component-service-collector';
import { OrganisationSettingsService } from 'app/core/ui-services/organisation-settings.service';
import { BaseComponent } from 'app/site/base/components/base.component';

/**
 * Interface describes the keys for the fields at start-component.
 */
interface IStartContent {
    general_event_welcome_title: string;
    general_event_welcome_text: string;
}

/**
 * The start component. Greeting page for OpenSlides
 */
@Component({
    selector: 'os-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss']
})
export class StartComponent extends BaseComponent implements OnInit {
    /**
     * Whether the user is editing the content.
     */
    public isEditing = false;

    /**
     * Formular for the content.
     */
    public startForm: FormGroup;

    /**
     * Holding the values for the content.
     */
    public startContent: IStartContent = {
        general_event_welcome_title: '',
        general_event_welcome_text: ''
    };

    /**
     * Constructor of the StartComponent
     *
     * @param titleService the title serve
     * @param translate to translation module
     * @param organisationSettingsService read out config values
     */
    public constructor(
        componentServiceCollector: ComponentServiceCollector,
        private organisationSettingsService: OrganisationSettingsService,
        private configRepo: ConfigRepositoryService,
        private formBuilder: FormBuilder,
        private operator: OperatorService
    ) {
        super(componentServiceCollector);
        this.startForm = this.formBuilder.group({
            general_event_welcome_title: ['', Validators.required],
            general_event_welcome_text: ''
        });
    }

    /**
     * Init the component.
     *
     * Sets the welcomeTitle and welcomeText.
     */
    public ngOnInit(): void {
        super.setTitle('Home');

        // set the welcome title
        this.organisationSettingsService
            .get<string>('general_event_welcome_title')
            .subscribe(welcomeTitle => (this.startContent.general_event_welcome_title = welcomeTitle));

        // set the welcome text
        this.organisationSettingsService.get<string>('general_event_welcome_text').subscribe(welcomeText => {
            this.startContent.general_event_welcome_text = this.translate.instant(welcomeText);
        });
    }

    /**
     * Changes to editing mode.
     */
    public editStartPage(): void {
        Object.keys(this.startForm.controls).forEach(control => {
            this.startForm.patchValue({ [control]: this.startContent[control] });
        });
        this.isEditing = true;
    }

    /**
     * Saves changes and updates the content.
     */
    public saveChanges(): void {
        this.configRepo
            .bulkUpdate(
                Object.keys(this.startForm.controls).map(control => ({
                    key: control,
                    value: this.startForm.value[control]
                }))
            )
            .then(() => (this.isEditing = !this.isEditing), this.raiseError);
    }

    /**
     * Returns, if the current user has the necessary permissions.
     */
    public canManage(): boolean {
        return this.operator.hasPerms('core.can_manage_config');
    }
}
