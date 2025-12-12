# AIGIS Platform KPI Storage and Query Design

## 1. Overview

To comply with AIGIS-71-FS, the KPI datastore will hold all daily and weekly metrics used by the AIGIS UI for the WINT‑ULI and WINT‑SBM subsystems.

This proposal defines two extensible ClickHouse tables — one per subsystem — capable of efficiently storing, querying, and extending KPIs without future schema changes.

| Subsystem | Database | Table | Frequency      | Description                              |
| --------- | -------- | ----- | -------------- | ---------------------------------------- |
| WINT‑ULI  | dbuli    | kpi   | Daily          | Stores ULI ingestion and subscriber KPIs |
| WINT‑SBM  | dbsbm    | kpi   | Daily & Weekly | Stores SBM counters and yield KPIs       |

Each row represents one KPI per time bucket (day or week).

This unified schema simplifies ingestion, auditing, and LCAPI/UI querying patterns.

---

## 2. Schema Design

The KPI datastore uses a **single dimensional pattern** for both subsystems (WINT‑ULI and WINT‑SBM).

Each row in the KPI tables represents **one metric value for one time bucket and one dimension slice**:

- **bucket\_start** – Start of the time bucket (day or week).
- **bucket\_type** – The granularity of the bucket (e.g. `daily`, `weekly`).
- **kpi\_name** – The logical name of the KPI (e.g. `TotalUlisProcessed`, `StaypointCoverage`).
- **dimension\_type** – Which dimension the row is sliced by (e.g. `NONE`, `operator`, `domicile`, `event_type`, `duration_bucket`, `count_bucket`).
- **dimension\_value** – The specific member/label within that dimension (e.g. operator code, domicile type, duration bucket label).
- **value** – The numeric KPI value for that `(bucket_start, bucket_type, kpi_name, dimension_type, dimension_value)` combination.

Global KPIs (no breakdown) use:

- `dimension_type = 'NONE'`
- `dimension_value = 'ALL'`

Dimensional KPIs (per‑operator, per‑domicile, distributions, etc.) use:

- `dimension_type = '<dimension-name>'`
- `dimension_value = '<member-or-bucket-label>'`

This pattern lets us add **new KPIs** (new `kpi_name` values) and **new breakdowns** (new `dimension_type`/`dimension_value` pairs) without changing the table schema.

The following sections show how this pattern is applied in the two concrete tables: `dbuli.kpi` (ULI) and `dbsbm.kpi` (SBM).

---

### 2.1 `dbuli.kpi` — WINT‑ULI KPIs (Daily)

`dbuli.kpi` stores all daily ULI ingestion and subscriber KPIs in a single dimensional table.

```sql
CREATE TABLE dbuli.kpi
(
    bucket_start Date,                          -- KPI day start (00:00)
    bucket_type  Enum8('daily' = 1),           -- Only daily buckets for ULI

    kpi_name     LowCardinality(String),       -- e.g. 'TotalUlisProcessed'

    -- Dimensional model
    dimension_type  LowCardinality(String) DEFAULT 'NONE',  -- 'NONE','operator','domicile','event_type',...
    dimension_value LowCardinality(String) DEFAULT 'ALL',   -- code/label for the chosen dimension_type

    value       Float64,                       -- KPI value for this slice
    updated_at  DateTime DEFAULT now(),
    version     UInt32   DEFAULT 1
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(bucket_start)
ORDER BY (bucket_start, kpi_name, dimension_type, dimension_value)
SETTINGS index_granularity = 8192;
```

#### Columns

| Column           | Type                   | Description                                                      |
| ---------------- | ---------------------- | ---------------------------------------------------------------- |
| bucket\_start    | Date                   | Start of KPI day (00:00)                                         |
| bucket\_type     | Enum8('daily' = 1)     | Bucket type (ULI uses only `daily`)                              |
| kpi\_name        | LowCardinality(String) | Logical KPI name (e.g. `TotalUlisProcessed`)                     |
| dimension\_type  | LowCardinality(String) | Dimension type (`NONE`, `operator`, `domicile`, `event_type`, …) |
| dimension\_value | LowCardinality(String) | Dimension value within the chosen dimension type                 |
| value            | Float64                | KPI value for this `(bucket, kpi, dimension)` slice              |
| updated\_at      | DateTime               | Last update timestamp for this row                               |
| version          | UInt32                 | Schema/data version tag                                          |

#### Dimensional usage (ULI)

ULI KPIs use the following dimension types:

