# vue2.x 源码解析

## 为Vue prototype 原型添加方法
  **initMixin** 初始化：_init 实例化对象调用
	**stateMixin** 数据：$data,$props,$set,$delete,$watch
	
	**eventsMixin** 事件：$on,$off,$once,$emit
	
	**lifecycleMixin** 生命周期：_update,$forceUpdate,$destroy
	
	**renderMixin** 渲染：$nextTick,_render
	
	在一万多行又添加了 **__patch__** 和 **$mount** 方法
	
## 为Vue添加静态属性和方法
  **initGlobalAPI**
     1. config 为Vue.config做层代理
     
     
     2. Vue.util 工具类（提示警告、对象合并）<br>
     3. 添加静态方法：Vue.set()更新视图、Vue.delete()删除数据、Vue.nextTick()用于更新视图后回调递归
     4. 添加静态属性：添加 components,directives,filters 静态对象，记录静态组件
     5. initUse - Vue.use() 安装插件、initMixin$1 - Vue.mixin() 合并参数、initExtend - Vue.extend() 继承
     6. initAssetRegisters - 添加 component,directive,filter 静态方法 定义组件、指令、过滤器
---
## 实例化Vue this._init(options)
---
