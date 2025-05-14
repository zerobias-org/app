import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'arrayToString'
})
export class ArrayToStringPipe implements PipeTransform {

  public transform(values: any[], key:string = null): string {
    const strs = [];
    if( values ) {
      values.forEach( (value) => {
        if( key ) {
          strs.push( value[key] );
        } else {
          strs.push( value );
        }
      });
    }
    return strs.join(', ');
  }

}
