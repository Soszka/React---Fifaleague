# Plan testów aplikacji eFutbol League

## 1. Wprowadzenie i cele testowania

Celem planu jest zapewnienie jakości aplikacji eFutbol League zbudowanej na stosie React + TypeScript + Firebase poprzez kompleksowe testowanie funkcjonalności biznesowych (zarządzanie meczami, kolejką pending, statystykami), doświadczenia użytkownika (nawigacja, i18n, motywy), bezpieczeństwa (autoryzacja, role administratora) oraz niezawodności integracji z Realtime Database. Plan definiuje zakres, strategię, narzędzia, harmonogram oraz odpowiedzialności zespołu QA.

## 2. Zakres testów

### W zakresie

- Uwierzytelnianie użytkowników i kontrola dostępu (`Auth`, `RequireAuth`, `AuthContext`).
- Nawigacja główna i layout (`Navigation`, `AppRoutes`, drawer/AppBar).
- Zarządzanie meczami i aktywnością (`MatchesContext`, dialogi dodawania/edycji/usuwania, filtry strony `Matches`).
- Kolejka wniosków i uprawnienia administratora (`PendingMatchesContext`, strona `Pending`).
- Agregacje tabel i rankingów (`useAllMatches`, `Ranking`, `Table`, `Stats`).
- Strona główna, statystyki skrótowe, komponenty UI (`Home`, `HomeScoreboard`, `HomeStats`, `Title`, `Footer`).
- Lokalizacja (i18next, pliki `locales/*`), przełączanie motywów (`ThemeProvider`, `NavigationActions`).
- Utils (normalizacja dat/nazw) i powiadomienia (`NotificationContext`).
- Responsywność oraz obsługa błędów integracji z Firebase.

### Poza zakresem

- Testy wydajności backendu Firebase poza emulatorami.
- Testy penetracyjne (mogą zostać zaplanowane oddzielnie).

## 3. Typy testów

| Typ testu                               | Zakres                                                                                                              | Narzędzia/uwagi                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Testy jednostkowe                       | Utils (`dateUtils`, `nameUtils`), hooki (`useAllMatches`, `useLastMatches`), reduktory w kontekstach                | Vitest, React Testing Library hooks                                        |
| Testy integracyjne                      | Komponenty złożone (`Auth`, `Matches`, `Pending`, `Ranking`, `Table`, `Stats`), interakcja z kontekstami i routerem | React Testing Library, MSW/Firebase emulator do mockowania RTDB/Auth       |
| Testy E2E                               | Krytyczne ścieżki użytkownika (logowanie → nawigacja → CRUD meczów → kolejka pending → zatwierdzenie przez admina)  | Playwright (desktop/mobile), integracja z Firebase Emulator Suite          |
| Testy regresji wizualnej/responsywności | Layout drawer/AppBar, tabele na mobile, przełączanie motywu                                                         | Storybook + Chromatic/Loki (jeśli dostępne) lub Playwright screenshot diff |
| Testy i18n                              | Przełączanie języków, kompletność tłumaczeń, fallbacki                                                              | Jednostkowe (snapshot tłumaczeń), manualne E2E                             |
| Testy dostępności                       | Sprawdzenie kontrastu, nawigacji klawiaturą, aria-labels                                                            | axe-core (Playwright/RTL), Lighthouse                                      |
| Testy bezpieczeństwa funkcjonalnego     | Weryfikacja restrykcji roli admina (kolejka pending), blokady dostępu do `/app/*` bez logowania                     | Playwright + testy negatywne                                               |
| Testy wydajności klienta                | Czas ładowania, renderowanie tabel/wizualizacji przy dużym dataset                                                  | Lighthouse, Web Vitals, profilowanie React DevTools                        |

## 4. Scenariusze testowe dla kluczowych funkcjonalności

1. **Logowanie i autoryzacja**

   - Walidacja formularza (`react-hook-form`) – brak danych, format e-mail, minimalna długość hasła.
   - Logowanie poprawne/niepoprawne, komunikaty błędów (Snackbar).
   - Autologowanie zalogowanego użytkownika (redirect do `/app/home`).
   - Brak dostępu do tras `/app/*` bez autoryzacji (redirect na `/auth`).
   - Wylogowanie z menu nawigacji.

