import { Injectable } from '@angular/core';
import clone from 'clone';


@Injectable({
  providedIn: 'root'
})
export class CloneService {

    deepClone<T>(value): T {
        return clone<T>(value);
    }
}

