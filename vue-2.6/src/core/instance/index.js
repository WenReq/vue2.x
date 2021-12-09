import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue) // 初始化：_init 实例化对象调用
stateMixin(Vue) // 数据：$data,$props,$set,$delete,$watch
eventsMixin(Vue) // 事件：$on,$off,$once,$emit
lifecycleMixin(Vue) // 生命周期：_update,$forceUpdate,$destroy
renderMixin(Vue) // 渲染：$nextTick,_render

export default Vue
