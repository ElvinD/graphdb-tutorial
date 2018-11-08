import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { SparqlService } from '../sparql.service';
import { ItemData } from '../itemdata';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {

  static PREFIXES = `
  PREFIX hg: <https://rdf.histograph.io/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX dbo: <http://dbpedia.org/ontology/>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX imt: <http://immigrants.tutorial/>
  PREFIX pnv: <https://w3id.org/pnv/>`;

  @Input() items: ItemData[] = [];
  @Input() template = null;
  @Input() itemsChanged: Observable<any>;
  @Output() select: EventEmitter<ItemData[]> = new EventEmitter();

  itemsSubscription: any;

  constructor(
    private sparqlService: SparqlService) { }

  ngOnInit() {
    if (this.template) {
      this.getRDF();
    }
    if (this.itemsChanged) {
      this.itemsSubscription = this.itemsChanged.subscribe((event) => this.onSelect(event));
    }
  }

  onClick(item: ItemData): void {
    item.selected = item.selected ? false : true;
    this.emitSelection();
    // console.log('clicked: ', item);
  }

  private emitSelection(): void {
    const items: ItemData[] = [];
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].selected) {
        items.push(this.items[i]);
      }
    }
    this.select.emit(items);
  }

  onSelect(items: ItemData[]): void {
    if (items.length) {
      if (items[0].template === this.template) {
        // console.log('This was me sending the event, ignoring: ', items[0].template);
      } else {
        // console.log('received some things: ', items);
        this.query(items);
      }
    } else {
      console.log('received empty argument');
      this.getRDF();
    }
  }

  private getRDF(): void {
    let query: string;
    switch (this.template) {
      case 'person':
        query = `
        ${ListComponent.PREFIXES}
        select ?uri ?name ?firstName ?infix ?surname ?place where {
          ?uri a pnv:Person ;
          dbo:residence ?place ;
          pnv:hasName ?nameURI .
          optional { ?nameURI pnv:literalName ?name } .
          optional { ?nameURI pnv:firstName ?firstName } .
          optional { ?nameURI pnv:infix ?infix } .
          optional { ?nameURI pnv:surname ?surname } .
        } limit 100`;
      break;

      case 'place':
        query = `
        ${ListComponent.PREFIXES}
          select ?uri ?name (count(?residents) as ?hits) where {
	          ?uri dct:type hg:Place ;
            rdfs:label ?name .
            ?residents dbo:residence ?uri
          }
          group by ?uri ?name
          order by desc(?hits)`;
      break;

      case 'province':
      query = `
        ${ListComponent.PREFIXES}
        select ?uri ?name (count(?residents) as ?hits) where {
	      ?uri dct:type hg:Province ;
        rdfs:label ?name .
        ?place hg:liesIn ?uri .
        ?residents dbo:residence ?place
        }
        group by ?uri ?name
      order by desc(?hits)`;
      break;

      default:
      query = `
      ${ListComponent.PREFIXES}
      select ?uri ?name ?firstName ?infix ?surname ?residence where {
        ?uri a pnv:Person ;
        dbo:residence ?residence ;
        pnv:hasName ?nameURI .
        optional { ?nameURI pnv:literalName ?name } .
        optional { ?nameURI pnv:firstName ?firstName } .
        optional { ?nameURI pnv:infix ?infix } .
        optional { ?nameURI pnv:surname ?surname } .
      } limit 100`;
      break;
    }
    this.sparqlService.getRDF(query)
     .subscribe(data => {
        this.cleanupData();
        this.parseResults(data);
      });
    }

    private query(items: ItemData[]): void {
      let query: string = null;
      switch (this.template) {
        case 'person':
          query = `
          ${ListComponent.PREFIXES}
          select ?uri ?name ?firstName ?infix ?surname ?place ?province where {
            ?uri a pnv:Person ;
            pnv:hasName ?nameURI .
            optional { ?nameURI pnv:literalName ?name } .
            optional { ?nameURI pnv:firstName ?firstName } .
            optional { ?nameURI pnv:infix ?infix } .
            optional { ?nameURI pnv:surname ?surname } .
            ?uri dbo:residence ?residence .
            ${items.map(item => `?residence hg:liesIn <${item.uri}> .`).join(' ')}
            ?residence hg:liesIn ?province
          } limit 100`;
        break;

        case 'place':
          query = `
          ${ListComponent.PREFIXES}
          select distinct  ?uri ?name (count(?residents) as ?hits) ?province where {
	          ?uri dct:type hg:Place ;
	          rdfs:label ?name .
            ?residents dbo:residence ?uri .
            ${items.map(item => `?uri hg:liesIn <${item.uri}> .`).join(' ')}
            ?uri hg:liesIn ?province
          }
          group by ?uri ?name ?province
          order by desc(?hits)`;
        break;

        case 'province':
        query = `
          ${ListComponent.PREFIXES}
          select ?uri ?name (count(?residents) as ?hits) where {
          ?uri dct:type hg:Province ;
          rdfs:label ?name .
          ?place hg:liesIn ?uri .
          ?residents dbo:residence ?place
          }
          group by ?uri ?name
        order by desc(?hits)`;
        break;

        default:
        query = `
        ${ListComponent.PREFIXES}
        select ?uri ?name ?firstName ?infix ?surname ?residence where {
          ?uri a pnv:Person ;
          dbo:residence ?residence ;
          pnv:hasName ?nameURI .
          optional { ?nameURI pnv:literalName ?name } .
          optional { ?nameURI pnv:firstName ?firstName } .
          optional { ?nameURI pnv:infix ?infix } .
          optional { ?nameURI pnv:surname ?surname } .
        } limit 100`;
        break;
      }
      console.log('query is: ', query);
      if (query) {
        this.sparqlService.getRDF(query)
         .subscribe(data => {
           this.cleanupData();
           this.parseResults(data);
          });
      }
    }

    private cleanupData(): void {
      for (let i = 0; i < this.items.length; i++) {
        this.items[i] = null;
      }
      this.items = [];
    }

    private parseResults(results: any): void {
      console.log ('results: ', results);
      let resultData: any;
      const tempDict: { [uri: string]: ItemData } = {};
      let itemdata: ItemData;
      let key: string;
      let name: string;
      let label: string;
      let hits: number;
      for (let i = 0; i < results['results']['bindings'].length; i++ ) {
        resultData = results['results']['bindings'][i];
        key = resultData['uri'] ? resultData['uri']['value'] : null ;
        name = label = resultData['name'] ? resultData['name']['value'] : null;
        hits = resultData['hits'] ? resultData['hits']['value'] : null;
        if (null == tempDict[key]) {
          itemdata = new ItemData();
          tempDict[key] = itemdata;
        } else {
          itemdata = tempDict[key];
        }
        itemdata.uri = key;
        itemdata.hits = hits;
        itemdata.name = name;
        itemdata.label = name;
        itemdata.template = this.template;
      this.items.push(itemdata);
    }
  }
}
