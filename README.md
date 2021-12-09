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
  + initProxy 数据代理 
 	为 vm 实例化对象添加了 _renderProxy 方法。拦截 with 语句下的作用对象,对非法没有定义的变量进行筛选判断。
  + initLifecycle 初始化生命周期
  + initEvents 初始化组件事件 
  + initRender 初始化渲染
  + initState 构建响应式

## 实例挂载和模板编译 vm.$mount(vm.$options.el)

## 渲染流程 vnode = _render.call(vm._renderProxy,$createElement)

## diff算法
  
