import Default from '@/layouts/default.vue'
import details from '@/data/details'

export const routes = [
  { path: '/', redirect: '/person' },
  {
    path: '/',
    component: Default,
    redirect: '/person',
    children: [
      {
        path: '/person',
        component: () => import('@/pages/personal/personal.vue'),
      },

      // 项目综合页：单一模板，由 companies 数据驱动（category 取路由参数）
      {
        path: '/:category',
        redirect: to => `/${to.params.category}/all`,
      },
      {
        path: '/:category/all',
        component: () => import('@/pages/work/ProjectOverview.vue'),
      },

      // 项目详情页：完全由 src/data/details/ 下按单位拆分的 json 驱动
      {
        path: '/project/:category/:slug',
        component: () => import('@/components/ProjectDetail.vue'),
      },

      // 旧版详情 URL（如 /rainbow/pharmacy、/jinhe/chemistry_plant，无 /project 前缀，
      // 且分类可能与现数据不一致）向后兼容：按 slug 查出正确分类后重定向到新地址。
      {
        path: '/:category/:slug',
        redirect: to => {
          const d = details.find(x => x.slug === to.params.slug)
          return d ? `/project/${d.category}/${d.slug}` : '/person'
        },
      },

      {
        path: '/:pathMatch(.*)*',
        component: () => import('@/pages/[...error].vue'),
      },
    ],
  },
]
