import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'

/*
** 为Vue添加静态属性和方法
  1. config 为Vue.config做层代理
  2. Vue.util 工具类（ 提示警告、 对象合并）
  3. 添加静态方法：
    Vue.set() 更新视图、 Vue.delete() 删除数据、 Vue.nextTick() 用于更新视图后回调递归
  4. 添加静态属性:
    添加 components, directives, filters 静态对象， 记录静态组件
  5. initUse - Vue.use() 安装插件、
    initMixin$1 - Vue.mixin() 合并参数、
    initExtend - Vue.extend() 继承
  6. initAssetRegisters - 添加 component, directive, filter 静态方法 定义组件、 指令、 过滤器
  7. 在一万多行又添加了 __patch__ 和 $mount 方法
*/
initGlobalAPI(Vue)

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})

Vue.version = '__VERSION__'

export default Vue
