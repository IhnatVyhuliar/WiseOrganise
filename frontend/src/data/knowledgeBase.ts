import type { AreaCriteria, AreaId, EventArea, SixR, VendorCriterion, ChecklistItem, TeamRole, PilotConfig } from '../types';
import { greenwashingRisks } from './knowledgeExtras';
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
 {id:'dojazd',name:'Dojazd',stage:'Przed',lead:'Dojazd uczestników zwykle waży najwięcej. Kolej, autobusy elektryczne i godzina startu dopasowana do rozkładu.',providerQuestions:['Czy przewoźnik ma pojazdy elektryczne?','Czy kursy można dopasować do godzin wydarzenia?','Czy jest oferta grupowa?'],levels:[
  {level:1,label:'minimum',description:'Informacja o dojazdach transportem zbiorowym w zaproszeniu i na stronie.',why:'Jasna informacja od początku pomaga wybrać kolej lub autobus zamiast samochodu.',cost:'Bez dodatkowych kosztów',tags:tag('Transport niskoemisyjny'),sixR:['Przemyśl']},
  {level:2,label:'lepiej',description:'Start i koniec dopasowane do rozkładu pociągów oraz organizacja wspólnych przejazdów.',why:'Godzina wydarzenia nie wyklucza kolei, a wspólny przejazd zmniejsza liczbę aut.',cost:'Bez dodatkowych kosztów',tags:['Transport niskoemisyjny','Cały cykl życia'],sixR:['Ograniczaj']},
  {level:3,label:'najlepiej',description:'Zniżka za dojazd zbiorowy, gra dla uczestników i autobus elektryczny z dworca.',why:'Zachęta sprawia, że transport zbiorowy jest wygodny i opłacalny.',cost:'Wymaga budżetu',tags:['Transport niskoemisyjny','Zachęty'],sixR:['Ograniczaj']}
 ]},
 {id:'zakwaterowanie',name:'Zakwaterowanie',stage:'Przed',lead:'Nocleg przy miejscu wydarzenia lub przystanku ogranicza codzienne przejazdy.',providerQuestions:['Jaka jest odległość od miejsca wydarzenia?','Czy da się dojechać bez samochodu?','Jak obiekt gospodaruje odpadami i energią?'],levels:[
  {level:1,label:'minimum',description:'Lista noclegów z dobrym dojazdem komunikacją miejską.',why:'Przystanek w pobliżu oznacza, że uczestnik nie potrzebuje auta.',cost:'Bez dodatkowych kosztów',tags:tag('Transport niskoemisyjny'),sixR:['Przemyśl']},
  {level:2,label:'lepiej',description:'Noclegi w odległości krótkiego spaceru od miejsca wydarzenia.',why:'Codzienny dojazd znika z bilansu, gdy można przejść się pieszo.',cost:'Zależy od oferty',tags:['Lokalność','Transport niskoemisyjny'],sixR:['Ograniczaj']},
  {level:3,label:'najlepiej',description:'Noclegi pieszo, wybrane według kryteriów środowiskowych i społecznych.',why:'Liczy się odległość, odpady, energia i możliwość rezygnacji z samochodu.',cost:'Zależy od oferty',tags:['Lokalność','Kryteria dostawców'],sixR:['Ograniczaj']}
 ]},
 {id:'catering',name:'Catering',stage:'W trakcie',lead:'Lokalne i sezonowe jedzenie, porcje według rejestracji oraz naczynia wielorazowe łączą wpływ z oszczędnością.',providerQuestions:['Skąd są składniki i ile kilometrów jadą?','Ile składników jest sezonowych?','Czy naczynia są wielorazowe?','Co dzieje się z nadwyżkami jedzenia?'],note:'Naczynia wielorazowe stoją wyżej w 6R niż biodegradowalne jednorazówki. Biodegradowalne mają sens tylko z realnym kompostowaniem.',levels:[
  {level:1,label:'minimum',description:'Porcje według rejestracji i woda z dystrybutorów zamiast butelek.',why:'Dokładne porcje ograniczają odpady i koszt zamówienia.',cost:'Obniża koszt',tags:['6R Ograniczaj','6R Rezygnuj'],sixR:['Ograniczaj']},
  {level:2,label:'lepiej',description:'Produkty lokalne i sezonowe, bez egzotycznych składników, oraz naczynia wielorazowe.',why:'Jabłka z sadu pod miejscem wydarzenia zastępują produkty wożone z daleka.',cost:'Zależy od oferty',tags:['Lokalność','Sezonowość','6R Używaj ponownie'],sixR:['Używaj ponownie']},
  {level:3,label:'najlepiej',description:'Dostawcy z najbliższej okolicy, bez jednorazowych sztućców i z planem na nadwyżki.',why:'Krótka dostawa, brak odpadów u źródła i ustalony odbiór nadwyżek domykają obieg.',cost:'Zależy od oferty',tags:['Lokalność ≤ 20 km','6R Rezygnuj','Gospodarka cyrkularna'],sixR:['Rezygnuj','Używaj ponownie']}
 ]},
 {id:'materialy',name:'Materiały',stage:'W trakcie',lead:'Każda niewydrukowana strona to mniej zużytych zasobów i niższy koszt.',providerQuestions:['Czy ta rzecz jest w ogóle potrzebna?','Z czego jest zrobiona?','Czy da się jej użyć ponownie?'],levels:[
  {level:1,label:'minimum',description:'Druk ograniczony do minimum, dwustronnie i na papierze z recyklingu.',why:'Powstaje tylko to, bez czego wydarzenie się nie obejdzie.',cost:'Obniża koszt',tags:['6R Ograniczaj'],sixR:['Ograniczaj']},
  {level:2,label:'lepiej',description:'Agenda i materiały cyfrowe na stronie oraz przez kod QR.',why:'Zmiana programu nie wymaga dodruku.',cost:'Obniża koszt',tags:['6R Rezygnuj'],sixR:['Rezygnuj']},
  {level:3,label:'najlepiej',description:'Zero druku, materiały online dostępne także po wydarzeniu.',why:'Treści żyją dłużej niż wydarzenie i nie trafiają do kosza.',cost:'Obniża koszt',tags:['6R Rezygnuj','Cały cykl życia'],sixR:['Rezygnuj']}
 ]},
 {id:'gadzety',name:'Gadżety',stage:'W trakcie',lead:'Najpierw pytamy, czy gadżet jest potrzebny. Najlepszy odpad to ten, który nie powstał.',providerQuestions:['Czy ta rzecz jest w ogóle potrzebna?','Z czego jest zrobiona?','Czy da się jej użyć ponownie?'],levels:[
  {level:1,label:'minimum',description:'Użyteczne gadżety bez daty i numeru edycji.',why:'Bez daty da się użyć rzeczy ponownie.',cost:'Zależy od oferty',tags:['6R Używaj ponownie'],sixR:['Używaj ponownie']},
  {level:2,label:'lepiej',description:'Smycze i identyfikatory zbierane po wydarzeniu i używane ponownie.',why:'Zwrot wyposażenia obniża koszt kolejnych edycji.',cost:'Obniża koszt',tags:['6R Używaj ponownie','Gospodarka cyrkularna'],sixR:['Używaj ponownie']},
  {level:3,label:'najlepiej',description:'Rezygnacja z gadżetów zgodnie z zasadą „Rezygnuj”.',why:'Nie trzeba produkować, transportować ani utylizować niepotrzebnych rzeczy.',cost:'Obniża koszt',tags:['6R Rezygnuj'],sixR:['Rezygnuj']}
 ]},
 {id:'ludzie',name:'Ludzie / obsługa',stage:'W trakcie',lead:'Zrównoważenie obejmuje warunki pracy: jasne zadania, umowę o pracę i lokalność obsługi.',providerQuestions:['Na jakiej umowie pracuje obsługa?','Czy obsługa jest lokalna?'],levels:[
  {level:1,label:'minimum',description:'Jasny podział zadań i checklista dla każdej osoby.',why:'Odpowiedzialność nie ginie między zespołami.',cost:'Bez dodatkowych kosztów',tags:['Organizacja zespołu'],sixR:['Przemyśl']},
  {level:2,label:'lepiej',description:'Dostawcy i obsługa zatrudnieni na umowie o pracę.',why:'Godna praca jest częścią zrównoważonego wydarzenia.',cost:'Zależy od oferty',tags:['Umowa o pracę'],sixR:['Przemyśl']},
  {level:3,label:'najlepiej',description:'Lokalna obsługa na umowie o pracę, z krótkim dojazdem.',why:'Wspierasz region i ograniczasz dojazdy personelu.',cost:'Zależy od oferty',tags:['Umowa o pracę','Lokalność'],sixR:['Ograniczaj']}
 ]},
 {id:'po-wydarzeniu',name:'Po wydarzeniu',stage:'Po',lead:'Cykl kończy się po powrocie uczestników, pomiarze odpadów i zapisaniu lekcji na kolejną edycję.',providerQuestions:['Jak zbierzemy ankietę dojazdu?','Jak zważymy odpady według rodzajów?','Jakie dane z faktur są potrzebne?'],levels:[
  {level:1,label:'minimum',description:'Segregacja odpadów na miejscu.',why:'Recykling jest ostatnim krokiem 6R i dotyczy tego, czego nie uniknięto.',cost:'Bez dodatkowych kosztów',tags:['6R Recykling'],sixR:['Recykling']},
  {level:2,label:'lepiej',description:'Pomiar odpadów i ankieta dojazdu uczestników.',why:'Dane pokazują, czy wybory zadziałały.',cost:'Wymaga czasu zespołu',tags:['Cały cykl życia'],sixR:['Recykling']},
  {level:3,label:'najlepiej',description:'Porównanie wpływu przed i po oraz wnioski na następną edycję.',why:'Raport zamienia doświadczenie w konkretne ulepszenia.',cost:'Wymaga czasu zespołu',tags:['Cały cykl życia'],sixR:['Recykling']}
 ]},
 {id:'miejsce-i-sala',name:'Miejsce i sala',stage:'Przed',lead:'Dobre miejsce znosi przejazdy między punktami i przesądza o odpadach, energii i wodzie na całym wydarzeniu.',providerQuestions:['Jak daleko jest najbliższy przystanek i czy dojście jest wygodne?','Jak obiekt gospodaruje odpadami, energią i wodą?','Czy można skorzystać z wyposażenia obiektu zamiast wynajmować osobno?'],levels:[
  {level:1,label:'minimum',description:'Sala w budynku dostępnym komunikacją zbiorową, bez przejazdów między punktami.',why:'Jeden dobrze skomunikowany adres znosi potrzebę dodatkowych przejazdów w trakcie wydarzenia.',cost:'Bez dodatkowych kosztów',tags:['Transport niskoemisyjny','Lokalność'],sixR:['Przemyśl']},
  {level:2,label:'lepiej',description:'Całe wydarzenie w jednym budynku, sala dobrana do liczby osób, wyposażenie z zasobów uczelni.',why:'Sala na miarę i sprzęt, który już jest, to mniej ogrzewania, mniej transportu i niższy koszt.',cost:'Zależy od oferty',tags:['Gospodarka cyrkularna','6R Ograniczaj'],sixR:['Ograniczaj']},
  {level:3,label:'najlepiej',description:'Obiekt wybrany według kryteriów: odpady, energia, woda, dostęp bez samochodu i wielokrotne użycie wyposażenia.',why:'Miejsce przesądza o większości śladu wydarzenia, więc warto wybierać je tak starannie jak catering.',cost:'Zależy od oferty',tags:['Kryteria dostawców','Cały cykl życia'],sixR:['Przemyśl','Używaj ponownie']}
 ]},
 {id:'energia-i-woda',name:'Energia i woda',stage:'W trakcie',lead:'Zużycie prądu i wody rzadko ktoś liczy, a to jedyne dane, które da się odczytać wprost z licznika.',providerQuestions:['Czy da się odczytać zużycie energii w salach wydarzenia?','Czy jest dostęp do wody z kranu lub dystrybutora?','Czy sprzęt nagłośnieniowy i AV można wypożyczyć zamiast kupować?'],levels:[
  {level:1,label:'minimum',description:'Wyłączanie sprzętu i światła w nieużywanych salach, zero wody w butelkach jednorazowych.',why:'Najtańsza oszczędność to ta, której nie trzeba kupować: zgaszone światło i kran zamiast butelki.',cost:'Bez dodatkowych kosztów',tags:['6R Ograniczaj','6R Rezygnuj'],sixR:['Ograniczaj']},
  {level:2,label:'lepiej',description:'Dystrybutory wody i własne kubki uczestników, sprzęt AV wypożyczony zamiast kupowanego.',why:'Sprzęt na kilka dni nie musi być kupowany na własność, a kubek wielorazowy zastępuje setki butelek.',cost:'Zależy od oferty',tags:['6R Używaj ponownie','Gospodarka cyrkularna'],sixR:['Używaj ponownie']},
  {level:3,label:'najlepiej',description:'Pomiar zużycia energii i wody w trakcie wydarzenia i zapisanie wyniku na kolejną edycję.',why:'Odczyt z licznika to twarda liczba, nie szacunek, i od razu pokazuje, gdzie szukać oszczędności.',cost:'Wymaga czasu zespołu',tags:['Cały cykl życia'],sixR:['Przemyśl','Recykling']}
 ]},
 {id:'komunikacja',name:'Komunikacja i promocja',stage:'Przed',lead:'Promocja potrafi wyprodukować więcej odpadów niż samo wydarzenie, a jest w całości w rękach organizatora.',providerQuestions:['Czy ten materiał musi powstać w druku?','Czy oznakowanie da się użyć ponownie na kolejnej edycji?','Gdzie materiały będą przechowywane po wydarzeniu?'],levels:[
  {level:1,label:'minimum',description:'Zaproszenia i promocja wyłącznie cyfrowe, bez druku i bez gadżetów promocyjnych.',why:'Komunikat cyfrowy dociera dalej niż ulotka i nie zostawia po sobie niczego do wyrzucenia.',cost:'Obniża koszt',tags:['6R Rezygnuj'],sixR:['Rezygnuj']},
  {level:2,label:'lepiej',description:'Komunikat o zasadach zrównoważonych wysłany uczestnikom przed wydarzeniem: dojazd, kubek, porcje.',why:'Uczestnik, który zna zasady wcześniej, przyjeżdża pociągiem i zabiera własny kubek.',cost:'Obniża koszt',tags:['Cały cykl życia','Zachęty'],sixR:['Przemyśl']},
  {level:3,label:'najlepiej',description:'Oznakowanie i roll-upy bez daty i numeru edycji, przechowywane do kolejnych wydarzeń.',why:'Baner bez daty służy latami, a magazyn kosztuje mniej niż druk za każdym razem.',cost:'Obniża koszt',tags:['6R Używaj ponownie','Gospodarka cyrkularna'],sixR:['Używaj ponownie']}
 ]},
 {id:'dostepnosc',name:'Dostępność',stage:'W trakcie',lead:'Zrównoważone wydarzenie jest dostępne dla wszystkich: bariera na drodze do sali wyklucza tak samo jak brak dojazdu.',providerQuestions:['Czy droga od przystanku do sali jest bez barier?','Czy materiały będą dostępne cyfrowo po wydarzeniu?','Kto zapewnia tłumaczenie lub napisy i na jakich warunkach?'],levels:[
  {level:1,label:'minimum',description:'Informacja o dostępności miejsca i dojazdu podana w zaproszeniu.',why:'Uczestnik musi wiedzieć przed wyjazdem, czy dotrze na miejsce bez przeszkód.',cost:'Bez dodatkowych kosztów',tags:['Dostępność'],sixR:['Przemyśl']},
  {level:2,label:'lepiej',description:'Wejście bez barier, oznakowana droga od przystanku i miejsce na odpoczynek.',why:'Oznakowana trasa i miejsce do odpoczynku sprawiają, że transport zbiorowy jest realną opcją dla wszystkich.',cost:'Zależy od oferty',tags:['Dostępność','Transport niskoemisyjny'],sixR:['Przemyśl']},
  {level:3,label:'najlepiej',description:'Tłumaczenie lub napisy oraz materiały w wersji dostępnej cyfrowo po wydarzeniu.',why:'Materiały dostępne po wydarzeniu żyją dłużej niż sala i docierają do osób, które nie mogły przyjechać.',cost:'Wymaga budżetu',tags:['Dostępność','Cały cykl życia'],sixR:['Przemyśl','Ograniczaj']}
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
export const areaCriteria: AreaCriteria[] = [
 {areaId:'dojazd',areaName:'Dojazd',criteria:[
  {name:'Tabor i napęd pojazdów',howToVerify:'Zapytaj, jakimi pojazdami przewoźnik dysponuje i ile z nich jest elektrycznych lub hybrydowych.',evidence:'Wykaz pojazdów z rokiem produkcji i rodzajem napędu.',warning:'Deklaracja ekologicznej floty bez podania liczby i typu pojazdów.'},
  {name:'Dopasowanie kursów do godzin wydarzenia',howToVerify:'Podaj godzinę startu i zakończenia i zapytaj, czy kursy da się do nich dopasować.',evidence:'Propozycja rozkładu kursów na dzień wydarzenia.',warning:'Sztywny rozkład, do którego uczestnik ma dostosować się sam.'},
  {name:'Warunki oferty grupowej',howToVerify:'Zapytaj o próg liczby osób, cenę i termin potwierdzenia przejazdu grupowego.',evidence:'Pisemna oferta grupowa z progiem i terminem.',warning:'Zniżka obiecana ustnie, bez progu i bez terminu.'}
 ]},
 {areaId:'zakwaterowanie',areaName:'Zakwaterowanie',criteria:[
  {name:'Odległość i dojście pieszo',howToVerify:'Sprawdź na mapie czas dojścia z obiektu do miejsca wydarzenia i do przystanku.',evidence:'Adres obiektu i czas dojścia podany w minutach.',warning:'Opis w centrum lub blisko bez podania adresu.'},
  {name:'Gospodarka odpadami i energią w obiekcie',howToVerify:'Zapytaj, jak obiekt segreguje odpady i czy ogranicza zużycie energii.',evidence:'Opis systemu segregacji oraz rachunek lub odczyt zużycia.',warning:'Odpowiedź dbamy o środowisko bez wskazania, na czym to polega.'},
  {name:'Rezygnacja z codziennej wymiany pościeli',howToVerify:'Zapytaj, czy przy kilkudniowym pobycie można zrezygnować z codziennej wymiany ręczników i pościeli.',evidence:'Potwierdzenie takiej opcji w rezerwacji grupowej.',warning:'Codzienna wymiana jako jedyny możliwy standard.'}
 ]},
 {areaId:'catering',areaName:'Catering',criteria:[
  {name:'Lista składników z kilometrażem',howToVerify:'Poproś o listę głównych składników z miejscem pochodzenia i dystansem dostawy.',evidence:'Zestawienie składników z adresem dostawcy i liczbą kilometrów.',warning:'Menu bez wskazania, skąd pochodzą produkty.'},
  {name:'Udział produktów sezonowych w menu',howToVerify:'Porównaj proponowane menu z kalendarzem sezonowym regionu.',evidence:'Menu z zaznaczonymi produktami sezonowymi.',warning:'Owoce i warzywa poza sezonem w ofercie opisanej jako eko.'},
  {name:'Naczynia wielorazowe wraz z myciem i odbiorem',howToVerify:'Zapytaj, kto dostarcza, myje i odbiera naczynia wielorazowe.',evidence:'Zapis w ofercie o dostawie, myciu i odbiorze naczyń.',warning:'Jednorazówki biodegradowalne proponowane jako rozwiązanie równorzędne wielorazowym.'},
  {name:'Ustalony odbiór nadwyżek jedzenia',howToVerify:'Ustal przed wydarzeniem, kto odbiera nadwyżki i w jakim czasie.',evidence:'Pisemne ustalenie z odbiorcą nadwyżek i godzina odbioru.',warning:'Zapewnienie, że nadwyżek nie będzie, bez planu na wypadek, gdyby były.'}
 ]},
 {areaId:'materialy',areaName:'Materiały',criteria:[
  {name:'Nakład i uzasadnienie druku',howToVerify:'Dla każdej pozycji zapytaj, ile sztuk i dlaczego nie wystarczy wersja cyfrowa.',evidence:'Zestawienie pozycji z nakładem i uzasadnieniem.',warning:'Nakład ustalany z zapasem, bez podania liczby.'},
  {name:'Surowiec i certyfikat papieru',howToVerify:'Zapytaj o udział makulatury w papierze i o certyfikat.',evidence:'Nazwa papieru i numer certyfikatu.',warning:'Papier opisany jako ekologiczny bez nazwy i certyfikatu.'},
  {name:'Ponowne użycie po wydarzeniu',howToVerify:'Zapytaj, co stanie się z materiałami po wydarzeniu i czy da się ich użyć ponownie.',evidence:'Wskazanie konkretnego kolejnego zastosowania lub odbiorcy.',warning:'Materiały z datą i numerem edycji, których nie da się użyć ponownie.'}
 ]},
 {areaId:'gadzety',areaName:'Gadżety',criteria:[
  {name:'Realna potrzeba i los rzeczy po wydarzeniu',howToVerify:'Zapytaj zespół, co uczestnik zrobi z tą rzeczą tydzień po wydarzeniu.',evidence:'Pisemne uzasadnienie potrzeby albo decyzja o rezygnacji.',warning:'Gadżet zamawiany, bo zawsze był, bez odpowiedzi na pytanie o potrzebę.'},
  {name:'Skład materiałowy',howToVerify:'Zapytaj, z czego rzecz jest zrobiona i czy da się ją rozdzielić na surowce.',evidence:'Karta produktu ze składem materiałowym.',warning:'Opis eko bez podania materiału.'},
  {name:'Brak daty i numeru edycji',howToVerify:'Sprawdź projekt pod kątem daty, roku i numeru edycji.',evidence:'Projekt graficzny do akceptacji bez daty i numeru.',warning:'Nadruk z rokiem, który skazuje rzecz na jedną edycję.'},
  {name:'Punkt zwrotu smyczy i identyfikatorów',howToVerify:'Ustal miejsce i osobę odpowiedzialną za zbiórkę przy wyjściu.',evidence:'Plan sali z oznaczonym punktem zwrotu.',warning:'Zbiórka zaplanowana, ale bez miejsca i bez osoby.'}
 ]},
 {areaId:'miejsce-i-sala',areaName:'Miejsce i sala',criteria:[
  {name:'Dostęp bez samochodu',howToVerify:'Sprawdź odległość od przystanku i częstotliwość kursów w godzinach wydarzenia.',evidence:'Nazwa przystanku, dystans i rozkład na dzień wydarzenia.',warning:'Dojazd opisany wyłącznie przez liczbę miejsc parkingowych.'},
  {name:'Segregacja i odbiór odpadów w obiekcie',howToVerify:'Zapytaj, jakie frakcje obiekt zbiera i kto je odbiera.',evidence:'Opis frakcji i umowa obiektu z odbiorcą odpadów.',warning:'Pojemniki do segregacji bez oddzielnego odbioru.'},
  {name:'Sprzęt obiektu zamiast wynajmu zewnętrznego',howToVerify:'Zapytaj, co z nagłośnienia, rzutników i mebli obiekt ma na miejscu.',evidence:'Lista wyposażenia dostępnego w cenie sali.',warning:'Pusta sala i konieczność dowiezienia całego wyposażenia.'}
 ]},
 {areaId:'energia-i-woda',areaName:'Energia i woda',criteria:[
  {name:'Możliwość odczytu zużycia energii',howToVerify:'Zapytaj, czy sale mają licznik, który da się odczytać przed wydarzeniem i po nim.',evidence:'Dwa odczyty licznika z datą i godziną.',warning:'Brak możliwości odczytu i odpowiedź, że to nieistotne.'},
  {name:'Dostęp do wody z kranu lub dystrybutora',howToVerify:'Sprawdź, ile punktów poboru wody jest w zasięgu sal.',evidence:'Plan sali z zaznaczonymi punktami poboru wody.',warning:'Woda dostępna wyłącznie w butelkach jednorazowych.'},
  {name:'Wypożyczenie sprzętu AV zamiast zakupu',howToVerify:'Porównaj koszt wypożyczenia z zakupem przy przewidywanej liczbie użyć.',evidence:'Oferta wypożyczenia z terminem zwrotu.',warning:'Zakup sprzętu na jedno wydarzenie, bez planu dalszego użycia.'}
 ]},
 {areaId:'komunikacja',areaName:'Komunikacja i promocja',criteria:[
  {name:'Kanały wyłącznie cyfrowe',howToVerify:'Przejrzyj plan promocji i wskaż każdą pozycję wymagającą druku.',evidence:'Plan promocji z listą kanałów.',warning:'Druk utrzymany w planie bez uzasadnienia.'},
  {name:'Oznakowanie bez daty i numeru edycji',howToVerify:'Sprawdź projekty bannerów i strzałek pod kątem daty i numeru.',evidence:'Projekty do akceptacji bez daty i numeru edycji.',warning:'Rok wydarzenia na każdym elemencie oznakowania.'},
  {name:'Przechowanie i ponowne użycie materiałów',howToVerify:'Ustal, gdzie oznakowanie trafia po wydarzeniu i kto za nie odpowiada.',evidence:'Wskazane miejsce przechowania i osoba odpowiedzialna.',warning:'Brak planu na materiały po demontażu.'}
 ]},
 {areaId:'dostepnosc',areaName:'Dostępność',criteria:[
  {name:'Dojście bez barier od przystanku do sali',howToVerify:'Przejdź trasę od przystanku do sali i zanotuj schody, progi i brak windy.',evidence:'Notatka z przejścia trasy ze zdjęciami miejsc problematycznych.',warning:'Zapewnienie o dostępności bez sprawdzenia trasy.'},
  {name:'Dostępność materiałów cyfrowych',howToVerify:'Sprawdź, czy pliki mają strukturę nagłówków i opisy ilustracji.',evidence:'Materiały w formacie z nagłówkami i opisami alternatywnymi.',warning:'Agenda wyłącznie jako skan albo obraz.'},
  {name:'Tłumaczenie lub napisy i warunki ich zapewnienia',howToVerify:'Zapytaj, kto zapewnia tłumaczenie lub napisy, w jakim zakresie i do kiedy trzeba je zamówić.',evidence:'Oferta z zakresem, terminem zamówienia i ceną.',warning:'Deklaracja, że da się zorganizować, bez terminu i zakresu.'}
 ]},
 {areaId:'ludzie',areaName:'Ludzie / obsługa',criteria:[
  {name:'Forma zatrudnienia stałego personelu',howToVerify:'Zapytaj wprost, na jakiej umowie pracuje stały personel obsługi.',evidence:'Oświadczenie dostawcy o formie zatrudnienia.',warning:'Odpowiedź wymijająca albo wyłącznie o współpracownikach.'},
  {name:'Lokalność obsługi i dystans dojazdu',howToVerify:'Zapytaj, skąd dojeżdża obsługa i ile to kilometrów.',evidence:'Miejscowość i liczba kilometrów dojazdu zespołu.',warning:'Obsługa sprowadzana z innego miasta przy dostępnej lokalnej.'},
  {name:'Czas pracy i przerwy',howToVerify:'Ustal długość zmian i zaplanowane przerwy dla obsługi.',evidence:'Grafik zmian z zaznaczonymi przerwami.',warning:'Jedna zmiana na całe wielogodzinne wydarzenie, bez przerw.'}
 ]},
 {areaId:'po-wydarzeniu',areaName:'Po wydarzeniu',criteria:[
  {name:'Sposób ważenia odpadów według frakcji',howToVerify:'Ustal, kto waży, czym i w którym momencie.',evidence:'Protokół ważenia z masą każdej frakcji.',warning:'Szacunek na oko zamiast pomiaru.'},
  {name:'Kto i kiedy odbiera frakcje',howToVerify:'Potwierdź odbiorcę i godzinę odbioru każdej frakcji.',evidence:'Potwierdzenie odbioru od firmy odbierającej odpady.',warning:'Segregacja na miejscu, a potem jeden wspólny kontener.'},
  {name:'Dane z faktur potrzebne do podsumowania',howToVerify:'Ustal z dostawcami, jakie pozycje mają znaleźć się na fakturze.',evidence:'Faktury z ilościami, nie tylko z kwotą zbiorczą.',warning:'Faktura z jedną pozycją usługa kompleksowa.'}
 ]}
];
export const organizerChecklist: ChecklistItem[] = [
 {id:'o1',area:'Dojazd',areaId:'dojazd',label:'Sprawdź połączenia kolejowe i autobusowe oraz dopasuj godzinę rozpoczęcia do pociągów.',milestone:'T-60',minLevel:1},
 {id:'o2',area:'Dojazd',areaId:'dojazd',label:'Dodaj transport zbiorowy do zaproszenia i strony wydarzenia.',milestone:'T-30',minLevel:1},
 {id:'o3',area:'Dojazd',areaId:'dojazd',label:'Uruchom zapisy na wspólne przejazdy.',milestone:'T-30',minLevel:2},
 {id:'o4',area:'Zakwaterowanie',areaId:'zakwaterowanie',label:'Przygotuj listę noclegów w zasięgu spaceru lub komunikacji.',milestone:'T-60',minLevel:1},
 {id:'o5',area:'Catering',areaId:'catering',label:'Zamów porcje według rejestracji i ustal odbiór nadwyżek.',milestone:'T-30',minLevel:1},
 {id:'o6',area:'Materiały',areaId:'materialy',label:'Opublikuj agendę online z kodem QR zamiast druku.',milestone:'T-7',minLevel:2},
 {id:'o7',area:'Ludzie',areaId:'ludzie',label:'Wyślij dostawcom pytania o kryteria, w tym o umowę o pracę.',milestone:'T-30',minLevel:2},
 {id:'o8',area:'Po wydarzeniu',areaId:'po-wydarzeniu',label:'Zaplanuj wagę odpadów i ankietę dojazdu.',milestone:'T-0',minLevel:1},
 {id:'o9',area:'Gadżety',areaId:'gadzety',label:'Sprawdź, czy gadżety są w ogóle potrzebne, zanim wyślesz zapytanie do dostawcy.',milestone:'T-60',minLevel:1},
 {id:'o10',area:'Gadżety',areaId:'gadzety',label:'Zamów gadżety bez daty i numeru edycji, żeby posłużyły kolejny raz.',milestone:'T-30',minLevel:1},
 {id:'o11',area:'Gadżety',areaId:'gadzety',label:'Ustaw punkt zwrotu smyczy i identyfikatorów przy wyjściu.',milestone:'T-0',minLevel:2},
 {id:'o12',area:'Gadżety',areaId:'gadzety',label:'Potwierdź rezygnację z gadżetów i wykreśl je z budżetu wydarzenia.',milestone:'T-60',minLevel:3},
 {id:'o13',area:'Dojazd',areaId:'dojazd',label:'Uzgodnij zniżkę za dojazd zbiorowy i autobus elektryczny z dworca.',milestone:'T-30',minLevel:3},
 {id:'o14',area:'Zakwaterowanie',areaId:'zakwaterowanie',label:'Zweryfikuj noclegi według kryteriów środowiskowych i społecznych.',milestone:'T-30',minLevel:3},
 {id:'o15',area:'Catering',areaId:'catering',label:'Potwierdź brak jednorazowych sztućców i umów odbiór nadwyżek jedzenia.',milestone:'T-7',minLevel:3},
 {id:'o16',area:'Materiały',areaId:'materialy',label:'Ogranicz druk do niezbędnego minimum i wybierz papier z recyklingu.',milestone:'T-30',minLevel:1},
 {id:'o17',area:'Ludzie',areaId:'ludzie',label:'Rozpisz zadania i checklistę dla każdej osoby w zespole.',milestone:'T-60',minLevel:1},
 {id:'o18',area:'Po wydarzeniu',areaId:'po-wydarzeniu',label:'Zbierz ankietę dojazdu i zważ odpady według frakcji.',milestone:'T+7',minLevel:2},
 {id:'o19',area:'Po wydarzeniu',areaId:'po-wydarzeniu',label:'Porównaj wpływ przed i po oraz zapisz wnioski na następną edycję.',milestone:'T+7',minLevel:3},
 {id:'o20',area:'Materiały',areaId:'materialy',label:'Udostępnij materiały online także po wydarzeniu, bez wersji drukowanej.',milestone:'T-7',minLevel:3},
 {id:'o21',area:'Ludzie',areaId:'ludzie',label:'Potwierdź, że obsługa jest lokalna i dojeżdża bez samochodu.',milestone:'T-30',minLevel:3},
 {id:'o22',area:'Miejsce i sala',areaId:'miejsce-i-sala',label:'Wybierz salę w budynku z dobrym dojazdem komunikacją zbiorową.',milestone:'T-60',minLevel:1},
 {id:'o23',area:'Miejsce i sala',areaId:'miejsce-i-sala',label:'Potwierdź, że całe wydarzenie zmieści się w jednym budynku, i ustal sprzęt z zasobów uczelni.',milestone:'T-30',minLevel:2},
 {id:'o24',area:'Miejsce i sala',areaId:'miejsce-i-sala',label:'Zweryfikuj obiekt według kryteriów: odpady, energia, woda i dostęp bez samochodu.',milestone:'T-30',minLevel:3},
 {id:'o25',area:'Energia i woda',areaId:'energia-i-woda',label:'Ustal, kto gasi światło i wyłącza sprzęt w nieużywanych salach.',milestone:'T-7',minLevel:1},
 {id:'o26',area:'Energia i woda',areaId:'energia-i-woda',label:'Zamów dystrybutory wody i przypomnij uczestnikom o własnych kubkach.',milestone:'T-7',minLevel:2},
 {id:'o27',area:'Energia i woda',areaId:'energia-i-woda',label:'Spisz stan liczników energii i wody na początku i na końcu wydarzenia.',milestone:'T-0',minLevel:3},
 {id:'o28',area:'Komunikacja',areaId:'komunikacja',label:'Zaplanuj promocję wyłącznie w kanałach cyfrowych, bez druku.',milestone:'T-60',minLevel:1},
 {id:'o29',area:'Komunikacja',areaId:'komunikacja',label:'Wyślij uczestnikom komunikat o zasadach: dojazd, własny kubek, porcje według rejestracji.',milestone:'T-30',minLevel:2},
 {id:'o30',area:'Komunikacja',areaId:'komunikacja',label:'Zamów oznakowanie bez daty i numeru edycji oraz ustal miejsce jego przechowania.',milestone:'T-30',minLevel:3},
 {id:'o31',area:'Dostępność',areaId:'dostepnosc',label:'Opisz w zaproszeniu dostępność miejsca i drogę od przystanku.',milestone:'T-60',minLevel:1},
 {id:'o32',area:'Dostępność',areaId:'dostepnosc',label:'Sprawdź trasę od przystanku do sali pod kątem barier i oznakuj ją.',milestone:'T-7',minLevel:2},
 {id:'o33',area:'Dostępność',areaId:'dostepnosc',label:'Zapewnij tłumaczenie lub napisy i opublikuj materiały w wersji dostępnej cyfrowo.',milestone:'T-0',minLevel:3}
];
export const teamRoles: TeamRole[] = [
 {role:'Transport',tasks:['Rozkład pociągów i godzina rozpoczęcia','Wspólne przejazdy','Pytania do przewoźnika'],taskAreas:['dojazd','dojazd','dojazd']},
 {role:'Catering',tasks:['Porcje zgodne z rejestracją','Menu lokalne i sezonowe','Odbiór nadwyżek jedzenia'],taskAreas:['catering','catering','catering']},
 {role:'Materiały i gadżety',tasks:['Agenda online i kod QR','Smycze bez daty edycji','Zbiórka smyczy przy wyjściu'],taskAreas:['materialy','gadzety','gadzety']},
 {role:'Noclegi i obsługa',tasks:['Lista noclegów w zasięgu spaceru','Dojazd do noclegu bez samochodu','Forma zatrudnienia obsługi','Podział zadań w zespole'],taskAreas:['zakwaterowanie','zakwaterowanie','ludzie','ludzie']},
 {role:'Po wydarzeniu',tasks:['Segregacja na miejscu','Ważenie odpadów','Ankieta o dojeździe'],taskAreas:['po-wydarzeniu','po-wydarzeniu','po-wydarzeniu']},
 {role:'Miejsce i infrastruktura',tasks:['Wybór sali i dojazd do budynku','Sprzęt z zasobów obiektu','Odczyt liczników energii i wody'],taskAreas:['miejsce-i-sala','miejsce-i-sala','energia-i-woda']},
 {role:'Komunikacja i dostępność',tasks:['Promocja wyłącznie cyfrowa','Komunikat o zasadach dla uczestników','Trasa bez barier od przystanku','Materiały dostępne cyfrowo'],taskAreas:['komunikacja','komunikacja','dostepnosc','dostepnosc']}
];
export const defaultPilot: PilotConfig = {city:'Podaj miejsce wydarzenia',radiusKm:20,eventStart:'09:30',prioritizeRail:true,prioritizeElectricBuses:true};

// Mirrors knowledge_mocks.py: every area carries the knowledge needed to judge
// its own suppliers, so the creator can show it next to the choice it applies to.
for (const area of eventAreas) {
  area.criteria = areaCriteria.find((entry) => entry.areaId === area.id)?.criteria ?? [];
  area.greenwashingRisks = greenwashingRisks.filter((risk) => (risk.areaIds ?? []).includes(area.id as AreaId));
}
