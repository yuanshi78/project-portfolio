// 👉 全局年份配置：只需改这里，所有页面的年数自动同步
// 来华 / 定居西安的年份（用于 {years}）
export const CHINA_SINCE = 2014
// 软件工程职业生涯起始年份（用于 {exp}，与“22 年经验”一致）
export const CAREER_SINCE = 2004

export const getYears = () => new Date().getFullYear() - CHINA_SINCE
export const getExpYears = () => new Date().getFullYear() - CAREER_SINCE
