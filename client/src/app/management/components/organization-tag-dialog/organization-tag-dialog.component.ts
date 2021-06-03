import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { HtmlColor } from 'app/core/definitions/key-types';
import { ComponentServiceCollector } from 'app/core/ui-services/component-service-collector';
import { ViewOrganizationTag } from 'app/management/models/view-organization-tag';
import { BaseComponent } from 'app/site/base/components/base.component';

interface OrganizationTagDialogData {
    organizationTag?: ViewOrganizationTag;
    getRandomColor: () => HtmlColor;
}

@Component({
    selector: 'os-organization-tag-dialog',
    templateUrl: './organization-tag-dialog.component.html',
    styleUrls: ['./organization-tag-dialog.component.scss']
})
export class OrganizationTagDialogComponent extends BaseComponent implements OnInit {
    public get isCreateView(): boolean {
        return this._isCreateView;
    }

    public get currentColor(): string {
        return this._lastValidColor;
    }

    public organizationTagForm: FormGroup;

    private _isCreateView = false;
    private _lastValidColor: string;

    public constructor(
        serviceCollector: ComponentServiceCollector,
        @Inject(MAT_DIALOG_DATA) public data: OrganizationTagDialogData,
        private dialogRef: MatDialogRef<OrganizationTagDialogComponent>,
        private fb: FormBuilder
    ) {
        super(serviceCollector);
    }

    public ngOnInit(): void {
        this.createForm();
        if (!this.data.organizationTag) {
            this._isCreateView = true;
        } else {
            this.updateForm();
        }
    }

    public onSaveClicked(): void {
        const { name, color }: { name: string; color: string } = this.organizationTagForm.value;
        this.dialogRef.close({ name, color: `#${color}` });
    }

    public generateColor(): void {
        this.organizationTagForm.patchValue({ color: this.getRandomColor() });
    }

    private getRandomColor(): string {
        const nextColor = this.data.getRandomColor();
        return nextColor.startsWith('#') ? nextColor.slice(1) : nextColor;
    }

    private createForm(): void {
        this._lastValidColor = this.getRandomColor();
        this.organizationTagForm = this.fb.group({
            name: ['', Validators.required],
            color: [this._lastValidColor, Validators.pattern(/^[0-9a-fA-F]{6}$/)]
        });
        this.subscriptions.push(
            this.organizationTagForm.get('color').valueChanges.subscribe((currentColor: string) => {
                if (currentColor.length === 6) {
                    this._lastValidColor = currentColor;
                }
            })
        );
    }

    private updateForm(): void {
        const color = this.data.organizationTag.color;
        const update = {
            name: this.data.organizationTag.name,
            color: color.startsWith('#') ? color.slice(1) : color
        };
        this.organizationTagForm.patchValue(update);
    }
}
