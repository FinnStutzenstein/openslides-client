import { Id } from 'app/core/definitions/key-types';
import { BaseModel } from '../base/base-model';
import { HasAgendaItemId } from '../base/has-agenda-item-id';
import { HasListOfSpeakersId } from '../base/has-list-of-speakers-id';
import { HasMeetingId } from '../base/has-meeting-id';
import { HasProjectableIds } from '../base/has-projectable-ids';

/**
 * Representation of a motion block.
 * @ignore
 */
export class MotionBlock extends BaseModel<MotionBlock> {
    public static COLLECTION = 'motion_block';

    public id: Id;
    public title: string;
    public internal: boolean;

    public motion_ids: Id[]; // (motion/block_id)[];

    public constructor(input?: any) {
        super(MotionBlock.COLLECTION, input);
    }
}
export interface MotionBlock extends HasMeetingId, HasAgendaItemId, HasListOfSpeakersId, HasProjectableIds {}
