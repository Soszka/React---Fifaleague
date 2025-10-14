# Dokument wymagań produktu (PRD) – eFutbol League

## 1. Przegląd produktu

**eFutbol League** to responsywna aplikacja webowa, która pozwala społeczności graczy zarządzać własną ligą FIFA/eFootball. Po zalogowaniu użytkownicy otrzymują wspólny kokpit z aktualnościami, tabelami, rankingami zawodników i zestawieniami statystyk, a także modułem dodawania wyników meczów. Aplikacja korzysta z Firebase Authentication (logowanie e-mail/hasło) oraz z Firebase Realtime Database, aby natychmiast synchronizować dane pomiędzy wszystkimi członkami ligi.

Główny przepływ obejmuje logowanie, korzystanie z menu bocznego, śledzenie wyników i statystyk oraz – dla wybranych osób – zatwierdzanie próśb o aktualizację bazy meczów. Warstwa UI opiera się na Material UI z motywami jasnym/ciemnym i wielojęzycznym interfejsem (PL/EN/ES/DE).

## 2. Problem użytkownika

Liga jest tworzona przez znajomych i wcześniej była prowadzona w sposób rozproszony (arkusze, wiadomości, ręczne liczenie statystyk). Użytkownicy potrzebują jednego miejsca, które:

- agreguje wszystkie rozegrane mecze i aktualne wyniki w trybie natychmiastowym,
- pozwala osobom bez pełnych uprawnień zgłaszać nowe mecze lub poprawki bez ryzyka utraty spójności danych,
- automatycznie buduje rankingi, tabele i statystyki, aby nie liczyć wszystkiego ręcznie,
- dostarcza czytelne logi zmian, które ułatwiają audyt tego, kto i kiedy edytował wyniki.

## 3. Wymagania funkcjonalne

### 3.1 Dostęp i ustawienia

- **Rejestracja/logowanie** – aplikacja korzysta z Firebase Authentication; formularz logowania obsługuje walidację, podpowiadanie danych testowych dla zdefiniowanych graczy oraz przekierowanie do aplikacji po sukcesie.
- **Ochrona widoków** – wszystkie ścieżki `/app/*` są zabezpieczone komponentem `RequireAuth`, który odsyła niezalogowanych użytkowników do `/auth`.
- **Języki i motywy** – użytkownik może przełączać język interfejsu (cztery lokalizacje) oraz motyw jasny/ciemny bez przeładowania strony.
- **Wylogowanie i skróty** – menu użytkownika umożliwia wylogowanie, a pasek akcji posiada odsyłacz do repozytorium GitHub ligi.

### 3.2 Strona główna i przegląd danych

- **Powitanie i skróty nawigacyjne** – ekran Home wyświetla personalizowane powitanie bazujące na e-mailu zalogowanego gracza oraz zestaw kart prowadzących do kluczowych modułów.
- **Ostatnie mecze** – komponent tablicy wyników pobiera z RTDB 10 najnowszych meczów i animuje ich przewijanie; stan ładowania bazuje na hooku `useLastMatches`.
- **Mini-statystyki** – kafelki HomeStats wykorzystują dane z Firebase (hook `usePlayerStats`) do prezentowania skrótu osiągnięć bieżącego użytkownika; komponent sygnalizuje gotowość do animacji dopiero po pełnym załadowaniu danych.

### 3.3 Zarządzanie meczami

- **Lista meczów** – kontekst `MatchesProvider` subskrybuje całą gałąź bazy `Realtime Database`, mapuje rekordy meczów i sortuje je malejąco po dacie. Dane są współdzielone z tabelą desktopową i listą mobilną, obsługując filtry (przeciwnik, wynik, zakres dat), sortowanie, paginację i widok „tylko moje mecze”.
- **Dodawanie/edycja/usuwanie** – gracze mogą otworzyć dialogi dodawania, edycji i usuwania meczów. Normalni użytkownicy składają wnioski, które trafiają do kolejki, natomiast administrator (`Bartek`) zapisuje dane bezpośrednio. Wszystkie akcje tworzą wpis w dzienniku aktywności po udanym zapisie.
- **Kolejka oczekujących** – `PendingMatchesProvider` śledzi gałąź `/pendingMatchRequests`, renderuje karty zgłoszeń oraz udostępnia metody zatwierdzania/odrzucania dostępne tylko dla administratora. Zatwierdzenie powoduje wykonanie właściwej operacji na meczu i usunięcie zgłoszenia.
- **Powiadomienia** – operacje meczowe i decyzje administracyjne wykorzystują `NotificationProvider` (komponent snackbar) do informowania o sukcesach i błędach.

### 3.4 Dziennik aktywności i aktualności

