##### 配置
1. 公共配置

`collection`: 发布时使用的数据表。如果未指定Pagination实例的name，则将使用collection._name来生成发布名，并且在该情形下使用该数据表来获取当前页的结果集。

`lazyPublish:` 设置为true时，将不会在实例初始化时立即初始化发布，使用者必须在合适的地方主动执行`pagination.publish(settings)`。
2. 客户端配置。

`perPage:` 单页面容量，默认为20。

`page:` 当前页码，默认为1。

`filters:` 当前订阅的查询条件，默认为{}。

`fields:` 需要发布的字段，默认为{}。

`sort:` 排序，默认按_id排序。

`subscriptionOpts:` 当前页数据订阅的options。

`fetch:` 设置为true时，将抓取文档，默认为false，即直接返回游标。

`autorun:` 设置为true时，必须先执行`pagination.start()`方法以启动订阅。默认值为false，即在`pagination.getPage()`调用时执行订阅，适合于较为简单的业务。


#### APIs
1. 服务端

`publish (settings):` 创建一个形参列表包含query和options的分页发布，发布名使用一个内置的前缀字符串和`pagination.publication`属性拼接获得。
	* `settings.getCursor (collection, ...args):` 绑定上下文与Meteor.publish一致。自定义的获取`Mongo.Cursor`实例的方法，以便使用者按照自己的需求进一步处理传入的参数。额外接收一个`collection`参数，该参数为`pagination`实例或`pagination.publish`方法的settings中传入的`Mongo.Collection`类型的属性。可用于替代`settings.queryPreHandle (...args), settings.optionsPreHandle (...args)`

	* `settings.queryPreHandle (...args), settings.optionsPreHandle (...args):` 绑定上下文与Meteor.publish一致。`query`和`options`前处理器，接收的参数列表与前端传入一致。

	* `settings.added (collectionName, id, fields), settings.changed (collectionName, id, fields), settings.removed (collectionName, id):` 绑定上下文与Meteor.publish一致。`Mongo.Cursor.observeChanges` APIs触发时的hooks。如果向指定观察器的传入null，则会删除被指定的observeChanges观察器，如果不传递任何值。则相应的观察器将默认生成。

	* `settings.customize (collectionName, pageTag, query = {}, opts = {}):` 绑定上下文与Meteor.publish一致。该方法将完全覆盖默认发布，可以用来书写完全自定义的发布。在前端传入的参数列表的头部额外加入两个参数，`collectionName`是最终返回的数据应当存放的数据表名(当pagination实例初始化时，如果name不为null，则`collectionName`所指向的表名并不真正存在于数据库中，而是单独生成的虚拟数据表).`pageTag`需要在added观察器中继承至fields对象中，以便前端能够正确识别当前页的数据，避免数据混杂。

`countPublish (publicationContext, countCursor):` 初始化或变更一个统计，如果使用了`settings.customize (collectionName, pageTag, query = {}, opts = {})`方法，则应当主动调用该方法(如果需要)以便初始化分页的总记录数。

2. 客户端

`page (page):` 获取或设置当前页。

`perPage (perPage):` 获取或设置单页面容量。

`filters (filters):` 获取或设置查询条件。

`fields (fields):` 获取或设置发布字段。

`sort (sort):` 获取或设置当前排序。

`totalItems ():` 获取当前数据总记录数。

`totalPages ():` 获取当前总页数。

`ready ():` 获取当前订阅状态。

`getPage ():` 获取当前页文档。

`start ():` 手动启动分页的订阅。`autorun`指定为true时需要调用该方法。

`started ():` 返回当前分页的订阅是否已启动，`autorun`指定为true时可使用。

`stop ():` 停止当前分页的订阅，`autorun`指定为true时可使用。未测试。"# pagination" 