- **Global KPIs (no breakdown)**

  - `dimension_type = 'NONE'`
  - `dimension_value = 'ALL'`\
    Used for totals such as `TotalUlisProcessed`, `TotalUlisIngested`, `TotalUlisRejected`, `TotalOutboundRoamerUlis`, `TotalImsis`, daily MSISDN/IMSI totals, and similar.

- **Per-operator KPIs**

  - `dimension_type = 'operator'`
  - `dimension_value = '<operator_code>'` (for example `OP_A`, `OP_B`, `OP_C`) Used for per-operator ingestion and subscriber metrics (e.g. `TotalUlisProcessedPerOperator`, `TotalImsisPerOperator`, etc.).

- **Per-subscriber-type KPIs**

  - `dimension_type = 'subscriber_type'`
  - `dimension_value ∈ {'domestic','foreign','unknown'}`\
    Used for processed ULIs per subscriber type and daily IMSI KPIs per subscriber type.

- **Per-domicile KPIs**

  - `dimension_type = 'domicile'`
  - `dimension_value ∈ {'domestic','foreign','unknown'}`\
    Used for `TotalImsisPerDomicile`.

- **Per-RAT-type KPIs**

  - `dimension_type = 'rat_type'`
  - `dimension_value` is the radio access technology (`GSM`, `UMTS`, `LTE`, `WiFi`, `unknown`, …).

- **Per-location-method KPIs**

  - `dimension_type = 'location_method'`
  - `dimension_value` is the location method (`WLS`, `ECID`, `CID`, `A-GPS`, `Hybrid`, `rWLS`, …).

- **Per-event-type KPIs**

  - `dimension_type = 'event_type'`
  - `dimension_value` is the event type name as defined in Le+ (for example `LOCATION_UPDATE`, `CALL_START`).

- **Per-sub-event-type KPIs**

  - `dimension_type = 'sub_event_type'`
  - `dimension_value` is the sub-event type name defined in Le+.

- **Per-mass-service KPIs**

  - `dimension_type = 'mass_service'`
  - `dimension_value` is the mass service identifier (for example `MCUE-n`, `EVRPT-n`, `MAGS`, `MTUE-p`).

There is one row per combination:

> `(bucket_start, bucket_type, kpi_name, dimension_type, dimension_value)`

##### Example rows in `dbuli.kpi`

Small example for a single day showing different KPI names and dimensions using the same schema:

| bucket\_start | bucket\_type | kpi\_name                     | dimension\_type | dimension\_value | value  |
| ------------- | ------------ | ----------------------------- | --------------- | ---------------- | ------ |
| 2025-01-01    | daily        | TotalUlisProcessed            | NONE            | ALL              | 325000 |
| 2025-01-01    | daily        | TotalUlisProcessedPerOperator | operator        | OP\_A            | 100000 |
| 2025-01-01    | daily        | TotalImsisPerDomicile         | domicile        | domestic         | 40000  |
| 2025-01-01    | daily        | UlisPerEventType              | event\_type     | LOCATION\_UPDATE | 250000 |

#### List of KPI Names and Dimensions (per AIGIS‑71‑FS §WK‑P02–P03)

##### ULI Ingestion KPIs

