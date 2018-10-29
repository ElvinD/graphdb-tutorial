import { Component, OnInit, Input, AfterContentInit } from '@angular/core';
import { SparqlService } from '../sparql.service';
import { Persondata } from '../persondata';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, AfterContentInit {

  @Input() data: Persondata[] = [];

  constructor(private sparqlService: SparqlService) { }

  ngOnInit() {
  }

  ngAfterContentInit() {
    this.getRDF();
  }

  private getRDF(): void {
    const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    select ?person ?name where {
      ?person a foaf:Person ;
      foaf:givenName ?name
    } limit 100 `;
    this.sparqlService.getRDF(query)
     .subscribe(data => {
        this.parseResults(data);
      });
    }

    private parseResults(results: any): void {
      let resultData: any;
      const tempDict: { [uri: string]: Persondata } = {};
      let persondata: Persondata;
      let key: string;
      let name: string;
      for (let i = 0; i < results['results']['bindings'].length; i++ ) {
        resultData = results['results']['bindings'][i];
        key = resultData['person']['value'];
        name = resultData['name']['value'];
        if (null == tempDict[key]) {
          persondata = new Persondata();
          tempDict[key] = persondata;
        } else {
          persondata = tempDict[key];
        }
        persondata.uri = key;
        persondata.name = name;
      this.data.push(persondata);
    }
    console.log('results: ', this.data);
  }
}
