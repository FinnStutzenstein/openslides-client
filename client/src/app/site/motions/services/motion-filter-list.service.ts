import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { HistoryService } from 'app/core/core-services/history.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { Permission } from 'app/core/core-services/permission';
import { StorageService } from 'app/core/core-services/storage.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionCategoryRepositoryService } from 'app/core/repositories/motions/motion-category-repository.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { MotionWorkflowRepositoryService } from 'app/core/repositories/motions/motion-workflow-repository.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import {
    BaseFilterListService,
    OsFilter,
    OsFilterOption,
    OsFilterOptions
} from 'app/core/ui-services/base-filter-list.service';
import { MeetingSettingsService } from 'app/core/ui-services/meeting-settings.service';
import { Restriction } from 'app/shared/models/motions/motion-state';
import { AmendmentType } from '../motions.constants';
import { ViewMotion } from '../models/view-motion';

/**
 * Filter description to easier parse dynamically occurring workflows
 */
interface WorkflowFilterDesc {
    name: string;
    filter: OsFilterOption[];
}

/**
 * Filter the motion list
 */
@Injectable({
    providedIn: 'root'
})
export class MotionFilterListService extends BaseFilterListService<ViewMotion> {
    /**
     * set the storage key name
     */
    protected storageKey = 'MotionList';

    /**
     * Listen to the configuration for change in defined/used workflows
     */
    private enabledWorkflows = { statuteEnabled: false, statute: null, motion: null };

    /**
     * Determine to show amendments in the motion list
     */
    private showAmendmentsInMainTable: boolean;

    /**
     * Filter definitions for the workflow filter. Options will be generated by
     * getFilterOptions (as the workflows available may change)
     */
    public stateFilterOptions: OsFilter = {
        property: 'state_id',
        label: 'State',
        options: []
    };

    public categoryFilterOptions: OsFilter = {
        property: 'category_id',
        label: 'Category',
        options: []
    };

    public motionBlockFilterOptions: OsFilter = {
        property: 'block_id',
        label: 'Motion block',
        options: []
    };

    public motionCommentFilterOptions: OsFilter = {
        property: 'commentSectionIds',
        label: 'Comment',
        options: []
    };

    public recommendationFilterOptions: OsFilter = {
        property: 'recommendation_id',
        label: 'Recommendation',
        options: []
    };

    public tagFilterOptions: OsFilter = {
        property: 'tag_ids',
        label: 'Tags',
        options: []
    };

    public hasSpeakerOptions: OsFilter = {
        property: 'hasSpeakers',
        label: 'Speakers',
        options: [
            { condition: true, label: this.translate.instant('Has speakers') },
            { condition: false, label: this.translate.instant('Has no speakers') }
        ]
    };

    public AmendmentFilterOption: OsFilter = {
        property: 'amendmentType',
        label: 'Amendment',
        options: [
            { condition: AmendmentType.Amendment, label: this.translate.instant('Is amendment') },
            { condition: AmendmentType.Parent, label: this.translate.instant('Has amendments') },
            { condition: AmendmentType.Lead, label: this.translate.instant('Is no amendment and has no amendments') }
        ]
    };

    public personalNoteFilterOptions = [
        {
            property: 'star',
            label: this.translate.instant('Favorites'),
            options: [
                {
                    condition: true,
                    label: this.translate.instant('Is favorite')
                },
                {
                    condition: false,
                    label: this.translate.instant('Is not favorite')
                }
            ]
        },
        {
            property: 'hasNotes',
            label: this.translate.instant('Personal notes'),
            options: [
                {
                    condition: true,
                    label: this.translate.instant('Has notes')
                },
                {
                    condition: false,
                    label: this.translate.instant('Does not have notes')
                }
            ]
        }
    ];

    /**
     * Constructor. Subscribes to a variety of Repository to dynamically update
     * the available filters
     *
     * @param store The browser's storage; required for fetching filters from any previous sessions
     * @param categoryRepo to filter by Categories
     * @param motionBlockRepo to filter by MotionBlock
     * @param commentRepo to filter by motion comments
     * @param tagRepo to filter by tags
     * @param workflowRepo Subscribing to filters by states and recommendation
     * @param translate Translation service
     * @param operator
     */
    public constructor(
        store: StorageService,
        historyService: HistoryService,
        categoryRepo: MotionCategoryRepositoryService,
        motionBlockRepo: MotionBlockRepositoryService,
        commentRepo: MotionCommentSectionRepositoryService,
        tagRepo: TagRepositoryService,
        private workflowRepo: MotionWorkflowRepositoryService,
        private translate: TranslateService,
        private operator: OperatorService,
        private meetingSettingsService: MeetingSettingsService
    ) {
        super(store, historyService);
        this.getWorkflowConfig();
        this.getShowAmendmentConfig();

        this.updateFilterForRepo(categoryRepo, this.categoryFilterOptions, this.translate.instant('No category set'));

        this.updateFilterForRepo(
            motionBlockRepo,
            this.motionBlockFilterOptions,
            this.translate.instant('No motion block set')
        );

        this.updateFilterForRepo(commentRepo, this.motionCommentFilterOptions, this.translate.instant('No comment'));

        this.updateFilterForRepo(tagRepo, this.tagFilterOptions, this.translate.instant('No tags'));

        this.subscribeWorkflows();
        this.operator.operatorUpdatedEvent.subscribe(() => {
            this.setFilterDefinitions();
        });
    }

