import { Directive, OnInit } from '@angular/core';

import { auditTime, distinctUntilChanged } from 'rxjs/operators';

import { BaseImportService } from 'app/core/ui-services/base-import.service';
import { ComponentServiceCollector } from 'app/core/ui-services/component-service-collector';
import { BaseModel } from 'app/shared/models/base/base-model';
import { getLongPreview, getShortPreview } from 'app/shared/utils/previewStrings';
import { BaseModelContextComponent } from './base-model-context.component';

@Directive()
export abstract class BaseImportListComponent<M extends BaseModel> extends BaseModelContextComponent implements OnInit {
    /**
     * Helper function for previews
     */
    public getLongPreview = getLongPreview;

    /**
     * Helper function for previews
     */
    public getShortPreview = getShortPreview;

    /**
     * Switch that turns true if a file has been selected in the input
     */
    public hasFile = false;

    /**
     * @returns the amount of import items that will be imported
     */
    public get newCount(): number {
        return this.importer && this.hasFile ? this.importer.summary.new : 0;
    }

    /**
     * Constructor. Initializes the table and subscribes to import errors
     *
     * @param importer The import service, depending on the implementation
     */

    public constructor(componentServiceCollector: ComponentServiceCollector, protected importer: BaseImportService<M>) {
        super(componentServiceCollector);
        this.initTable();
    }

    /**
     * Initializes the table
     */
    public initTable(): void {
        const entryObservable = this.importer.getNewEntries();
        this.subscriptions.push(
            entryObservable.pipe(distinctUntilChanged(), auditTime(100)).subscribe(newEntries => {
                if (newEntries?.length) {
                }
                this.hasFile = newEntries.length > 0;
            })
        );
    }

    /**
     * Triggers the importer's import
     *
     */
    public async doImport(): Promise<void> {
        await this.importer.doImport();
    }
}
