# Dokument wymagań produktu (PRD) – eFutbol League

## 1. Przegląd produktu

**eFutbol League** to responsywna aplikacja webowa, która pozwala społeczności graczy zarządzać własną ligą FIFA/eFootball. Po zalogowaniu użytkownicy otrzymują wspólny kokpit z aktualnościami, tabelami, rankingami zawodników i zestawieniami statystyk, a także modułem dodawania wyników meczów. Dane są synchronizowane w czasie rzeczywistym, aby każdy uczestnik ligi widział bieżący stan rozgrywek.

Główny przepływ obejmuje logowanie, korzystanie z menu bocznego, śledzenie wyników i statystyk oraz – dla wybranych osób – zatwierdzanie próśb o aktualizację bazy meczów. Warstwa UI zapewnia tryb jasny/ciemny i wielojęzyczny interfejs (PL/EN/ES/DE).

## 2. Problem użytkownika

Liga jest tworzona przez znajomych i wcześniej była prowadzona w sposób rozproszony (arkusze, wiadomości, ręczne liczenie statystyk). Użytkownicy potrzebują jednego miejsca, które:

- agreguje wszystkie rozegrane mecze i aktualne wyniki w trybie natychmiastowym,
- pozwala osobom bez pełnych uprawnień zgłaszać nowe mecze lub poprawki bez ryzyka utraty spójności danych,
- automatycznie buduje rankingi, tabele i statystyki, aby nie liczyć wszystkiego ręcznie,
- dostarcza czytelne logi zmian, które ułatwiają audyt tego, kto i kiedy edytował wyniki.

## 3. Wymagania funkcjonalne

### 3.1 Dostęp i ustawienia

- **Rejestracja/logowanie** – formularz logowania obsługuje walidację, podpowiadanie danych testowych dla zdefiniowanych graczy oraz przekierowanie do aplikacji po sukcesie; mechanizm uwierzytelniania opiera się na zewnętrznym dostawcy.
- **Ochrona widoków** – dostęp do sekcji aplikacji po zalogowaniu jest zabezpieczony i kieruje niezalogowanych użytkowników do modułu autoryzacji.
- **Języki i motywy** – użytkownik może przełączać język interfejsu (cztery lokalizacje) oraz motyw jasny/ciemny bez przeładowania strony.
- **Wylogowanie i skróty** – menu użytkownika umożliwia wylogowanie, a pasek akcji posiada odsyłacz do repozytorium ligi.

### 3.2 Strona główna i przegląd danych

- **Powitanie i skróty nawigacyjne** – ekran Home wyświetla personalizowane powitanie bazujące na danych zalogowanego gracza oraz zestaw kart prowadzących do kluczowych modułów.
- **Ostatnie mecze** – tablica wyników prezentuje kilkanaście najnowszych meczów w formie animowanej listy, a stan ładowania dba o płynne przejścia między ekranami.
- **Mini-statystyki** – kafelki na stronie głównej prezentują skrót osiągnięć bieżącego użytkownika i aktywują animacje po pełnym załadowaniu danych.

### 3.3 Zarządzanie meczami

- **Lista meczów** – dane o spotkaniach są przechowywane w czasie rzeczywistym i udostępniane w widoku tabelarycznym i mobilnym, obsługując filtry (przeciwnik, wynik, zakres dat), sortowanie, paginację i widok „tylko moje mecze”.
- **Dodawanie/edycja/usuwanie** – gracze mogą korzystać z formularzy do zgłaszania nowych wyników, edycji i usuwania meczów. Normalni użytkownicy składają wnioski, które trafiają do kolejki, natomiast administrator zapisuje dane bezpośrednio. Wszystkie akcje tworzą wpis w dzienniku aktywności po udanym zapisie.
- **Kolejka oczekujących** – panel oczekujących zgłoszeń gromadzi wnioski, umożliwiając zatwierdzanie i odrzucanie dostępne tylko dla administratora. Zatwierdzenie powoduje wykonanie właściwej operacji na meczu i usunięcie zgłoszenia.
- **Powiadomienia** – operacje meczowe i decyzje administracyjne wyświetlają komunikaty o sukcesach i błędach.

### 3.4 Dziennik aktywności i aktualności

- **Log zmian** – dziennik aktywności śledzi każdą akcję (dodanie/aktualizacja/usunięcie) wraz z podpisem autora i stanem meczu w chwili operacji. Dane sortowane są malejąco po czasie.
- **Widok News** – strona aktualności stronicuje i filtruje logi aktywności, renderując różne wizualizacje w zależności od typu operacji i pokazując szczegóły meczu oraz autora zgłoszenia.

