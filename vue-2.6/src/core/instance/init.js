/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation 优化内部组件实例化
      // since dynamic options merging is pretty slow, and none of the 因为动态选项合并是相当缓慢的，没有
      // internal component options needs special treatment. 内部组件选项需要特殊处理。
      initInternalComponent(vm, options)
    } else {
      // 选项合并
      // 两个 for 循环规定了合并的顺序，以自定义选项策略优先，如果没有才会使用默认策略。而 strats 下每个 key 对应的便是每个特殊选项的合并策略。
      // 1.如果合并的子父配置都具有相同的选项，则只需要按照规定好的策略进行选项合并即可。2.有子类配置选项则默认使用子类配置选项，没有则选择父类配置选项。
      /*
        mergeOptions合并options参数（ resolveConstructorOptions合并vm.constructor构造函数的属性options）。 集合在 vm.options 上。
        选项检查： components\ prop\ inject\ directive
          1. checkComponents(child)
            1. 正则判断非法的标签
            2. 不能使用Vue自身自定义的组件名， html的保留标签。
          2. normalizeProps(child, vm)
            形式： 数组、 对象形式； 两种形式最终都会转换成对象的形式。
            规则： 1. 数组形式保证是字符串 2. 非数组， 非对象则判定props选项传递非法
          3. normalizeInject(child, vm)
            inject 选项有两种写法， 数组的方式以及对象的方式， 和 props 的校验规则一致， 最终 inject 都会转换成对象的形式存在。
          4. normalizeDirectives(child)
            针对函数的写法会将行为赋予 bind， update 钩子。
        选项合并：
          1. 常规选项合并（ el， data）。
            只允许 vue 实例才拥有 el 属性， 其他子类构造器不允许有 el 属性。
            mergeDataOrFn 将父类的数据整合到子类的数据选项中， 如若父类数据和子类数据冲突时， 保留子类数据， 如果对象深层嵌套， 则需要递归调用 mergeData 进行数据合并。
          2. 默认资源合并（ component、 directive、 filter）。
            父类选项将以原型链的形式被处理。
          3. 生命周期钩子函数合并（ 'beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed', 'activated', 'deactivated', 'errorCaptured', 'ssrPrefetch'）
            mergeHook 策略， 对于生命周期钩子选项， 子类和父类相同的选项将合并成数组。 父会优先于子执行。
          4. watch 选项合并。 和父类选项合并成数组。
          5. props, methods, inject, computed 类似选项合并。 如果父类不存在选项， 则返回子类选项， 子类父类都存在时， 用子类选项去覆盖父类选项。
      */
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // 对 vm 实例进行一层代理
      /*
        为 vm 实例化对象添加了 _renderProxy 方法。
        拦截 with 语句下的作用对象, 对非法没有定义的变量进行筛选判断。
      */
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // 初始化生命周期
    /*
      为 vm 添加了$root、 $parent、 $children、 $refs等属性。
    */
    initLifecycle(vm)
    // 初始化事件中心
    /*
      如果 vm.$options._parentListeners 事件存在， updateComponentListenets 更新组件事件， 添加新的事件， 删除旧的事件。
      updateListeners 更新事件。 add添加事件（ 1. once标志真调用 $once 执行一次函数就解绑 2.once标志为假， $on 添加事件， 把事件推进队列去 vm._events[event] ）
    */
    initEvents(vm)
    // 初始化渲染
    /*
      为 vm 添加 _vnode、 $slots、 $scopedSlots等属性。 添加了 _c 和 createElement 两个渲染方法。
      并且把 $attrs 属性和 $listener 事件属性添加到 defineReactive 观察者中。
    */
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props 在data/props之前resolve injections
    // 构建响应式系统
    /*
      1. initProps 将props属性设置为响应式数据
      2. initMethods 必须为函数； 命名不能props重复； 不能 _ $ 命名; 挂载到根实例上。
      3. initComputed 对象时要有 getter 方法； 对每个属性创建个监听依赖； 设计响应式数据； 命名防止和data、 props冲突。
      4. initData 命名不能和props、 methods重复； 数据代理（ vm.$data）;为data绑定一个观察者observer。
    */
    /*
      initDate - > new Observer(options.data) - > this.walk(data) - > defineReactive(obj, keys[i]) - > new Dep();
      Object.defineProperty(obj, key, {get() { // 做依赖的收集 dep.depend()},set(nval) {// 派发更新 dep.notify();})
      * 依赖收集的过程（每个数据都是一个依赖管理器，每个使用的数据就是一个依赖，当访问到数据时会将当前访问的场景作为一个依赖收集到依赖管理器中。）
      * 派发更新的过程 1.判断数据更改前后一致情况；2.新值为对象，对属性做依赖收集；3.通知该数据收集watcher依赖，遍历每个watcher，进行更新，调用dep.notify()；4.更新时将每个watcher推到队列中，下个tick进行run操作。5.执行run方法，执行get方法，重新计算新值，依赖的清除。
    */
    initState(vm)
    initProvide(vm) // resolve provide after data/props resolve提供后的data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }
    // 实例挂载和模板编译
    /*

    */
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration. 这样做是因为它比动态枚举更快。
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
