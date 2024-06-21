import Default from '@/layouts/default.vue'

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
      {
        path: '/rainbow',
        redirect: '/rainbow/all',
        children: [
          {
            path: '/rainbow/all',
            component: () => import('@/pages/work/rainbow.vue'),
          }, {
            path: '/rainbow/cinema_hall',
            component: () => import('@/views/pages/projects/cinema-hall.vue'),
          },
          {
            path: '/rainbow/smart_operation',
            component: () => import('@/views/pages/projects/smart-operation.vue'),
          },
          {
            path: '/rainbow/smart_area',
            component: () => import('@/views/pages/projects/smart-area.vue'),
          },
          {
            path: '/rainbow/topo_tool',
            component: () => import('@/views/pages/projects/topo-tool.vue'),
          },
        ],
      },


      {
        path: '/:pathMatch(.*)*',
        component: () => import('@/pages/[...error].vue'),
      },
    ],

  },
  // {
  //   path: '/',
  //   component: () => import('@/layouts/blank.vue'),
  //   children: [
  //     {
  //       path: 'login',
  //       component: () => import('@/pages/login.vue'),
  //     },
  //     {
  //       path: 'register',
  //       component: () => import('@/pages/register.vue'),
  //     },
  //     {
  //       path: '/:pathMatch(.*)*',
  //       component: () => import('@/pages/[...error].vue'),
  //     },
  //   ],
  // },
]