### 3.5 Statystyki i analizy

- **Tabela ligowa (pary)** – moduł tabel ligowych buduje agregaty per zespół (duety graczy), licząc mecze, punkty, bilans bramkowy oraz punkty na mecz; wspiera filtry zakresów i sortowanie po dowolnej kolumnie.
- **Ranking indywidualny** – ranking generuje klasyfikację per gracz, z tym samym zestawem metryk i filtrów, korzystając z tych samych danych meczowych.
- **Szczegółowe statystyki** – strona ze statystykami umożliwia wybór zawodnika i prezentuje zestaw wykresów oraz wskaźników: liczba zwycięstw, remisy, porażki, punkty, bilans z ostatnich meczów, skuteczne pary i inne analizy trendów.
- **Analiza drużyn** – widok analiz drużynowych grupuje mecze po parach zawodników, liczy trofea dla czołowych duetów i renderuje wykresy słupkowe/kołowe z wynikami, umożliwiając filtrowanie po graczach oraz przystosowanie layoutu do urządzeń mobilnych.

### 3.6 Pozostałe moduły

- **About/FAQ** – sekcja „O lidze” prezentuje często zadawane pytania w formie rozsuwanych paneli i korzysta z wielojęzycznego tłumaczenia.
- **Stopka** – po zalogowaniu widoczna jest stopka z informacjami dodatkowymi (wyłączona na ekranach logowania).

### 3.7 Warstwa danych w czasie rzeczywistym

- Struktura danych obejmuje gałęzie przechowujące mecze, historię zmian oraz kolejkę zgłoszeń. Logika aplikacji subskrybuje je w czasie rzeczywistym, dzięki czemu UI reaguje na zmiany natychmiast.
- Operacje zapisu obsługują dodawanie, aktualizowanie i usuwanie rekordów. W przypadkach błędów system przywraca stan lokalny i sygnalizuje problem użytkownikowi, utrzymując spójność między UI i bazą.

## 4. Granice produktu

Poza obecnym zakresem znajdują się: automatyczne generowanie kont, rozbudowany panel administracyjny, integracje z zewnętrznymi API ligowymi, eksport raportów oraz edycja profili graczy – aplikacja skupia się wyłącznie na wynikach i statystykach ligi prowadzonej w jednej bazie danych czasu rzeczywistego.

## 5. Historyjki użytkowników

- **US-001 – Logowanie**: jako gracz chcę zalogować się e-mailem i hasłem, aby zobaczyć dane ligi.
- **US-002 – Przegląd**: jako zalogowany gracz chcę szybko zobaczyć ostatnie mecze i skróty statystyk na stronie głównej.
- **US-003 – Filtrowanie meczów**: jako gracz chcę filtrować listę spotkań po przeciwniku, wyniku i dacie oraz podejrzeć tylko swoje mecze.
- **US-004 – Zgłoszenie meczu**: jako gracz bez uprawnień admina chcę zgłosić nowy wynik, który trafi do kolejki do zatwierdzenia.
- **US-005 – Moderacja zgłoszeń**: jako administrator (Bartek) chcę zatwierdzać lub odrzucać oczekujące zgłoszenia i automatycznie zapisywać wynik w bazie.
- **US-006 – Historia zmian**: jako gracz chcę przejrzeć log ostatnich edycji i wiedzieć, kto zmodyfikował wynik meczu.
- **US-007 – Analiza wyników**: jako gracz chcę analizować swoje statystyki, rankingi i pozycję zespołów w tabeli.

## 6. Metryki sukcesu

- **Adopcja** – ≥90% zalogowanych graczy uruchamia stronę Home i widok meczów w trakcie pierwszej sesji (monitorowane w przyszłości w systemie analitycznym).
- **Czas zatwierdzania** – średni czas od zgłoszenia meczu do jego zatwierdzenia przez administratora ≤24 godziny (mierzone na podstawie znaczników czasu w kolejce zgłoszeń).
- **Zaufanie do danych** – <5% zgłoszeń wymaga korekty po zatwierdzeniu (analiza logów aktywności w historii zmian).
- **Zaangażowanie statystyk** – ≥70% aktywnych graczy odwiedza moduły Stats/Ranking/Table przynajmniej raz w tygodniu (metryka do raportowania po podłączeniu analityki).
