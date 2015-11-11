# html_canvas
## Preview
html_canvas 使用canvas绘制一些简单的图形：line，bar，k线图。   
基于Zepto，使用方式如下：
```html
    <script src="js/zepto-1.1.4.min.js" type="text/javascript"></script>
    <script src="js/cheapy_chart.js" type="text/javascript"></script>
```
## 线形图（line）
代码参见line.html
![Line Image](images/line.png)
## 条形图（bar)
代码插件bar.html
![Bar Image](images/bar.png)
## k线图（kline)
代码参见kline.html
![Line Image](images/kline.png)
## 扩展
```javascript
CheapyChart.registerType(name, {
  render: function(){
  
  }
});
```
