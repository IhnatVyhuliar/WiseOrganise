import type { EventArea, SixR, VendorCriterion, ChecklistItem, TeamRole, PilotConfig } from '../types';
export const sixRHierarchy: { rank: number; name: SixR; description: string }[] = [
 {rank:1,name:'Przemyśl',description:'Czy to w ogóle jest potrzebne na wydarzeniu?'},
 {rank:2,name:'Rezygnuj',description:'Odmów tego, co zbędne: gadżetów, druku i jednorazowych sztućców.'},
 {rank:3,name:'Ograniczaj',description:'Zamów tyle, ile trzeba, na przykład porcje według rejestracji.'},
 {rank:4,name:'Używaj ponownie',description:'Wybieraj naczynia, smycze i wyposażenie wielorazowe.'},
 {rank:5,name:'Naprawiaj',description:'Naprawiaj wyposażenie i dekoracje, aby służyły kolejnym edycjom.'},
 {rank:6,name:'Recykling',description:'Segreguj tylko to, czego nie dało się uniknąć.'}
];
const tag = (name: string) => [name];
export const eventAreas: EventArea[] = [
 {id:'dojazd',name:'Dojazd',stage:'Przed',lead:'Dojazd uczestników zwykle waży najwięcej. Pilot UŁ łączy kolej, autobusy elektryczne i godzinę startu dopasowaną do rozkładu.',providerQuestions:['Czy przewoźnik ma pojazdy elektryczne?','Czy kursy można dopasować do godzin wydarzenia?','Czy jest oferta grupowa?'],levels:[
  {level:1,label:'minimum',description:'Informacja o dojazdach transportem zbiorowym w zaproszeniu i na stronie.',why:'Jasna informacja od początku pomaga wybrać kolej lub autobus zamiast samochodu.',cost:'Bez dodatkowych kosztów',tags:tag('Transport niskoemisyjny')},
  {level:2,label:'lepiej',description:'Start i koniec dopasowane do rozkładu pociągów oraz organizacja wspólnych przejazdów.',why:'Godzina wydarzenia nie wyklucza kolei, a wspólny przejazd zmniejsza liczbę aut.',cost:'Bez dodatkowych kosztów',tags:['Transport niskoemisyjny','Cały cykl życia']},
  {level:3,label:'najlepiej',description:'Zniżka za dojazd zbiorowy, gra dla uczestników i autobus elektryczny z dworca.',why:'Zachęta sprawia, że transport zbiorowy jest wygodny i opłacalny.',cost:'Wymaga budżetu',tags:['Transport niskoemisyjny','Zachęty']}
 ]},
 {id:'zakwaterowanie',name:'Zakwaterowanie',stage:'Przed',lead:'Nocleg przy miejscu wydarzenia lub przystanku ogranicza codzienne przejazdy.',providerQuestions:['Jaka jest odległość od miejsca wydarzenia?','Czy da się dojechać bez samochodu?','Jak obiekt gospodaruje odpadami i energią?'],levels:[
  {level:1,label:'minimum',description:'Lista noclegów z dobrym dojazdem komunikacją miejską.',why:'Przystanek w pobliżu oznacza, że uczestnik nie potrzebuje auta.',cost:'Bez dodatkowych kosztów',tags:tag('Transport niskoemisyjny')},
  {level:2,label:'lepiej',description:'Noclegi w odległości krótkiego spaceru od miejsca wydarzenia.',why:'Codzienny dojazd znika z bilansu, gdy można przejść się pieszo.',cost:'Zależy od oferty',tags:['Lokalność','Transport niskoemisyjny']},
  {level:3,label:'najlepiej',description:'Noclegi pieszo, wybrane według kryteriów środowiskowych i społecznych.',why:'Liczy się odległość, odpady, energia i możliwość rezygnacji z samochodu.',cost:'Zależy od oferty',tags:['Lokalność','Kryteria dostawców']}
 ]},
 {id:'catering',name:'Catering',stage:'W trakcie',lead:'Lokalne i sezonowe jedzenie, porcje według rejestracji oraz naczynia wielorazowe łączą wpływ z oszczędnością.',providerQuestions:['Skąd są składniki i ile kilometrów jadą?','Ile składników jest sezonowych?','Czy naczynia są wielorazowe?','Co dzieje się z nadwyżkami jedzenia?'],note:'Naczynia wielorazowe stoją wyżej w 6R niż biodegradowalne jednorazówki. Biodegradowalne mają sens tylko z realnym kompostowaniem.',levels:[
  {level:1,label:'minimum',description:'Porcje według rejestracji i woda z dystrybutorów zamiast butelek.',why:'Dokładne porcje ograniczają odpady i koszt zamówienia.',cost:'Obniża koszt',tags:['6R Ograniczaj','6R Rezygnuj']},
  {level:2,label:'lepiej',description:'Produkty lokalne i sezonowe, bez egzotycznych składników, oraz naczynia wielorazowe.',why:'Jabłka z sadu pod Łodzią zastępują produkty wożone z daleka.',cost:'Zależy od oferty',tags:['Lokalność','Sezonowość','6R Używaj ponownie']},
  {level:3,label:'najlepiej',description:'Dostawcy z najbliższej okolicy, bez jednorazowych sztućców i z planem na nadwyżki.',why:'Krótka dostawa, brak odpadów u źródła i ustalony odbiór nadwyżek domykają obieg.',cost:'Zależy od oferty',tags:['Lokalność ≤ 20 km','6R Rezygnuj','Gospodarka cyrkularna']}
 ]},
 {id:'materialy',name:'Materiały',stage:'W trakcie',lead:'Każda niewydrukowana strona to mniej zużytych zasobów i niższy koszt.',providerQuestions:['Czy ta rzecz jest w ogóle potrzebna?','Z czego jest zrobiona?','Czy da się jej użyć ponownie?'],levels:[
  {level:1,label:'minimum',description:'Druk ograniczony do minimum, dwustronnie i na papierze z recyklingu.',why:'Powstaje tylko to, bez czego wydarzenie się nie obejdzie.',cost:'Obniża koszt',tags:['6R Ograniczaj']},
  {level:2,label:'lepiej',description:'Agenda i materiały cyfrowe na stronie oraz przez kod QR.',why:'Zmiana programu nie wymaga dodruku.',cost:'Obniża koszt',tags:['6R Rezygnuj']},
  {level:3,label:'najlepiej',description:'Zero druku, materiały online dostępne także po wydarzeniu.',why:'Treści żyją dłużej niż wydarzenie i nie trafiają do kosza.',cost:'Obniża koszt',tags:['6R Rezygnuj','Cały cykl życia']}
 ]},
 {id:'gadzety',name:'Gadżety',stage:'W trakcie',lead:'Najpierw pytamy, czy gadżet jest potrzebny. Najlepszy odpad to ten, który nie powstał.',providerQuestions:['Czy ta rzecz jest w ogóle potrzebna?','Z czego jest zrobiona?','Czy da się jej użyć ponownie?'],levels:[
  {level:1,label:'minimum',description:'Użyteczne gadżety bez daty i numeru edycji.',why:'Bez daty da się użyć rzeczy ponownie.',cost:'Zależy od oferty',tags:['6R Używaj ponownie']},
  {level:2,label:'lepiej',description:'Smycze i identyfikatory zbierane po wydarzeniu i używane ponownie.',why:'Zwrot wyposażenia obniża koszt kolejnych edycji.',cost:'Obniża koszt',tags:['6R Używaj ponownie','Gospodarka cyrkularna']},
  {level:3,label:'najlepiej',description:'Rezygnacja z gadżetów zgodnie z zasadą „Rezygnuj”.',why:'Nie trzeba produkować, transportować ani utylizować niepotrzebnych rzeczy.',cost:'Obniża koszt',tags:['6R Rezygnuj']}
 ]},
 {id:'ludzie',name:'Ludzie / obsługa',stage:'W trakcie',lead:'Zrównoważenie obejmuje warunki pracy: jasne zadania, umowę o pracę i lokalność obsługi.',providerQuestions:['Na jakiej umowie pracuje obsługa?','Czy obsługa jest lokalna?'],levels:[
  {level:1,label:'minimum',description:'Jasny podział zadań i checklista dla każdej osoby.',why:'Odpowiedzialność nie ginie między zespołami.',cost:'Bez dodatkowych kosztów',tags:['Organizacja zespołu']},
  {level:2,label:'lepiej',description:'Dostawcy i obsługa zatrudnieni na umowie o pracę.',why:'Godna praca jest częścią zrównoważonego wydarzenia.',cost:'Zależy od oferty',tags:['Umowa o pracę']},
  {level:3,label:'najlepiej',description:'Lokalna obsługa na umowie o pracę, z krótkim dojazdem.',why:'Wspierasz region i ograniczasz dojazdy personelu.',cost:'Zależy od oferty',tags:['Umowa o pracę','Lokalność']}
 ]},
 {id:'po-wydarzeniu',name:'Po wydarzeniu',stage:'Po',lead:'Cykl kończy się po powrocie uczestników, pomiarze odpadów i zapisaniu lekcji na kolejną edycję.',providerQuestions:['Jak zbierzemy ankietę dojazdu?','Jak zważymy odpady według rodzajów?','Jakie dane z faktur są potrzebne?'],levels:[
  {level:1,label:'minimum',description:'Segregacja odpadów na miejscu.',why:'Recykling jest ostatnim krokiem 6R i dotyczy tego, czego nie uniknięto.',cost:'Bez dodatkowych kosztów',tags:['6R Recykling']},
  {level:2,label:'lepiej',description:'Pomiar odpadów i ankieta dojazdu uczestników.',why:'Dane pokazują, czy wybory zadziałały.',cost:'Wymaga czasu zespołu',tags:['Cały cykl życia']},
  {level:3,label:'najlepiej',description:'Porównanie wpływu przed i po oraz wnioski na następną edycję.',why:'Raport zamienia doświadczenie w konkretne ulepszenia.',cost:'Wymaga czasu zespołu',tags:['Cały cykl życia']}
 ]}
];
export const vendorCriteria: VendorCriterion[] = [
 {name:'Pochodzenie i odległość',howToVerify:'Zapytaj, skąd pochodzą produkty i ile kilometrów jadą.',warning:'„Lokalne” bez podania miejsca pochodzenia.'},
 {name:'Sezonowość',howToVerify:'Porównaj propozycję z sezonem w regionie.',warning:'Egzotyczne lub poza sezonem produkty w ofercie „eko”.'},
 {name:'Opakowania i odpady',howToVerify:'Zapytaj o naczynia wielorazowe i odbiór zwrotny.',warning:'Jednorazowe „ekologiczne” bez systemu zagospodarowania.'},
 {name:'Transport dostawy',howToVerify:'Zapytaj o flotę i łączenie dostaw.',warning:'Brak odpowiedzi lub wiele osobnych kursów.'},
 {name:'Zatrudnienie na umowę o pracę',howToVerify:'Zapytaj o formę zatrudnienia stałego personelu.',warning:'Brak umowy o pracę dla stałego personelu.'},
 {name:'Dowody zamiast haseł',howToVerify:'Poproś o certyfikaty lub dane możliwe do weryfikacji.',warning:'Ogólne „eko”, „zielony” lub „neutralny klimatycznie” bez dowodów.'},
 {name:'Przejrzystość',howToVerify:'Sprawdź, czy firma publikuje konkretne dane o wpływie.',warning:'Wyłącznie marketing, brak liczb.'}
];
export const organizerChecklist: ChecklistItem[] = [
 {id:'o1',area:'Dojazd',label:'Sprawdź połączenia kolejowe i autobusowe do UŁ oraz dopasuj godzinę rozpoczęcia do pociągów.'},
 {id:'o2',area:'Dojazd',label:'Dodaj transport zbiorowy do zaproszenia i strony wydarzenia.'},
 {id:'o3',area:'Dojazd',label:'Uruchom zapisy na wspólne przejazdy.'},
 {id:'o4',area:'Zakwaterowanie',label:'Przygotuj listę noclegów w zasięgu spaceru lub komunikacji.'},
 {id:'o5',area:'Catering',label:'Zamów porcje według rejestracji i ustal odbiór nadwyżek.'},
 {id:'o6',area:'Materiały',label:'Opublikuj agendę online z kodem QR zamiast druku.'},
 {id:'o7',area:'Ludzie',label:'Wyślij dostawcom pytania o kryteria, w tym o umowę o pracę.'},
 {id:'o8',area:'Po wydarzeniu',label:'Zaplanuj wagę odpadów i ankietę dojazdu.'}
];
export const teamRoles: TeamRole[] = [
 {role:'Transport',contact:'[IMIĘ I NAZWISKO · TELEFON / E-MAIL]',tasks:['Rozkład pociągów i godzina rozpoczęcia','Wspólne przejazdy','Pytania do przewoźnika']},
 {role:'Catering',contact:'[IMIĘ I NAZWISKO · TELEFON / E-MAIL]',tasks:['Porcje zgodne z rejestracją','Menu lokalne i sezonowe','Odbiór nadwyżek jedzenia']},
 {role:'Materiały i gadżety',contact:'[IMIĘ I NAZWISKO · TELEFON / E-MAIL]',tasks:['Agenda online i kod QR','Smycze bez daty edycji','Zbiórka smyczy przy wyjściu']},
 {role:'Po wydarzeniu',contact:'[IMIĘ I NAZWISKO · TELEFON / E-MAIL]',tasks:['Segregacja na miejscu','Ważenie odpadów','Ankieta o dojeździe']}
];
export const defaultPilot: PilotConfig = {city:'Uniwersytet Łódzki, Łódź',radiusKm:20,eventStart:'09:30',prioritizeRail:true,prioritizeElectricBuses:true};
