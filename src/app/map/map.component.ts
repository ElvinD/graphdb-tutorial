import { Component, OnInit } from '@angular/core';
import { SparqlService } from '../sparql.service';
import { ListComponent } from '../list/list.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent extends ListComponent implements OnInit  {

  constructor(protected sparqlService: SparqlService) {
    super(sparqlService);
 }

  ngOnInit() {
  }

}
