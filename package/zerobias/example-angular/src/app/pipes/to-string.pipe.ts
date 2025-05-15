import { JsonPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { StringUtils } from '@auditmation/zb-client-lib-js';

@Pipe({
  name: 'toString'
})
export class ToStringPipe implements PipeTransform {

  constructor(private json: JsonPipe) {

  }

  public transform(value: any, ellipse = false, count = 64, beautify = null): string {
    if( value === null || value === undefined ) {
      return '';
    }
    
    let str = '';
    if( value instanceof Array ) {
      str = value.join(', ');
    } else if( value instanceof Object ) {
      str = this.json.transform(value);
    } else {
      str = `${value}`;
    }
    
    if( ellipse ) {
      if( str.length >= count ) {
        str = `${str.substring(0, count)}...`;
      }
    }
    if( beautify && beautify === 'html') {
      return StringUtils.beautifyHTML(str);
    } else if( beautify && beautify === 'json') {
      return StringUtils.beautifyJSON(str);
    } else {
      return str;
    }
  }

}