| Category      | KPI Name                                      | Dimension Type   | Dimension Values (examples)                                       |
| ------------- | --------------------------------------------- | ---------------- | ----------------------------------------------------------------- |
| ULI Ingestion | TotalUlisProcessed                            | NONE             | ALL                                                               |
| ULI Ingestion | TotalUlisProcessedPerOperator                 | operator         | OP\_A, OP\_B, OP\_C, …                                            |
| ULI Ingestion | TotalUlisProcessedPerSubscriberType           | subscriber\_type | domestic, foreign, unknown                                        |
| ULI Ingestion | TotalUlisProcessedPerRatType                  | rat\_type        | GSM, UMTS, LTE, WiFi, unknown                                     |
| ULI Ingestion | TotalUlisProcessedPerLocationMethod           | location\_method | WLS, ECID, CID, A-GPS, Hybrid, rWLS                               |
| ULI Ingestion | UlisPerEventType                              | event\_type      | All event types defined in Le+ (LOCATION\_UPDATE, CALL\_START, …) |
| ULI Ingestion | TotalUlisProcessedPerSubEventType             | sub\_event\_type | All sub-event types defined in Le+                                |
| ULI Ingestion | TotalUlisRejected                             | NONE             | ALL                                                               |
| ULI Ingestion | TotalUlisRejectedPerOperator                  | operator         | OP\_A, OP\_B, OP\_C, …                                            |
| ULI Ingestion | TotalMassReportsReceived                      | NONE             | ALL                                                               |
| ULI Ingestion | TotalMassReportsReceivedPerOperator           | operator         | OP\_A, OP\_B, OP\_C, …                                            |
| ULI Ingestion | TotalMassReportsReceivedPerMassService        | mass\_service    | MCUE-n, EVRPT-n, MAGS, MTUE-p, …                                  |
| ULI Ingestion | TotalCorruptMassReportsReceived               | NONE             | ALL                                                               |
| ULI Ingestion | TotalCorruptMassReportsReceivedPerOperator    | operator         | OP\_A, OP\_B, OP\_C, …                                            |
| ULI Ingestion | TotalCorruptMassReportsReceivedPerMassService | mass\_service    | MCUE-n, EVRPT-n, MAGS, MTUE-p, …                                  |
| ULI Ingestion | TotalOutboundRoamerUlis                       | NONE             | ALL                                                               |
| ULI Ingestion | TotalOutboundRoamerUlisPerOperator            | operator         | OP\_A, OP\_B, OP\_C, …                                            |

##### Subscriber KPIs

| Category        | KPI Name                                                   | Dimension Type   | Dimension Values (examples) |
| --------------- | ---------------------------------------------------------- | ---------------- | --------------------------- |
| Subscriber KPIs | TotalImsis                                                 | NONE             | ALL                         |
| Subscriber KPIs | TotalImsisPerOperator                                      | operator         | OP\_A, OP\_B, OP\_C, …      |
| Subscriber KPIs | TotalImsisPerDomicile                                      | domicile         | domestic, foreign, unknown  |
| Subscriber KPIs | DailyMsisdnsTotal                                          | NONE             | ALL                         |
| Subscriber KPIs | DailyImsisTotal                                            | NONE             | ALL                         |
| Subscriber KPIs | DailyImsisPerOperator                                      | operator         | OP\_A, OP\_B, OP\_C, …      |
| Subscriber KPIs | DailyImsisPerSubscriberType                                | subscriber\_type | domestic, foreign, unknown  |
| Subscriber KPIs | DomesticInRoamersPerOperator                               | operator         | OP\_A, OP\_B, OP\_C, …      |
| Subscriber KPIs | DomesticOutRoamersPerOperator                              | operator         | OP\_A, OP\_B, OP\_C, …      |
| Subscriber KPIs | InternationalOutRoamersPerOperator                         | operator         | OP\_A, OP\_B, OP\_C, …      |
| Subscriber KPIs | DailyImsisWithNoCallEvent                                  | NONE             | ALL                         |
| Subscriber KPIs | DailyImsisWithOneEvent                                     | NONE             | ALL                         |
| Subscriber KPIs | NumberOfIMSI24/nLocationsWith AccuracyOtherThanCIDAreFound | subscriber\_type | domestic, foreign, unknown  |
| Subscriber KPIs | DailyImsisAddedPerSubscriberType                           | subscriber\_type | domestic, foreign, unknown  |

##### Event Type KPIs

| Category        | KPI Name         | Dimension Type | Dimension Values (examples)                                            |
| --------------- | ---------------- | -------------- | ---------------------------------------------------------------------- |
| Event Type KPIs | UlisPerEventType | event\_type    | All event types defined in Le+ (e.g. LOCATION\_UPDATE, CALL\_START, …) |

---

### 2.2 `dbsbm.kpi` — WINT‑SBM KPIs (Daily & Weekly)

`dbsbm.kpi` follows the same dimensional pattern but supports both daily counters and weekly yield/distribution KPIs.

```sql
CREATE TABLE dbsbm.kpi
(
    bucket_start Date,
    bucket_type  Enum8('daily' = 1, 'weekly' = 2),

    kpi_name     LowCardinality(String),

    -- Dimensional model (same pattern as dbuli)
    dimension_type  LowCardinality(String) DEFAULT 'NONE',
    dimension_value LowCardinality(String) DEFAULT 'ALL',

    value       Float64,
    updated_at  DateTime DEFAULT now(),
    version     UInt32   DEFAULT 1
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(bucket_start)
ORDER BY (bucket_type, bucket_start, kpi_name, dimension_type, dimension_value)
SETTINGS index_granularity = 8192;
```

#### Columns

