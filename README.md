# qlu-cr
 查询校内空教室
> [demo 地址](https://classroom.matt-wang.me/)   欢迎捐赠服务器或自行根据现有代码搭建服务以提升用户体验，当前使用cloudflare tunnel内网穿透功能以使校内服务器可以被校外访问。

能力有限，欢迎issue和pull😊

- 如果要想要自己测试或更新.
> 
只需要如下两步：
1. 在```get_schedule.py```文件中修改开学时间（开学那周的周一）
```python
# <<<<<!!!定义开学那周的周一!!!>>>>>
year,month,day=2024,2,20
```
2. 在 ```get_course_on_table.py```中提供在 [教务系统](http://jwxt-qlu-edu-cn.vpn.qlu.edu.cn/) 中的cookie，并且运行一次获得数据包
```python
# <<<<<!!!需要使用代理，提供Cookie获取数据!!!>>>>>
Cookie = "抓取提供"
```




如果对你有帮助的话，请star⭐一下

### 支持校区
- [x] 长清
- [ ] 菏泽
- [ ] 历城
- [ ] 彩石
  
  理论上来讲，本项目仅需要简单更改便可适配全部湖南强智教务系统，由于本人只有一个本校的学生账号权限，暂无权限研究其他学校的实际情况，有需要可提issue。
  

  
