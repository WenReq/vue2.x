/* not type checking this file because flow doesn't play well with Proxy */

import config from 'core/config'
import { warn, makeMap, isNative } from '../util/index'

let initProxy

if (process.env.NODE_ENV !== 'production') {
  const allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  )

  const warnNonPresent = (target, key) => {
    warn(
      `Property or method "${key}" is not defined on the instance but ` +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    )
  }

  const warnReservedPrefix = (target, key) => {
    warn(
      `Property "${key}" must be accessed with "$data.${key}" because ` +
      'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
      'prevent conflicts with Vue internals' +
      'See: https://vuejs.org/v2/api/#data',
      target
    )
  }
  // 首先是判断浏览器是否支持原生的 proxy
  const hasProxy =
    typeof Proxy !== 'undefined' && isNative(Proxy)

  if (hasProxy) {
    const isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact')
    config.keyCodes = new Proxy(config.keyCodes, {
      set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(`Avoid overwriting built-in modifier in config.keyCodes: .${key}`)
          return false
        } else {
          target[key] = value
          return true
        }
      }
    })
  }

  const hasHandler = {
    // key in obj 或者 with 作用域时，会触发has的钩子
    // hasHandler 函数定义了 has 钩子，前面介绍过，proxy 的钩子有13个之多，而 has 是其中一个，它用来拦截 propKey in proxy 的操作，返回一个布尔值。而除了拦截 in 操作符外，has 钩子同样可以拦截 with 语句下的作用对象。
    has(target, key) {
      // 命名的规范是数据过滤检测的前提。
      const has = key in target
      // isAllowed用来判断模板上出现的变量是否合法。
      const isAllowed = allowedGlobals(key) ||
        (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
      // _和$开头的变量不允许出现在定义的数据中，因为他是vue内部保留属性的开头。
      // 1. warnReservedPrefix: 警告不能以$ _开头的变量
      // 2. warnNonPresent: 警告模板出现的变量在vue实例中未定义
      if (!has && !isAllowed) {
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return has || !isAllowed
    }
  }

  const getHandler = {
    get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return target[key]
    }
  }

  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use 确定要使用哪个代理处理程序
      const options = vm.$options
      // 当使用类似 webpack 这样的打包工具时，通常会使用 vue-loader 插件进行模板的编译，这个时候 options.render 是存在的，并且 _withStripped 的属性也会设置为true。
      // 我们分析使用 vue - loader 场景下 hasHandler 的逻辑。
      const handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler
      // 这个 render 函数就是包装成 with 的执行语句，在执行 with 语句的过程中，该作用域下变量的访问都会触发 has 钩子，这也是模板渲染时之所以会触发代理拦截的原因。
      vm._renderProxy = new Proxy(vm, handlers)
    } else {
      vm._renderProxy = vm
    }
  }
}

export { initProxy }
