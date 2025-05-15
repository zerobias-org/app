import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalize'
})
export class CapitalizePipe implements PipeTransform {

  transform(str:string): string {
    if( str ) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    return '';
  }

}
