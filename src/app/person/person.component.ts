import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { SparqlService } from '../sparql.service';
import { ListComponent } from '../list/list.component';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.css']
})
export class PersonComponent extends ListComponent implements OnInit {

  person: Person;

  constructor(protected sparqlService: SparqlService) {
     super(sparqlService);
  }
  ngOnInit() {
  }

}

export class Person {
  label: string;
  uri: string;
  hasName: PersonName;
}

export class PersonName {
  prefix: string = null;
  literalName: string = null;
  firstName: string = null;
  givenName: string = null;
  baseSurname: string = null;
  surname: string = null;
  surnamePrefix: string = null;
  patronym: string = null;
  trailingPatronym: string = null;
  givenNameSuffix: string = null;
  infix: string = null;
  infixTitle: string = null;
  suffix: string = null;
  disambiguatingDescription: string = null;
  honorificSuffix: string = null;
}
