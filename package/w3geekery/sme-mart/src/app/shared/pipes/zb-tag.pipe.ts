import { Pipe, PipeTransform } from '@angular/core';
import { stripPrefix } from '../../core/utils/tag-prefix.util';

/**
 * Standalone pipe that strips the sme-mart.* prefix from tag names for display.
 *
 * Usage: {{ tag.name | zbTag }}
 *
 * "sme-mart.eng.amber-circuit" → "amber-circuit"
 * "ENG-amber-circuit"          → "amber-circuit"
 * "my-custom-tag"              → "my-custom-tag"
 */
@Pipe({
  name: 'zbTag',
  standalone: true,
  pure: true,
})
export class ZbTagPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return stripPrefix(typeof value === 'string' ? value : String(value));
  }
}
