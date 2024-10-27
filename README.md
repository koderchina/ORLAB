# Otvoreni skup podataka koji sadrži podatke o lokacijama punionica za električna vozila na području Osijeka i Zagreba

Github repozitorij za potrebe predmeta Otvoreno računarstvo

## Metapodaci

- **Licencija**: [Creative Commons Zero v1.0 Universal](https://creativecommons.org/licenses/by/1.0/)
- **Autor**: Borna Krušlin
- **Verzija**: 1.0
- **Jezik**: Hrvatski

### Atributi

| Atribut               | Opis                                                                                           |
|-----------------------|------------------------------------------------------------------------------------------------|
| `id_punionice`        | Jedinstveni identifikator za punionicu.                                                        |
| `naziv_punionice`     | Naziv punionice.                                                                               |
| `adresa`              | Adresa lokacije punionice.                                                                     |
| `geografska_sirina`   | Geografska širina punionice (koordinate).                                                      |
| `geografska_duzina`   | Geografska dužina punionice (koordinate).                                                      |
| `vrsta_punjenja`      | Vrsta punjenja (npr. brzo punjenje, sporo punjenje).                                           |
| `broj_punjaca`        | Broj punjača dostupnih na punionici.                                                           |
| `snaga_punjenja`      | Snaga punjenja (izražena u kW) koju pruža punionica.                                           |
| `cijena_po_kwh`       | Cijena po kWh električne energije na punionici.                                                |
| `otvorenje`           | Vrijeme otvaranja punionice.                                                                   |
| `zatvaranje`          | Vrijeme zatvaranja punionice.                                                                  |
| `id_stanice`          | Jedinstveni identifikator za svaku punionu točku unutar punionice.                             |
| `tip_konektora`       | Vrsta konektora (npr. Tip 2, CCS, CHAdeMO) dostupna na punionici.                              |
| `snaga_stanice`       | Maksimalna snaga svake punione točke (izražena u kW).                                          |
| `pruzatelj`           | Pružatelj usluge ili operator odgovoran za upravljanje punionicom.                             |

- **Geografska pokrivenost**: Republika Hrvatska
- **Ograničenja**: Skup podataka ne sadržava detaljne podatke o vrstama naplate punjenja kod pojedinih pružatelja usluga.
