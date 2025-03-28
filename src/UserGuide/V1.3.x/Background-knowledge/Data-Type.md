<!--
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
-->

# Data Type

## Basic Data Type

IoTDB supports the following data types:

- BOOLEAN (Boolean)
- INT32 (Integer)
- INT64 (Long Integer)
- FLOAT (Single Precision Floating Point)
- DOUBLE (Double Precision Floating Point)
- TEXT (Long String)
- STRING（String）
- BLOB（Large binary Object）
- TIMESTAMP（Timestamp）
- DATE（Date）

The difference between STRING and TEXT types is that STRING type has more statistical information and can be used to optimize value filtering queries, while TEXT type is suitable for storing long strings.

### Float Precision

The time series of **FLOAT** and **DOUBLE** type can specify (MAX_POINT_NUMBER, see [this page](../SQL-Manual/SQL-Manual.md) for more information on how to specify), which is the number of digits after the decimal point of the floating point number, if the encoding method is [RLE](../Technical-Insider/Encoding-and-Compression.md) or [TS_2DIFF](../Technical-Insider/Encoding-and-Compression.md). If MAX_POINT_NUMBER is not specified, the system will use [float_precision](../Reference/DataNode-Config-Manual.md) in the configuration file `iotdb-system.properties`.

```sql
CREATE TIMESERIES root.vehicle.d0.s0 WITH DATATYPE=FLOAT, ENCODING=RLE, 'MAX_POINT_NUMBER'='2';
```

- For Float data value, The data range is (-Integer.MAX_VALUE, Integer.MAX_VALUE), rather than Float.MAX_VALUE, and the max_point_number is 19, caused by the limitation of function Math.round(float) in Java.
- For Double data value, The data range is (-Long.MAX_VALUE, Long.MAX_VALUE), rather than Double.MAX_VALUE, and the max_point_number is 19, caused by the limitation of function Math.round(double) in Java (Long.MAX_VALUE=9.22E18).

### Data Type Compatibility

When the written data type is inconsistent with the data type of time-series,

- If the data type of time-series is not compatible with the written data type, the system will give an error message.
- If the data type of time-series is compatible with the written data type, the system will automatically convert the data type.

The compatibility of each data type is shown in the following table:

| Series Data Type | Supported Written Data Types      |
| ---------------- | ----------------------------------|
| BOOLEAN          | BOOLEAN                           |
| INT32            | INT32                             |
| INT64            | INT32 INT64 TIMESTAMP             |
| FLOAT            | INT32 FLOAT                       |
| DOUBLE           | INT32 INT64 FLOAT DOUBLE TIMESTAMP|
| TEXT             | TEXT STRING                       |
| STRING           | TEXT STRING                       |
| BLOB             | TEXT STRING BLOB                  |
| TIMESTAMP        | INT32 INT64 TIMESTAMP             |
| DATE             | DATE                              |

## Timestamp

The timestamp is the time point at which data is produced. It includes absolute timestamps and relative timestamps

### Absolute timestamp

Absolute timestamps in IoTDB are divided into two types: LONG and DATETIME (including DATETIME-INPUT and DATETIME-DISPLAY). When a user inputs a timestamp, he can use a LONG type timestamp or a DATETIME-INPUT type timestamp, and the supported formats of the DATETIME-INPUT type timestamp are shown in the table below:

::: center

**Supported formats of DATETIME-INPUT type timestamp**

|            Format            |
| :--------------------------: |
|     yyyy-MM-dd HH:mm:ss      |
|     yyyy/MM/dd HH:mm:ss      |
|     yyyy.MM.dd HH:mm:ss      |
|    yyyy-MM-dd HH:mm:ssZZ     |
|    yyyy/MM/dd HH:mm:ssZZ     |
|    yyyy.MM.dd HH:mm:ssZZ     |
|   yyyy/MM/dd HH:mm:ss.SSS    |
|   yyyy-MM-dd HH:mm:ss.SSS    |
|   yyyy.MM.dd HH:mm:ss.SSS    |
|  yyyy-MM-dd HH:mm:ss.SSSZZ   |
|  yyyy/MM/dd HH:mm:ss.SSSZZ   |
|  yyyy.MM.dd HH:mm:ss.SSSZZ   |
| ISO8601 standard time format |

