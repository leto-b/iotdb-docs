/*
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
 */

import { sidebar } from 'vuepress-theme-hope';
import { zhSidebar as V201xTableSidebar } from './V2.0.x/zh-Table.js';
import { zhSidebar as V201xTreeSidebar } from './V2.0.x/zh-Tree.js';
import { zhSidebar as V103xSidebar } from './V1.3.x/zh.js';
import { zhSidebar as V102xSidebar } from './V1.2.x/zh.js';
import { zhSidebar as V013xSidebar } from './V0.13.x/zh.js';

export const zhSidebar = sidebar({
  ...V201xTableSidebar,
  ...V201xTreeSidebar,
  ...V103xSidebar,
  ...V102xSidebar,
  ...V013xSidebar,
});
