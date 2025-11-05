# Plan API REST

> **Kontekst:** Frontend w React, korzystający z Firebase Authentication (logowanie hasłem) oraz Firebase Realtime Database (RTDB). Wszystkie dane meczowe żyją we wspólnej przestrzeni nazw RTDB (bez podziału na użytkowników). Aplikacja utrzymuje długotrwałe subskrypcje w czasie rzeczywistym, aby natychmiast odzwierciedlać zmiany w bazie danych.

## 1. Zasoby

| Zasób                   | Ścieżka w RTDB                                              | Uwagi                                                                                                                                                                                                                                        |
| ----------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Match**               | `/{matchId}` (dziedziczone aliasy pod `/matches/{matchId}`) | Podstawowe rekordy meczów. Każdy wpis przechowuje dwa zespoły (po dwóch graczy na stronę), wynik tekstowy oraz datę meczu zapisaną jako UNIX ms lub ciąg ISO. Identyfikatory generowane przez RTDB (push IDs).                               |
| **MatchActivityLog**    | `/activityLogs/{logId}`                                     | Oś czasu działań CRUD na meczach. Wpisy zawierają informacje o wykonawcy, typ akcji (`create\|update\|delete`), znacznik czasu oraz zrzut stanu meczu w danym momencie.                                                                      |
| **PendingMatchRequest** | `/pendingMatchRequests/{requestId}`                         | Kolejka zgłoszeń zmian przesyłanych przez użytkowników niebędących administratorami. Każdy wpis przechowuje metadane wykonawcy, znacznik czasu zgłoszenia oraz ładunek opisujący pożądaną akcję `create\|update\|delete` (ze zrzutem meczu). |

**Wskazówki dotyczące indeksowania i zapytań**

- Kolekcja `Match`: kod kliencki sortuje według pola podrzędnego `date` podczas obliczania statystyk graczy, dlatego należy udostępnić regułę `.indexOn: ["date"]` dla każdego węzła przechowującego listy meczów.
- Kolekcje `MatchActivityLog` oraz `PendingMatchRequest` są wyświetlane od najnowszych; indeksowanie po `timestamp` utrzymuje wydajne stronicowanie.

## 2. Endpointy

Wszystkie endpointy zakładają uwierzytelnianie tokenem ID Firebase (`Authorization: Bearer <token>`). Odpowiedzi zawijają dane w `{ "data": ... }`, o ile nie wskazano inaczej. Znaczniki czasu serwera są w milisekundach UNIX.

### 2.1 Uwierzytelnianie

Firebase Authentication obsługuje logowanie/wylogowanie bezpośrednio z klienta poprzez `signInWithEmailAndPassword`, `signOut` oraz nasłuchiwanie stanu. Wystawiaj pomocnicze endpointy REST tylko wtedy, gdy są potrzebne klientom innym niż Firebase; w przeciwnym razie używaj istniejących endpointów SDK Firebase.

### 2.2 Mecze

Te endpointy zarządzają rekordami meczów i odzwierciedlają optymistyczną logikę aktualizacji obecną w kontekście Reacta.

#### GET `/v1/matches`

- **Parametry zapytania:**
  - `startDate`, `endDate` (opcjonalne; milisekundy lub ciągi ISO) do filtrowania po dacie meczu.
  - `orderBy` w `{date}` (domyślnie `date`), `direction` w `{asc,desc}` (domyślnie `desc`).
  - `limit` (1–500, domyślnie 100) oraz `pageToken` do paginacji.
- **Opis:** Zwraca mecze przechowywane zarówno w korzeniu RTDB, jak i w starszym kubełku `/matches`, usuwa duplikaty i sortuje malejąco po dacie, aby dopasować oczekiwania frontendu.
- **Odpowiedź 200**

```json
{
  "data": [
    {
      "id": "-Nxyz123",
      "player1": "Adam",
      "player2": "Bartek",
      "rival1": "Marek",
      "rival2": "Łukasz",
      "result": "5-3",
      "date": 1733107200000
    }
  ],
  "nextPageToken": "..."
}
```

#### GET `/v1/matches/{id}`

- **Opis:** Pobiera pojedynczy mecz z `/{id}` lub `/matches/{id}`.
- **Odpowiedź 200:** `{ "data": { ...Match } }`
- **Błędy:** 404, jeśli identyfikator meczu nie istnieje.