2. **Nawigacja i layout**

   - Widoczność drawer/AppBar na desktop vs mobile, stan persistent/temporary.
   - Aktualizacja tytułu sekcji i breadcrumbs w zależności od aktywnej trasy.
   - Przełączanie motywu (kolorystyka, zapamiętanie stanu, kompatybilność z dark mode).
   - Footer wyświetlany tylko dla zalogowanych poza `/auth`.

3. **Zarządzanie meczami (Matches)**

   - Ładowanie danych z kontekstu (`MatchesProvider`), wskaźnik ładowania, obsługa błędów.
   - Filtrowanie (rival, wynik, zakres dat), paginacja, sortowanie.
   - Rozróżnienie widoku desktop (tabela) vs mobile (lista).
   - Dodawanie/edycja/usunięcie meczu:
     - Walidacja daty i wyniku.
     - Zachowanie dla admina (bez kolejki) vs zwykłego użytkownika (status „queued”, powiadomienia).
     - Obsługa błędów Firebase (rollback zmian w stanie lokalnym).
   - Logowanie aktywności (`MatchActivityProvider`).

4. **Kolejka pending**

   - Lista wniosków, paginacja, filtry ilości wierszy.
   - Dostęp tylko dla admina (pozostali powinni widzieć informację o braku uprawnień).
   - Zatwierdzenie/odrzucenie, aktualizacja listy, powiadomienia.
   - Prezentacja danych (różne typy – create/update/delete), porównanie poprzednich danych przy update.

5. **Agregacje ranking/table/stats**

   - Poprawne obliczenia punktów, meczów, zwycięstw, ppm przy zestawach kontrolnych.
   - Filtry zakresowe (0-10 itd.), sortowanie kolumny, paginacja.
   - Wykresy ApexCharts – weryfikacja konfiguracji, odporność na brak danych (wyświetlenie skeletonów).
   - Responsywność i przełączanie zakładek/widoków (np. Stats taby).

6. **Strona główna i komponenty UI**

   - `HomeScoreboard` – pobieranie ostatnich meczów, tryb skeleton.
   - `HomeStats` – poprawność danych skrótowych.
   - Ładowanie kart, licznik gotowości (`allLoaded`).
   - Działanie komponentu `Title`, `Footer`, `NavigationActions` (np. menu użytkownika, język).

7. **Lokalizacja i dostępność**

   - Przełączanie języka w `Auth` i globalnie (sprawdzenie tłumaczeń kluczowych sekcji).
   - Wykrywanie brakujących wpisów (testy jednostkowe vs JSON).
   - Kontrast w trybie jasnym/ciemnym, alt w obrazkach, aria-labels w przyciskach.

8. **Obsługa błędów i offline**
   - Symulacja problemów z siecią/Firebase (MSW lub emulator) → wyświetlenie komunikatów błędu, brak crashy.
   - Fallback dla pustych danych (np. brak meczów → komunikat).

## 5. Środowisko testowe

- **Środowisko lokalne**: Node.js 18+, Vite dev server (`npm run dev`), Vitest (`npm test`), Playwright (`npx playwright test`).
- **Firebase Emulator Suite**: konfiguracja Auth + Realtime Database, seed danych (np. z pliku `base-players.json` + przykładowe mecze).
- **Bazy danych**: oddzielne instancje dla testów (np. `fifa-league-test` w emulatorze).
- **Przeglądarki**: Chrome (desktop/mobile), Firefox, Edge. Testy responsywne dla breakpoints MUI (`xs`, `sm`, `md`, `lg`).
- **CI/CD**: pipeline z instalacją zależności (`npm ci`), uruchomieniem testów jednostkowych/integracyjnych, E2E na emulatorach oraz audytów (Lighthouse).

## 6. Narzędzia do testowania

- Vitest + React Testing Library (testy jednostkowe/integracyjne).
- MSW lub @firebase/rules-unit-testing do mockowania RTDB/Auth.
- Playwright (E2E, regresja wizualna, testy mobilne).
- Firebase Emulator Suite (autentyczne zachowanie backendu).
- ESLint, TypeScript (kontrola jakości statycznej).
- axe-core, Lighthouse (dostępność i wydajność).
- Jest Image Snapshot / Playwright screenshot dla regresji wizualnej.
- Storybook (opcjonalnie) dla izolowanych komponentów.