| Column           | Type                             | Description                                                   |
| ---------------- | -------------------------------- | ------------------------------------------------------------- |
| bucket\_start    | Date                             | Start of KPI bucket (day or week)                             |
| bucket\_type     | Enum8('daily' = 1, 'weekly' = 2) | Bucket type                                                   |
| kpi\_name        | LowCardinality(String)           | Logical KPI name (e.g. `TotalSbms`, `StaypointCoverage`)      |
| dimension\_type  | LowCardinality(String)           | Dimension type (`NONE`, `count_bucket`, `duration_bucket`, …) |
| dimension\_value | LowCardinality(String)           | Dimension value for the chosen dimension type                 |
| value            | Float64                          | KPI value for this `(bucket, kpi, dimension)` slice           |
| updated\_at      | DateTime                         | Last update timestamp for this row                            |
| version          | UInt32                           | Schema/data version tag                                       |

#### Dimensional usage (SBM)

SBM uses the same dimensional pattern as ULI, with the following dimension types:

- **Global KPIs (no breakdown)**

  - `dimension_type = 'NONE'`
  - `dimension_value = 'ALL'`\
    Used for daily counters such as `ImsisCreatedTotal`, `ImsisUpdatedTotal`, etc.

- **Per-subscriber-type KPIs (daily counters)**

  - `dimension_type = 'subscriber_type'`
  - `dimension_value ∈ {'domestic','foreign','unknown'}`\
    Used for `ImsisCreatedPerSubscriberType` and `ImsisUpdatedPerSubscriberType`.

- **Stay-point count buckets (weekly yield)**

  - `dimension_type = 'staypoint_count_bucket'`
  - `dimension_value` is the number of stay-points, for example `1`, `2`, …, `99`, `100`, `>100`.\
    Used for `StaypointCoverage`.

- **Role detection speed (weekly yield)**

  - `dimension_type = 'week_lag'`
  - `dimension_value` is the age of the stay-points in weeks, for example `1_week`, `2_weeks`, `3_weeks`, `4_weeks`, `5_weeks`.\
    Used for `RoleDetectionSpeedHome` and `RoleDetectionSpeedWork`.

- **Time coverage buckets (weekly yield)**

  - `dimension_type = 'duration_hours'`
  - `dimension_value` is an hour bucket, for example `<1`, `1-2`, `2-3`, …, `167-168`.\
    Used for `VisitTimeCoverage`, `TripTimeCoverage`.

- **Trip count between same stay-points (weekly yield)**

  - `dimension_type = 'trip_count_between_same_points'`
  - `dimension_value` is the number of trips between the same pair of stay-points, for example `1`, `2`, `3`, `4`, `5`, `6`, `7`, `>7`.\
    Used for `TripCountBetweenSameStaypoints`.

Additional dimension types can be added if new SBM KPIs require them.

##### Example rows in `dbsbm.kpi`

Small example showing daily counters and weekly yield rows together:

| bucket\_start | bucket\_type | kpi\_name         | dimension\_type  | dimension\_value | value  |
| ------------- | ------------ | ----------------- | ---------------- | ---------------- | ------ |
| 2025-01-01    | daily        | ImsisCreatedTotal | NONE             | ALL              | 670000 |
| 2025-01-01    | daily        | ImsisUpdatedTotal | NONE             | ALL              | 1000   |
| 2025-01-06    | weekly       | StaypointCoverage | count\_bucket    | 2-3              | 200    |
| 2025-01-06    | weekly       | VisitTimeCoverage | duration\_bucket | 1-3h             | 100    |

#### List of KPI Names and Dimensions (per AIGIS‑71‑FS §WK‑P04–P05)

##### SBM Counters (daily)

