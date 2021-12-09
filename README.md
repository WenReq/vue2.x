# vue2.x 源码解析

## 为Vue prototype 原型添加方法

  + **initMixin** 初始化：_init 实例化对象调用
  - **stateMixin** 数据：$data,$props,$set,$delete,$watch
  * **eventsMixin** 事件：$on,$off,$once,$emit
  + **lifecycleMixin** 生命周期：_update,$forceUpdate,$destroy
  - **renderMixin** 渲染：$nextTick,_render
  * 在一万多行又添加了 **__patch__** 和 **$mount** 方法
	
## 为Vue添加静态属性和方法
  **initGlobalAPI**
  
     1. config 为Vue.config做层代理
     2. Vue.util 工具类（提示警告、对象合并）</br>
     3. 添加静态方法：Vue.set()更新视图、Vue.delete()删除数据、Vue.nextTick()用于更新视图后回调递归
     4. 添加静态属性：添加 components,directives,filters 静态对象，记录静态组件
     5. initUse - Vue.use() 安装插件、initMixin$1 - Vue.mixin() 合并参数、initExtend - Vue.extend() 继承
     6. initAssetRegisters - 添加 component,directive,filter 静态方法 定义组件、指令、过滤器
     
## 实例化Vue this._init(options)
  + mergeOptions 合并选项
    mergeOptions合并options参数（resolveConstructorOptions合并vm.constructor构造函数的属性options）。集合在 vm.options 上。
    - 选项检查：   
      1. components（checkComponents(child)）1.正则判断非法的标签 2.不能使用Vue自身自定义的组件名，html的保留标签。
      2. prop（normalizeProps(child, vm)）形式：数组、对象形式；两种形式最终都会转换成对象的形式。规则：1.数组形式保证是字符串 2.非数组，非对象则判定props选项传递非法
      3. inject（normalizeInject(child, vm)）inject 选项有两种写法，数组的方式以及对象的方式，和 props 的校验规则一致，最终 inject 都会转换成对象的形式存在。
      4. directive（normalizeDirectives(child)）。针对函数的写法会将行为赋予 bind，update  钩子。
    - 合并选项：   
      1. 常规选项合并（el，data）；只允许vue实例才拥有el属性，其他子类构造器不允许有el属性。mergeDataOrFn 将父类的数据整合到子类的数据选项中，如若父类数据和子类数据冲突时，保留子类数据，如果对象深层嵌套，则需要递归调用 mergeData 进行数据合并。
      2. 默认资源合并（component、directive、filter）父类选项将以原型链的形式被处理。
      3. 生命周期钩子函数合并；mergeHook策略，对于生命周期钩子选项，子类和父类相同的选项将合并成数组，这样在执行子类钩子函数时，父类钩子选项也会执行，并且父会优先于子执行。
      4. watch 选项合并；最终和父类选项合并成数组，并且数组的选项成员，可以是回调函数，选项对象，或者函数名。
      5. props,methods,inject,computed 类似选项合并；如果父类不存在选项，则返回子类选项，子类父类都存在时，用子类选项去覆盖父类选项。
  + initProxy 数据代理 <br>
 	为 vm 实例化对象添加了 _renderProxy 方法。拦截 with 语句下的作用对象,对非法没有定义的变量进行筛选判断。
  + initLifecycle 初始化生命周期 <br>
  	为 vm 添加了$root、$parent、$children、$refs等属性。
  + initEvents 初始化组件事件 <br>
  	如果 vm.$options._parentListeners 事件存在，updateComponentListenets更新组件事件，添加新的事件，删除旧的事件。 <br>
	updateListeners更新事件。add添加事件（1.once标志真调用$once 执行一次函数就解绑2.once标志为假，$on添加事件，把事件推进队列去vm._events[event]）
  + initRender 初始化渲染 <br>
  	为vm添加 _vnode、$slots、$scopedSlots等属性。添加了 _c 和 createElement 两个渲染方法。 <br>
	并且把 $attrs 属性和 $listener 事件属性添加到 defineReactive 观察者中。
  + initState 构建响应式 <br>
	* initProps 将props属性设置为响应式数据
	* initMethods 必须为函数；命名不能props重复；不能_ $命名;挂载到根实例上。
	* initComputed 对象时要有getter 方法；对每个属性创建个监听依赖；设计响应式数据；命名防止和data、props冲突。
	* initWatch 对象。循环 watch 执行 createWatcher -> vm.$watch() 处理。
	* initData 命名不能和props、methods重复；数据代理（vm._data）; 为data绑定一个观察者observe。 <br>
	`nitDate -> new Observer(options.data) -> this.walk(data) -> defineReactive(obj, keys[i]) -> new Dep(); Object.defineProperty(obj, key, {get() {// 做依赖的收集 dep.depend()},set(nval) {// 派发更新 dep.notify();})` <br>
	*依赖收集的过程（每个数据都是一个依赖管理器，每个使用的数据就是一个依赖，当访问到数据时会将当前访问的场景作为一个依赖收集到依赖管理器中。）* <br>
	*派发更新的过程 1.判断数据更改前后一致情况；2.新值为对象，对属性做依赖收集；3.通知该数据收集watcher依赖，遍历每个watcher，进行更新，调用dep.notify()；4.更新时将每个watcher推到队列中，下个tick进行run操作。5.执行run方法，执行get方法，重新计算新值，依赖的清除。* <br>
## 实例挂载和模板编译 vm.$mount(vm.$options.el) <br>
  确认挂载节点 -》编译模板为render函数 -》render函数转换为virtualDom -》virtualDom创建真实节点 <br>
  $mount -> mountComponent -> 实例化watcher -> updateComponent -> vm._render() -> vm._update() <br>
  _render() 定义在renderMixin中，vnode = render.call(vm._renderProxy, vm.$createElement)。 <br>
**模板编译：** <br>
  compileToFunctions 最终会返回另外两个包装过的属性 render,staticRenderFns,将with语法封装成执行函数（createCompiler 1.parse(把模板解析为AST抽象语法树) 2.optimize（优化AST，标记静态节点） 3.generate（根据不同平台将AST转为渲染函数））。
## 渲染流程 vnode = _render.call(vm._renderProxy,$createElement)

## diff算法
  
