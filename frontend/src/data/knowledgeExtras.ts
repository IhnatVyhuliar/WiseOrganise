// Fallback copies of CONTRACT_CLAUSES, GREENWASHING_RISKS and ECO_SUMMARY from backend/app/mocks/knowledge_mocks.py.
import type { ContractClause, GreenwashingRisk, EcoSummary } from '../types';
export const contractClauses: ContractClause[] = [
 {kind:'klauzula',text:'Dostawca przekaże raport masy odpadów według frakcji w ciągu 7 dni od wydarzenia.'},
 {kind:'klauzula',text:'Dostawca potwierdzi pochodzenie produktów, sezonowość i udział naczynia wielorazowego na żądanie organizatora.'},
 {kind:'pytanie RFP',text:'Jakie mierzalne dane środowiskowe otrzymamy po realizacji usługi?'},
 {kind:'pytanie RFP',text:'Które elementy oferty są certyfikowane i kto wydał certyfikat?'}
];
export const greenwashingRisks: GreenwashingRisk[] = [
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Lokalne" bez miejsca pochodzenia',areaIds:['catering','materialy','gadzety'],flag:'yellow',explanation:'Hasło nie pozwala sprawdzić odległości ani źródła produktu.',followUp:'Poproś o adres gospodarstwa i trasę dostawy.'},
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Neutralny klimatycznie" bez danych',areaIds:['dojazd','zakwaterowanie','miejsce-i-sala','energia-i-woda','komunikacja'],flag:'red',explanation:'Deklaracja może opierać się wyłącznie na kompensacji.',followUp:'Poproś o dane emisji i niezależne potwierdzenie.'},
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Zero odpadów" z raportem frakcji',areaIds:['po-wydarzeniu','catering','miejsce-i-sala'],flag:'green',explanation:'Dostawca pokazuje masę frakcji i sposób zagospodarowania.',followUp:'Wpisz obowiązek raportu do umowy.'},
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Dostępne dla wszystkich" bez opisu trasy',areaIds:['dostepnosc','miejsce-i-sala'],flag:'yellow',explanation:'Deklaracja nie mówi, czy droga od przystanku do sali jest bez barier.',followUp:'Poproś o opis trasy i zdjęcia miejsc z progami lub schodami.'},
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Biodegradowalne" naczynia jednorazowe',areaIds:['catering'],flag:'red',explanation:'Jednorazówki biodegradowalne stoją w 6R niżej niż naczynia wielorazowe i mają sens tylko z realnym kompostowaniem.',followUp:'Zapytaj, kto odbiera je do kompostowania, i porównaj ofertę z naczyniami wielorazowymi.'},
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Zielona energia" bez odczytu licznika',areaIds:['energia-i-woda','miejsce-i-sala'],flag:'yellow',explanation:'Bez odczytu nie wiadomo, ile energii wydarzenie zużyło ani czy deklaracja cokolwiek zmienia.',followUp:'Poproś o odczyt licznika przed wydarzeniem i po nim.'},
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Materiały wielokrotnego użytku" z datą edycji',areaIds:['komunikacja','gadzety','materialy'],flag:'red',explanation:'Nadruk z rokiem przesądza, że rzecz posłuży tylko raz.',followUp:'Poproś o projekt bez daty i numeru edycji.'},
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Wspieramy lokalnych" bez formy zatrudnienia',areaIds:['ludzie','zakwaterowanie'],flag:'yellow',explanation:'Lokalność dostawcy nie mówi nic o warunkach pracy jego zespołu.',followUp:'Zapytaj o formę zatrudnienia stałego personelu.'}
];
export const ecoSummary: EcoSummary = {kgCo2eMin:220,kgCo2eMax:480,optimizedKgCo2eMin:120,optimizedKgCo2eMax:270,savedPln:80,emissionFactorSources:['Dane demonstracyjne transportu, cateringu i odpadów','Ankieta dojazdu, waga odpadów i faktury dostawców']};