    /**
     * @override
     * @param motions The motions without amendments, if the according config was set
     */
    protected preFilter(motions: ViewMotion[]): ViewMotion[] {
        if (!this.showAmendmentsInMainTable) {
            return motions.filter(motion => !motion.lead_motion_id);
        }
    }

    /**
     * Listen to changes for the 'motions_amendments_main_table' config value
     */
    private getShowAmendmentConfig(): void {
        this.meetingSettingsService.get('motions_amendments_in_main_list').subscribe(show => {
            this.showAmendmentsInMainTable = show;
        });
    }

    private getWorkflowConfig(): void {
        this.meetingSettingsService.get('motions_default_statute_amendment_workflow_id').subscribe(id => {
            this.enabledWorkflows.statute = +id;
        });

        this.meetingSettingsService.get('motions_default_workflow_id').subscribe(id => {
            this.enabledWorkflows.motion = +id;
        });

        this.meetingSettingsService.get('motions_statutes_enabled').subscribe(bool => {
            this.enabledWorkflows.statuteEnabled = bool;
        });
    }

    /**
     * @returns the filter definition
     */
    protected getFilterDefinitions(): OsFilter[] {
        let filterDefinitions = [
            this.stateFilterOptions,
            this.categoryFilterOptions,
            this.motionBlockFilterOptions,
            this.recommendationFilterOptions,
            this.motionCommentFilterOptions,
            this.tagFilterOptions
        ];

        // only add the filter if the user has the correct permission
        if (this.operator.hasPerms(Permission.agendaCanSeeListOfSpeakers)) {
            filterDefinitions.push(this.hasSpeakerOptions);
        }

        if (this.showAmendmentsInMainTable) {
            filterDefinitions.push(this.AmendmentFilterOption);
        }

        if (!this.operator.isAnonymous) {
            filterDefinitions = filterDefinitions.concat(this.personalNoteFilterOptions);
        }

        return filterDefinitions;
    }

    /**
     * Subscribes to changing Workflows, and updates the state and recommendation filters accordingly.
     */
    private subscribeWorkflows(): void {
        this.workflowRepo.getViewModelListObservable().subscribe(workflows => {
            if (workflows && workflows.length) {
                const workflowFilters: WorkflowFilterDesc[] = [];
                const recoFilters: WorkflowFilterDesc[] = [];

                const finalStates: number[] = [];
                const nonFinalStates: number[] = [];

                // get all relevant information
                for (const workflow of workflows) {
                    if (this.isWorkflowEnabled(workflow.id)) {
                        workflowFilters.push({
                            name: workflow.name,
                            filter: []
                        });

                        recoFilters.push({
                            name: workflow.name,
                            filter: []
                        });

                        for (const state of workflow.states) {
                            // get the restriction array, but remove the is_submitter condition, if present
                            const restrictions = (state.restrictions.filter(
                                r => r !== Restriction.motionsIsSubmitter
                            ) as unknown) as Permission[];

                            if (!restrictions.length || this.operator.hasPerms(...restrictions)) {
                                // sort final and non final states
                                state.isFinalState ? finalStates.push(state.id) : nonFinalStates.push(state.id);

                                workflowFilters[workflowFilters.length - 1].filter.push({
                                    condition: state.id,
                                    label: state.name
                                });

                                if (state.recommendation_label) {
                                    recoFilters[workflowFilters.length - 1].filter.push({
                                        condition: state.id,
                                        label: state.recommendation_label
                                    });
                                }
                            }
                        }
                    }
                }

                // convert to filter options
                if (workflowFilters && workflowFilters.length) {
                    let workflowOptions: OsFilterOptions = [];
                    // add "done" and "undone"
                    workflowOptions.push({
                        label: 'Done',
                        condition: finalStates
                    });
                    workflowOptions.push({
                        label: this.translate.instant('Undone'),
                        condition: nonFinalStates
                    });
                    workflowOptions.push('-');

                    for (const filterDef of workflowFilters) {
                        workflowOptions.push(filterDef.name);
                        workflowOptions = workflowOptions.concat(filterDef.filter);
                    }

                    this.stateFilterOptions.options = workflowOptions;
                }

                if (recoFilters && recoFilters.length) {
                    let recoOptions: OsFilterOptions = [];

                    for (const filterDef of recoFilters) {
                        recoOptions.push(filterDef.name);
                        recoOptions = recoOptions.concat(filterDef.filter);
                    }

                    recoOptions.push('-');
                    recoOptions.push({
                        label: this.translate.instant('No recommendation'),
                        condition: null
                    });
                    this.recommendationFilterOptions.options = recoOptions;
                }
                this.setFilterDefinitions();
            }
        });
    }

    private isWorkflowEnabled(workflowId: number): boolean {
        return (
            workflowId === this.enabledWorkflows.motion ||
            (this.enabledWorkflows.statuteEnabled && workflowId === this.enabledWorkflows.statute)
        );
    }
}