:::

IoTDB can support LONG types and DATETIME-DISPLAY types when displaying timestamps. The DATETIME-DISPLAY type can support user-defined time formats. The syntax of the custom time format is shown in the table below:

::: center

**The syntax of the custom time format**

| Symbol |           Meaning           | Presentation |              Examples              |
| :----: | :-------------------------: | :----------: | :--------------------------------: |
|   G    |             era             |     era      |                era                 |
|   C    |    century of era (>=0)     |    number    |                 20                 |
|   Y    |      year of era (>=0)      |     year     |                1996                |
|        |                             |              |                                    |
|   x    |          weekyear           |     year     |                1996                |
|   w    |      week of weekyear       |    number    |                 27                 |
|   e    |         day of week         |    number    |                 2                  |
|   E    |         day of week         |     text     |            Tuesday; Tue            |
|        |                             |              |                                    |
|   y    |            year             |     year     |                1996                |
|   D    |         day of year         |    number    |                189                 |
|   M    |        month of year        |    month     |           July; Jul; 07            |
|   d    |        day of month         |    number    |                 10                 |
|        |                             |              |                                    |
|   a    |       halfday of day        |     text     |                 PM                 |
|   K    |   hour of halfday (0~11)    |    number    |                 0                  |
|   h    | clockhour of halfday (1~12) |    number    |                 12                 |
|        |                             |              |                                    |
|   H    |     hour of day (0~23)      |    number    |                 0                  |
|   k    |   clockhour of day (1~24)   |    number    |                 24                 |
|   m    |       minute of hour        |    number    |                 30                 |
|   s    |      second of minute       |    number    |                 55                 |
|   S    |     fraction of second      |    millis    |                978                 |
|        |                             |              |                                    |
|   z    |          time zone          |     text     |     Pacific Standard Time; PST     |
|   Z    |     time zone offset/id     |     zone     | -0800; -08:00; America/Los_Angeles |
|        |                             |              |                                    |
|   '    |       escape for text       |  delimiter   |                                    |
|   ''   |        single quote         |   literal    |                 '                  |

:::

### Relative timestamp

Relative time refers to the time relative to the server time `now()` and `DATETIME` time.

Syntax:

```
Duration = (Digit+ ('Y'|'MO'|'W'|'D'|'H'|'M'|'S'|'MS'|'US'|'NS'))+
RelativeTime = (now() | DATETIME) ((+|-) Duration)+
```

::: center

**The syntax of the duration unit**

| Symbol |   Meaning   |       Presentation       | Examples |
| :----: | :---------: | :----------------------: | :------: |
|   y    |    year     |       1y=365 days        |    1y    |
|   mo   |    month    |       1mo=30 days        |   1mo    |
|   w    |    week     |        1w=7 days         |    1w    |
|   d    |     day     |         1d=1 day         |    1d    |
|        |             |                          |          |
|   h    |    hour     |     1h=3600 seconds      |    1h    |
|   m    |   minute    |      1m=60 seconds       |    1m    |
|   s    |   second    |       1s=1 second        |    1s    |
|        |             |                          |          |
|   ms   | millisecond | 1ms=1000_000 nanoseconds |   1ms    |
|   us   | microsecond |   1us=1000 nanoseconds   |   1us    |
|   ns   | nanosecond  |     1ns=1 nanosecond     |   1ns    |

:::

eg：

```
now() - 1d2h //1 day and 2 hours earlier than the current server time
now() - 1w //1 week earlier than the current server time
```

> Note：There must be spaces on the left and right of '+' and '-'.
