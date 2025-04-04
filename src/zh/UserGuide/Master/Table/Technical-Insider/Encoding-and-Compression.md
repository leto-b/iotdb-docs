<!--

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at
    
        http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.

-->

# 压缩&编码

## 1. 编码方式

### 1.1 基本编码方式

为了提高数据的存储效率，需要在数据写入的过程中对数据进行编码，从而减少磁盘空间的使用量。在写数据以及读数据的过程中都能够减少 I/O 操作的数据量从而提高性能。IoTDB 支持多种针对不同类型的数据的编码方法：

1. PLAIN 编码（PLAIN）

    PLAIN 编码，默认的编码方式，即不编码，支持多种数据类型，压缩和解压缩的时间效率较高，但空间存储效率较低。

2. 二阶差分编码（TS_2DIFF）

    二阶差分编码，比较适合编码单调递增或者递减的序列数据，不适合编码波动较大的数据。

3. 游程编码（RLE）

    游程编码，比较适合存储某些数值连续出现的序列，不适合编码大部分情况下前后值不一样的序列数据。

    游程编码也可用于对浮点数进行编码，但在创建时间序列的时候需指定保留小数位数。比较适合存储某些浮点数值连续出现的序列数据，不适合存储对小数点后精度要求较高以及前后波动较大的序列数据。

    > 游程编码（RLE）和二阶差分编码（TS_2DIFF）对 float 和 double 的编码是有精度限制的，默认保留 2 位小数。推荐使用 GORILLA。

4. GORILLA 编码（GORILLA）

    GORILLA 编码是一种无损编码，它比较适合编码前后值比较接近的数值序列，不适合编码前后波动较大的数据。

    当前系统中存在两个版本的 GORILLA 编码实现，推荐使用`GORILLA`，不推荐使用`GORILLA_V1`（已过时）。

    使用限制：使用 Gorilla 编码 INT32 数据时，需要保证序列中不存在值为`Integer.MIN_VALUE`的数据点；使用 Gorilla 编码 INT64 数据时，需要保证序列中不存在值为`Long.MIN_VALUE`的数据点。

5. 字典编码 （DICTIONARY）

    字典编码是一种无损编码。它适合编码基数小的数据（即数据去重后唯一值数量小）。不推荐用于基数大的数据。

6. ZIGZAG 编码

    ZigZag编码将有符号整型映射到无符号整型，适合比较小的整数。

7. CHIMP 编码

    CHIMP 是一种无损编码。它是一种新的流式浮点数据压缩算法，可以节省存储空间。这个编码适用于前后值比较接近的数值序列，对波动小和随机噪声少的序列数据更加友好。

    使用限制：如果对 INT32 类型数据使用 CHIMP 编码，需要确保数据点中没有 `Integer.MIN_VALUE`。 如果对 INT64 类型数据使用 CHIMP 编码，需要确保数据点中没有 `Long.MIN_VALUE`。

8. SPRINTZ 编码

    SPRINTZ编码是一种无损编码，将原始时序数据分别进行预测、Zigzag编码、位填充和游程编码。SPRINTZ编码适合差分值的绝对值较小（即波动较小）的时序数据，不适合差分值较大（即波动较大）的时序数据。

9. RLBE 编码

    RLBE编码是一种无损编码，将差分编码，位填充编码，游程长度，斐波那契编码和拼接等编码思想结合到一起。RLBE编码适合递增且递增值较小的时序数据，不适合波动较大的时序数据。

### 1.2 数据类型与编码的对应关系

前文介绍的五种编码适用于不同的数据类型，若对应关系错误，则无法正确创建时间序列。数据类型与支持其编码的编码方式对应关系总结如下表所示。

| **数据类型** | **推荐编码（默认）** | **支持的编码**                                              |
| ------------ | ---------------------- | ----------------------------------------------------------- |
| BOOLEAN      | RLE                    | PLAIN, RLE                                                  |
| INT32        | TS_2DIFF               | PLAIN, RLE, TS_2DIFF, GORILLA, ZIGZAG, CHIMP, SPRINTZ, RLBE |
| DATE         | TS_2DIFF               | PLAIN, RLE, TS_2DIFF, GORILLA, ZIGZAG, CHIMP, SPRINTZ, RLBE |
| INT64        | TS_2DIFF               | PLAIN, RLE, TS_2DIFF, GORILLA, ZIGZAG, CHIMP, SPRINTZ, RLBE |
| TIMESTAMP    | TS_2DIFF               | PLAIN, RLE, TS_2DIFF, GORILLA, ZIGZAG, CHIMP, SPRINTZ, RLBE |
| FLOAT        | GORILLA                | PLAIN, RLE, TS_2DIFF, GORILLA, CHIMP, SPRINTZ, RLBE         |
| DOUBLE       | GORILLA                | PLAIN, RLE, TS_2DIFF, GORILLA, CHIMP, SPRINTZ, RLBE         |
| TEXT         | PLAIN                  | PLAIN, DICTIONARY                                           |
| STRING       | PLAIN                  | PLAIN, DICTIONARY                                           |
| BLOB         | PLAIN                  | PLAIN                                                       |

当用户输入的数据类型与编码方式不对应时，系统会提示错误。如下所示，二阶差分编码不支持布尔类型：

```
IoTDB> create timeseries root.ln.wf02.wt02.status WITH DATATYPE=BOOLEAN, ENCODING=TS_2DIFF
Msg: 507: encoding TS_2DIFF does not support BOOLEAN
```

## 2. 压缩方式

当时间序列写入并按照指定的类型编码为二进制数据后，IoTDB 会使用压缩技术对该数据进行压缩，进一步提升空间存储效率。虽然编码和压缩都旨在提升存储效率，但编码技术通常只适合特定的数据类型（如二阶差分编码只适合与 INT32 或者 INT64 编码，存储浮点数需要先将他们乘以 10m 以转换为整数），然后将它们转换为二进制流。压缩方式（SNAPPY）针对二进制流进行压缩，因此压缩方式的使用不再受数据类型的限制。

### 2.1 基本压缩方式

IoTDB 允许在创建一个时间序列的时候指定该列的压缩方式。现阶段 IoTDB 支持以下几种压缩方式：

* UNCOMPRESSED（不压缩）
* SNAPPY 压缩
* LZ4 压缩（推荐压缩方式）
* GZIP 压缩
* ZSTD 压缩
* LZMA2 压缩


### 2.2 压缩比统计信息

压缩比统计信息文件：data/datanode/system/compression_ratio

* ratio_sum: memtable压缩比的总和
* memtable_flush_time: memtable刷盘的总次数

通过 `ratio_sum / memtable_flush_time` 可以计算出平均压缩比