## 7. Harmonogram testów

| Faza                                                 | Zakres                                                     | Czas trwania (szac.) | Odpowiedzialni |
| ---------------------------------------------------- | ---------------------------------------------------------- | -------------------- | -------------- |
| Analiza wymagań i przygotowanie danych testowych     | Review repo, konfiguracja emulatorów, seed danych          | 3 dni                | QA Lead + Dev  |
| Testy jednostkowe i integracyjne (nowe + istniejące) | Pokrycie kontekstów, hooków, utils, kluczowych komponentów | 5 dni                | QA Automation  |
| Testy E2E (scenariusze krytyczne)                    | Logowanie, CRUD meczów, pending, ranking/table/stats       | 5 dni                | QA Automation  |
| Testy i18n, dostępności, responsywności              | Manualne + automatyczne, cross-browser                     | 3 dni                | QA Manual      |
| Testy regresji i stabilizacja                        | Ponowny run suite po poprawkach, sprawdzenie raportów      | 3 dni                | QA z Dev       |
| Odbiór i raport końcowy                              | Podsumowanie wyników, rekomendacje                         | 2 dni                | QA Lead        |

(Harmonogram może być iteracyjnie powtarzany w sprintach; czasy dostosować do kalendarza projektu.)

## 8. Kryteria akceptacji testów

- 100% wykonanych i zaliczonych testów zdefiniowanych jako krytyczne (logowanie, CRUD meczów, kolejka pending, agregacje).
- ≥90% wykonanych i zaliczonych scenariuszy wysokiego priorytetu.
- Brak otwartych defektów o priorytecie „Critical” i „High”; defekty „Medium/Low” zaakceptowane przez Product Ownera wraz z planem naprawy.
- Testy automatyczne (unit/integration/E2E) zielone w CI.
- Raport dostępności ≥ WCAG AA dla głównych widoków.
- Pozytywne wyniki audytu wydajności (Lighthouse performance score ≥ 80 dla trybu desktop, ≥ 70 dla mobile).

## 9. Role i odpowiedzialności

- **QA Lead**: planowanie, koordynacja testów, raport końcowy, komunikacja z Product Ownerem.
- **QA Automation Engineer**: implementacja i utrzymanie testów Vitest/Playwright, konfiguracja emulatorów.
- **QA Manual Engineer**: scenariusze eksploracyjne, testy i18n/dostępności/responsywności, walidacja UX.
- **Developerzy**: wsparcie w przygotowaniu seedów emulatora, naprawa defektów, code review testów automatycznych.
- **Product Owner / Analityk**: akceptacja wyników, priorytetyzacja defektów, dostarczanie wymagań biznesowych.
- **DevOps/CI Engineer (jeśli dostępny)**: integracja testów z pipeline, monitorowanie stabilności buildów.

## 10. Procedury raportowania błędów

1. Rejestracja defektu w systemie zgłoszeniowym (np. Jira) z kategorią (Functional/UI/i18n/Performance/Security), priorytetem i komponentem.
2. Wymagane informacje: opis, kroki reprodukcji, oczekiwany vs rzeczywisty rezultat, zrzuty ekranu/logi (np. z Playwright), dane testowe, wersja builda/commit.
3. Przypisanie do odpowiedzialnego developera; określenie docelowej wersji naprawy.
4. QA weryfikuje poprawkę (retest) oraz przeprowadza regresję obszarów powiązanych.
5. Aktualizacja statusu defektu (Open → In Progress → In Review → Resolved → Closed).
6. Cotygodniowe przeglądy statusu QA (burndown defektów, analiza trendów) oraz raport końcowy podsumowujący wskaźniki (liczba defektów wg priorytetów, pokrycie testów, wnioski).

Plan ten zapewnia zorganizowane podejście do weryfikacji jakości aplikacji eFutbol League, skupiając się na newralgicznych komponentach repozytorium, integralności danych i doświadczeniu użytkownika.
