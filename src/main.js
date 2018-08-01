import Vue from 'vue';
import VueRouter from 'vue-router';
import io from 'socket.io-client';

import App from '@/App.vue';
import store from '@/store/store';

import Splash from '@/components/Splash.vue';
import Room from '@/components/NewRoom.vue';
import Login from '@/components/Login.vue';
import ErrorPage from '@/components/ErrorPage.vue';

Vue.config.productionTip = false;

const SERVER_URL = 'https://johnstonjacob.com/';

const socket = io.connect(SERVER_URL, {
  secure: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
});

Vue.use(VueRouter);

const routes = [
  { path: '/', component: Splash },
  {
    path: '/room/:roomId',
    component: Room,
    props: true,
    beforeEnter(_, __, next) {
      if (!Vue.prototype.$socket) {
        Vue.prototype.$socket = socket;
      }
      next();
    },
  },
  { path: '/login', component: Login },
  { path: '/error', component: ErrorPage },
];

const router = new VueRouter({
  routes,
});

new Vue({
  render: (h) => h(App),
  router,
  store,
}).$mount('#app');

export default router;
