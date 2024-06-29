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
            component: () => import('@/views/pages/projects/rainbow/cinema-hall.vue'),
          },
          {
            path: '/rainbow/smart_operation',
            component: () => import('@/views/pages/projects/rainbow/smart-operation.vue'),
          }, {
            path: '/rainbow/pharmacy',
            component: () => import('@/views/pages/projects/rainbow/pharmacy.vue'),
          },
          {
            path: '/rainbow/smart_area',
            component: () => import('@/views/pages/projects/rainbow/smart-area.vue'),
          },
          {
            path: '/rainbow/topo_tool',
            component: () => import('@/views/pages/projects/rainbow/topo-tool.vue'),
          },
        ],
      },

      {
        path: '/jinhe',
        redirect: '/jinhe/all',
        children: [
          {
            path: '/jinhe/all',
            component: () => import('@/pages/work/jinhe.vue'),
          },
          {
            path: '/jinhe/chemistry_plant',
            component: () => import('@/views/pages/projects/jinhe/chemistry_plant.vue'),
          },
          {
            path: '/jinhe/ruidebaoer',
            component: () => import('@/views/pages/projects/jinhe/ruidebaoer.vue'),
          },

        ],
      },
      {
        path: '/shuzixinxi',
        redirect: '/shuzixinxi/all',
        children: [
          {
            path: '/shuzixinxi/all',
            component: () => import('@/pages/work/shuzixinxi.vue'),
          },
          {
            path: '/shuzixinxi/book_reader',
            component: () => import('@/views/pages/projects/shuzixinxi/book-reader.vue'),
          },
          {
            path: '/shuzixinxi/dinosaur',
            component: () => import('@/views/pages/projects/shuzixinxi/dinosaur.vue'),
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
