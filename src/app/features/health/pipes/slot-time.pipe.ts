import { Pipe, PipeTransform } from '@angular/core';
import { TimeSlot } from '../models/health.models';

@Pipe({ name: 'slotTime', standalone: true })
export class SlotTimePipe implements PipeTransform {
  transform(slots: TimeSlot[], slotId: string): string {
    return slots.find(s => s.id === slotId)?.time || '';
  }
}