#### POST `/v1/matches`

- **Opis:** Tworzy mecz. Tylko użytkownik administrator (zob. §3) może wykonać operację natychmiast; pozostali użytkownicy otrzymują HTTP 202 z `pendingRequestId` (patrz §2.3). Odtwarza zachowanie klienta polegające na kolejkowaniu żądań nieadministrowanych.
- **Żądanie**

```json
{
  "player1": "Adam",
  "player2": "Bartek",
  "rival1": "Marek",
  "rival2": "Łukasz",
  "result": "5-3",
  "date": 1733107200000
}
```

- **Odpowiedź 201 (administrator):** `{ "data": { "id": "-Nxyz123", ... } }`
- **Odpowiedź 202 (nie-admin):** `{ "data": { "pendingRequestId": "-Nreq456" } }`
- **Błędy:** 400 w razie błędów walidacji.

#### PATCH `/v1/matches/{id}`

- **Opis:** Częściowa aktualizacja (ten sam podział admin vs. nie-admin co w POST). Obsługuje optymistyczną współbieżność poprzez nagłówek `If-Match: "<timestamp>"` odnoszący się do pola `updatedAt` (jeśli jest udostępnione).
- **Błędy:** 400 (walidacja), 404 (brak meczu), 409/412 (konflikt), 202 dla zakolejkowanych aktualizacji.

#### DELETE `/v1/matches/{id}`

- **Opis:** Usuwa mecz. Dla użytkowników niebędących administratorami wywołuje dodanie żądania oczekującego.
- **Odpowiedź 204** (administrator) lub **202** z `{ "data": { "pendingRequestId": "..." } }` dla nie-adminów.

#### Subskrypcja w czasie rzeczywistym `/v1/matches:stream`

- **Opis:** Opcjonalne strumienie SSE lub WebSocket odzwierciedlające `onValue(ref(rtdb))`, aby interfejs mógł pozostawać zsynchronizowany bez odpytywania. Wysyłają ten sam ładunek co `GET /v1/matches` przy każdej zmianie danych.

### 2.3 Oczekujące żądania meczowe

Interakcje użytkowników bez uprawnień administratora są zapisywane jako żądania oczekujące i wymagają zatwierdzenia przez admina.

#### GET `/v1/pending-match-requests`

- **Parametry zapytania:** `limit`, `pageToken`, `direction` (domyślnie `desc`), opcjonalnie filtr `type` lub `matchId`.
- **Opis:** Zwraca żądania oczekujące w porządku malejącym według `timestamp`. Każdy wpis zawiera metadane wykonawcy, typ akcji oraz aktualny status.
- **Odpowiedź 200**

```json
{
  "data": [
    {
      "id": "-Nreq456",
      "type": "update",
      "status": "pending",
      "timestamp": 1733110000000,
      "actor": {
        "id": "uid123",
        "displayName": "Adam"
      },
      "payload": {
        "previousMatch": {
          "player1": "Adam",
          "player2": "Bartek",
          "rival1": "Marek",
          "rival2": "Łukasz",
          "result": "5-3",
          "date": 1733107200000
        }
      }
    }
  ]
}
```

#### POST `/v1/pending-match-requests`

- **Opis:** Dodaje żądanie nie-admina do kolejki. Serwer wyprowadza `actor` z uwierzytelnionego użytkownika i nadaje znacznik czasu `timestamp`. Ładunek musi odpowiadać strukturom używanym na froncie.
- **Żądanie** (przykład dla utworzenia)

```json
{
  "type": "create",
  "match": {
    "player1": "Adam",
    "player2": "Bartek",
    "rival1": "Marek",
    "rival2": "Łukasz",
    "result": "5-3",
    "date": 1733107200000
  }
}
```

- **Odpowiedź 201:** `{ "data": { "id": "-Nreq456" } }`
- **Błędy:** 400 dla niepoprawnych ładunków.

#### POST `/v1/pending-match-requests/{id}:approve`

- **Opis:** Tylko dla administratora. Wykonuje zapisaną akcję, delegując do endpointów meczu z zachowaniem oryginalnego wykonawcy do celów audytu. W razie sukcesu usuwa element oczekujący.
- **Odpowiedź 200:** `{ "data": { "status": "completed" } }`
- **Błędy:** 403 (brak uprawnień administratora), 409 (konflikt dotyczący meczu).

