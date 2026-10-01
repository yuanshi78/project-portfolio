// 👉 全局年份配置：基准参数写在 personal.json（chinaSince / career.since / career.gap）
// 改 personal.json 即可全站同步，无需改代码。
// 工龄表达式：今年 - 职业起始年 - 不做职业的年数（空档）
import { personal } from '@/data/personal'

export const getYears = () =>
  new Date().getFullYear() - (personal.chinaSince ?? 2014)

export const getExpYears = () =>
  new Date().getFullYear() -
  (personal.career?.since ?? 2002) -
  (personal.career?.gap ?? 0)