- **Log zmian** – `MatchActivityProvider` obserwuje gałąź `/activityLogs`, mapuje każdą akcję (create/update/delete) wraz z podpisem autora i stanem meczu w chwili operacji. Dane sortowane są malejąco po czasie.
- **Widok News** – strona aktualności stronicuje i filtruje logi aktywności, renderując różne wizualizacje w zależności od typu operacji (dodanie, edycja, usunięcie) i pokazując szczegóły meczu oraz autora zgłoszenia.

### 3.5 Statystyki i analizy

- **Tabela ligowa (pary)** – moduł Table buduje agregaty per zespół (duety graczy), licząc mecze, punkty, bilans bramkowy oraz punkty na mecz; wspiera filtry zakresów i sortowanie po dowolnej kolumnie.
- **Ranking indywidualny** – Ranking generuje klasyfikację per gracz, z tym samym zestawem metryk i filtrów, korzystając z tych samych danych meczowych.
- **Szczegółowe statystyki** – strona Stats umożliwia wybór zawodnika i prezentuje zestaw wykresów (ApexCharts) oraz wskaźników: liczba zwycięstw, remisy, porażki, punkty, bilans z ostatnich meczów, skuteczne pary i inne analizy trendów.
- **Analiza drużyn** – widok Teams grupuje mecze po parach zawodników, liczy trofea dla czołowych duetów i renderuje wykresy słupkowe/kołowe z wynikami, umożliwiając filtrowanie po graczach oraz przystosowanie layoutu do urządzeń mobilnych.

### 3.6 Pozostałe moduły

- **About/FAQ** – sekcja „O lidze” wykorzystuje i18n i akordeony MUI do prezentacji często zadawanych pytań.
- **Stopka** – po zalogowaniu na stronach `/app/*` widoczny jest komponent stopki z informacjami dodatkowymi (wyłączony na ekranach logowania).

### 3.7 Integracja z Firebase (RTDB)

- Struktura danych obejmuje co najmniej trzy gałęzie: `/{matchId}` lub `/matches/{matchId}` dla meczów, `/activityLogs` dla historii zmian oraz `/pendingMatchRequests` dla kolejki zgłoszeń. Wszystkie hooki (`useAllMatches`, `useLastMatches`) i konteksty subskrybują te gałęzie przez `onValue`, dzięki czemu UI reaguje w czasie rzeczywistym.
- Operacje zapisu korzystają z `push`, `set` i `remove`. W przypadkach błędów kod przywraca stan lokalny i sygnalizuje problem użytkownikowi, utrzymując spójność między UI i bazą.

## 4. Granice produktu

Poza obecnym zakresem znajdują się: automatyczne generowanie kont, rozbudowany panel administracyjny, integracje z zewnętrznymi API ligowymi, eksport raportów oraz edycja profili graczy – aplikacja skupia się wyłącznie na wynikach i statystykach ligi prowadzonej w Firebase.

## 5. Historyjki użytkowników

- **US-001 – Logowanie**: jako gracz chcę zalogować się e-mailem i hasłem, aby zobaczyć dane ligi.
- **US-002 – Przegląd**: jako zalogowany gracz chcę szybko zobaczyć ostatnie mecze i skróty statystyk na stronie głównej.
- **US-003 – Filtrowanie meczów**: jako gracz chcę filtrować listę spotkań po przeciwniku, wyniku i dacie oraz podejrzeć tylko swoje mecze.
- **US-004 – Zgłoszenie meczu**: jako gracz bez uprawnień admina chcę zgłosić nowy wynik, który trafi do kolejki do zatwierdzenia.
- **US-005 – Moderacja zgłoszeń**: jako administrator (Bartek) chcę zatwierdzać lub odrzucać oczekujące zgłoszenia i automatycznie zapisywać wynik w bazie.
- **US-006 – Historia zmian**: jako gracz chcę przejrzeć log ostatnich edycji i wiedzieć, kto zmodyfikował wynik meczu.
- **US-007 – Analiza wyników**: jako gracz chcę analizować swoje statystyki, rankingi i pozycję zespołów w tabeli.

## 6. Metryki sukcesu

- **Adopcja** – ≥90% zalogowanych graczy uruchamia stronę Home i widok meczów w trakcie pierwszej sesji (monitorowane w analityce Firebase w przyszłości).
- **Czas zatwierdzania** – średni czas od zgłoszenia meczu do jego zatwierdzenia przez administratora ≤24 godziny (mierzone na podstawie znaczników czasu w `pendingMatchRequests`).
- **Zaufanie do danych** – <5% zgłoszeń wymaga korekty po zatwierdzeniu (analiza logów aktywności w `/activityLogs`).
- **Zaangażowanie statystyk** – ≥70% aktywnych graczy odwiedza moduły Stats/Ranking/Table przynajmniej raz w tygodniu (metryka do raportowania po podłączeniu analityki).