| Category     | KPI Name                      | Frequency | Dimension Type   | Dimension Values (examples) |
| ------------ | ----------------------------- | --------- | ---------------- | --------------------------- |
| SBM Counters | ImsisCreatedTotal             | Daily     | NONE             | ALL                         |
| SBM Counters | ImsisCreatedPerSubscriberType | Daily     | subscriber\_type | domestic, foreign, unknown  |
| SBM Counters | ImsisUpdatedTotal             | Daily     | NONE             | ALL                         |
| SBM Counters | ImsisUpdatedPerSubscriberType | Daily     | subscriber\_type | domestic, foreign, unknown  |
| SBM Counters | ImsisWithMsisdnChangedTotal   | Daily     | NONE             | ALL                         |
| SBM Counters | ImsisWithImeiChangedTotal     | Daily     | NONE             | ALL                         |
| SBM Counters | StaypointsAddedTotal          | Daily     | NONE             | ALL                         |
| SBM Counters | StaypointsUpdatedTotal        | Daily     | NONE             | ALL                         |
| SBM Counters | StaypointsRemovedTotal        | Daily     | NONE             | ALL                         |
| SBM Counters | VisitsAddedTotal              | Daily     | NONE             | ALL                         |
| SBM Counters | TripsAddedTotal               | Daily     | NONE             | ALL                         |
| SBM Counters | CallsAddedTotal               | Daily     | NONE             | ALL                         |
| SBM Counters | SmsAddedTotal                 | Daily     | NONE             | ALL                         |
| SBM Counters | BpartiesAddedTotal            | Daily     | NONE             | ALL                         |
| SBM Counters | RolesCreatedTotal             | Daily     | NONE             | ALL                         |
| SBM Counters | RolesUpdatedTotal             | Daily     | NONE             | ALL                         |
| SBM Counters | RolesRemovedTotal             | Daily     | NONE             | ALL                         |

##### SBM Yield KPIs (weekly)

| Category  | KPI Name                                                                                                         | Frequency | Dimension Type                     | Dimension Values (examples)                     |
| --------- | ---------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------- | ----------------------------------------------- |
| SBM Yield | StaypointCoverage                                                                                                | Weekly    | staypoint\_count\_bucket           | 1, 2, …, 99, 100, >100                          |
| SBM Yield | Number of IMSIs with all stay-points with 0 roles                                                                | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with any stay-point with 1 role.                                                                 | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with any 1 stay-point with 2 role changes.                                                       | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with any 1 stay-point with greater than 2 role changes.                                          | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with any 1 stay-point with Home role.                                                            | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with stay-points with 2 or more Home role changes.                                               | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with any 1 stay-point with Work role.                                                            | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with stay-points with 2 or more Work role changes.                                               | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with one stay-point with Home role and another stay-point with Work roles.                       | Weekly    | NONE                               | ALL                                             |
| SBM Yield | RoleDetectionSpeedHome                                                                                           | Weekly    | week\_lag                          | 1\_week, 2\_weeks, 3\_weeks, 4\_weeks, 5\_weeks |
| SBM Yield | RoleDetectionSpeedWork                                                                                           | Weekly    | week\_lag                          | 1\_week, 2\_weeks, 3\_weeks, 4\_weeks, 5\_weeks |
| SBM Yield | VisitTimeCoverage                                                                                                | Weekly    | duration\_hours                    | <1, 1-2, 2-3, …, 167-168                        |
| SBM Yield | TripTimeCoverage                                                                                                 | Weekly    | duration\_hours                    | <1, 1-2, 2-3, …, 167-168                        |
| SBM Yield | TripCountBetweenSameStaypoints                                                                                   | Weekly    | trip\_count\_between\_same\_points | 1, 2, 3, 4, 5, 6, 7, >7                         |
| SBM Yield | Number of IMSIs with top 40% stay-points with less than or equal to 150m average uncertainty.                    | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with top 40% stay-points created 1 week ago with average uncertainty less than or equal to 500m. | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with top 40% stay-points created 2 weeks ago with average uncertainty less than or equal to 400m | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with top 40% stay-points created 3 weeks ago with average uncertainty less than or equal to 300m | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with top 40% stay-points created 4 weeks ago with average uncertainty less than or equal to 200m | Weekly    | NONE                               | ALL                                             |
| SBM Yield | Number of IMSIs with top 40% stay-points created 5 week ago with average uncertainty less than or equal to100m   | Weekly    | NONE                               | ALL                                             |

---

## 3. Alignment with AIGIS‑71‑FS

| FS Section           | Design Compliance                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| #WK‑C01 KPI Display  | UI can fetch daily (7‑day) and monthly (30‑day) metrics using date filters.                                   |
| #WK‑P02–P03 ULI KPIs | All ingestion and subscriber KPIs from FS included as `kpi_name` values.                                      |
| #WK‑P04–P05 SBM KPIs | All daily counter and weekly yield KPIs included as `kpi_name` values.                                        |
| #WK‑S04 Storage      | ClickHouse MergeTree supports ≥ 6 months retention and efficient compression.                                 |
| #WK‑S05 Performance  | Sub‑second query time for 7/30‑day windows using ordered keys including `dimension_type` / `dimension_value`. |

---

