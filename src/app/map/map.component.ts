import { Component, OnInit, AfterViewInit, AfterViewChecked } from '@angular/core';
import { SparqlService } from '../sparql.service';
import { ListComponent } from '../list/list.component';
import { icon, latLng, Map, marker, point, polyline, tileLayer } from 'leaflet';
import { SearchService } from '../search.service';

declare let L;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent extends ListComponent implements OnInit, AfterViewInit, AfterViewChecked {

  map: Map;
  maps = tileLayer('http://localhost:32770/styles/osm-bright/{z}/{x}/{y}.png',
    {
      detectRetina: false
    });

  options = {
    layers: [
      this.maps
    ],
    zoom: 10,
    preferCanvas: true,
    center: latLng([52.08095165, 5.12768031549829])
  };

  constructor(protected sparqlService: SparqlService,
    protected searchService: SearchService) {
    super(sparqlService);
  }

  ngAfterViewInit() {
  }

  ngAfterViewChecked() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  search(query: string) {
    this.searchService.search(query).subscribe(data => {
      console.log('retreived cords: ', data);
    });
  }

  ngOnInit() {
    if (this.template) {
      window[this.template] = this;
    }
  }

  onMapReady(map: Map) {
    this.map = map;
    // this.map.invalidateSize();
  }
}
