import { Pipe, PipeTransform } from '@angular/core';
import { Appointment } from '../models/health.models';

@Pipe({ name: 'apCount', standalone: true })
export class ApCountPipe implements PipeTransform {
  transform(apts: Appointment[], status: string): number {
    return apts.filter(a => a.status === status).length;
  }
}
