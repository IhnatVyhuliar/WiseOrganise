// Fallback copies of CONTRACT_CLAUSES, GREENWASHING_RISKS and ECO_SUMMARY from backend/app/mocks/knowledge_mocks.py.
import type { ContractClause, GreenwashingRisk, EcoSummary } from '../types';
export const contractClauses: ContractClause[] = [
 {kind:'klauzula',text:'Dostawca przekaże raport masy odpadów według frakcji w ciągu 7 dni od wydarzenia.'},
 {kind:'klauzula',text:'Dostawca potwierdzi pochodzenie produktów, sezonowość i udział naczynia wielorazowego na żądanie organizatora.'},
 {kind:'pytanie RFP',text:'Jakie mierzalne dane środowiskowe otrzymamy po realizacji usługi?'},
 {kind:'pytanie RFP',text:'Które elementy oferty są certyfikowane i kto wydał certyfikat?'}
];
export const greenwashingRisks: GreenwashingRisk[] = [
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Lokalne" bez miejsca pochodzenia',flag:'yellow',explanation:'Hasło nie pozwala sprawdzić odległości ani źródła produktu.',followUp:'Poproś o adres gospodarstwa i trasę dostawy.'},
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Neutralny klimatycznie" bez danych',flag:'red',explanation:'Deklaracja może opierać się wyłącznie na kompensacji.',followUp:'Poproś o dane emisji i niezależne potwierdzenie.'},
 {vendorName:'Neutralna kategoria dostawcy',claim:'"Zero odpadów" z raportem frakcji',flag:'green',explanation:'Dostawca pokazuje masę frakcji i sposób zagospodarowania.',followUp:'Wpisz obowiązek raportu do umowy.'}
];
export const ecoSummary: EcoSummary = {kgCo2eMin:220,kgCo2eMax:480,optimizedKgCo2eMin:120,optimizedKgCo2eMax:270,savedPln:80,emissionFactorSources:['Dane demonstracyjne transportu, cateringu i odpadów','Ankieta dojazdu, waga odpadów i faktury dostawców']};