#### POST `/v1/pending-match-requests/{id}:reject`

- **Opis:** Tylko dla administratora; usuwa element oczekujący.
- **Odpowiedź 200:** `{ "data": { "status": "rejected" } }`

#### Subskrypcja w czasie rzeczywistym `/v1/pending-match-requests:stream`

- **Opis:** Strumień zmian kolejki dla panelu administratora, odzwierciedlający istniejące `onValue(ref(rtdb, "/pendingMatchRequests"))`.

### 2.4 Dzienniki aktywności meczów

Dzienniki są tylko do odczytu dla klientów; backend powinien emitować je automatycznie przy każdej udanej modyfikacji meczu.

#### GET `/v1/match-activity`

- **Parametry zapytania:** `limit`, `pageToken`, `direction` (domyślnie `desc`), opcjonalny filtr `matchId`.
- **Opis:** Zwraca wpisy aktywności posortowane malejąco według znacznika czasu. Każdy wpis zawiera metadane wykonawcy oraz zrzut meczu zapisany w momencie działania.
- **Odpowiedź 200**

```json
{
  "data": [
    {
      "id": "-Nlog789",
      "matchId": "-Nxyz123",
      "type": "update",
      "timestamp": 1733110050000,
      "actor": { "id": "uid123", "displayName": "Adam" },
      "matchSnapshot": {
        "id": "-Nxyz123",
        "player1": "Adam",
        "player2": "Bartek",
        "rival1": "Marek",
        "rival2": "Łukasz",
        "result": "4-4",
        "date": 1733193600000
      }
    }
  ]
}
```

#### Subskrypcja w czasie rzeczywistym `/v1/match-activity:stream`

- **Opis:** Opcjonalne strumienie SSE/WebSocket przekazujące zmiany dziennika aktywności w niemal rzeczywistym czasie.

## 3. Uwierzytelnianie i autoryzacja

- **Mechanizm:** Firebase Authentication; klienci uwierzytelniają się za pomocą e-maila i hasła, otrzymują token ID i używają go w wywołaniach REST.
- **Uprawnienia administratora:** Tylko użytkownik, którego znormalizowana nazwa wyświetlana to `Bartek`, może natychmiast stosować zmiany meczowe. Wszyscy pozostali użytkownicy muszą wysłać żądania oczekujące.
- **Ścieżka audytu:** Udane modyfikacje meczu tworzą wpis dziennika zawierający wykonawcę, typ akcji oraz pełny zrzut meczu.

## 4. Walidacja i zasady biznesowe

- **Ładunki meczu** muszą zawierać `player1`, `player2`, `rival1`, `rival2`, `result` oraz `date`. Pole `date` akceptuje znacznik czasu w milisekundach lub ciąg ISO; backend powinien normalizować do liczby milisekund przy zapisie. Frontend odrzuca niepoprawne daty.
- **Żądania oczekujące** zachowują oryginalnego wykonawcę i pożądaną zmianę. Zatwierdzenia wykonują zapisany ładunek dokładnie; w przypadku błędów żądanie powinno pozostać nienaruszone, aby administrator mógł ponowić próbę.
- **Dzienniki aktywności** są tylko dopisywane i powinny być generowane po stronie serwera, aby zapobiec manipulacjom. Wpisy odzwierciedlają strukturę aktualnie zapisywaną przez klienta.
- **Oczekiwania dotyczące czasu rzeczywistego:** Interfejs polega na żywych subskrypcjach RTDB dla meczów, żądań oczekujących i dzienników aktywności. Każde zastąpienie REST musi udostępniać równoważne strumienie lub endpointy przyjazne odpytywaniu, by nie pogorszyć UX.
- **Funkcje statystyk** (statystyki graczy, rankingi itp.) zależą od spójnego sortowania według `date`. Zapewnij, by listy meczów można było filtrować lub sortować po `date` oraz by indeksy RTDB wspierały `orderByChild("date")`.

---

Plan ten odzwierciedla obecne interakcje z Firebase, dzięki czemu Cloud Functions lub usługa HTTPS mogą zastąpić bezpośredni dostęp do RTDB bez zmiany zachowania frontendu.
