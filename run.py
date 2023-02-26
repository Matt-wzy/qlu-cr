
from collections import Counter
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
)

from concurrent.futures import ThreadPoolExecutor
from qlu_lib import nowtime,get_time,query
from query_classroom import  query_room
from get_course_on_table import multidict,load_dict
from get_schedule import school_schedule,exam_remain_day
import sys,os
import requests
from gevent import pywsgi
# log
import logging
logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(message)s',filename='run.log')
logger = logging.getLogger(__name__)
executor = ThreadPoolExecutor()

# render_template , 直接会在templates里边找xx.html文件

# 获取图书馆座位信息
def get_lib_seat():
    dt, hm = get_time()
    #查询总的空座信息

    try:
        av_seat_list,un_seat_list,seat_sign=query(get_time())
    except:
        av_seat_list, un_seat_list,seat_sign= [{'area_name':"当前不可用。。。"}], [{'area_name':"当前不可用。。。"}],''


    return dt, hm,av_seat_list,un_seat_list,seat_sign


def count_pv(dt,hm):
    if os.path.exists("./static/data/pv.json") == False:
        with open("./static/data/pv.json", "w") as f:
            f.write(dt+' '+hm+' 1')
        mancount = 1
    with open("./static/data/pv.json", "r+") as f:
        pv=f.read()
        pv=pv.split(' ')
        if len(pv) < 3:
            mancount = 1
        elif pv[2] == '':
            mancount = 1
        else:
            mancount=int(pv[2])+1   
        if pv[0]==dt:
            pass
        else:
            mancount = 1
    with open("./static/data/pv.json", "w") as f:
        f.write(dt+' '+hm+' '+str(mancount))
    # with open("./static/data/userip.json", "r") as f:
    #     ip_list = f.readlines()
    #     ip_list = [i.split('--')[-1].strip() for i in ip_list]
    #     ip_count = Counter(ip_list)
    #     ip_count = sorted(ip_count.items(), key=lambda x: x[1], reverse=True)
    #     # ip_count = ip_count[:10]
    #     ip_count = [(i[0], i[1]) for i in ip_count]
        
    return mancount





app = Flask(__name__)

@app.route("/")
def index():
    hint = ''
    weeks,week_i=school_schedule()

    dt, hm = get_time()
    mancount = count_pv(dt, hm)
    # 获取时间和图书馆座位信息
    dt, hm, av_seat_list, un_seat_list,seat_sign=get_lib_seat()

    #2024考研倒计时
    exam_day = exam_remain_day()
    ip = request.headers.get('CF-Connecting-IP')
    Proto = request.headers.get('X-Forwarded-Proto')
    if Proto == 'http':
        hint += "你知道么？其实我们支持https访问哦！ <a href = 'https://classroom.matt-wang.me'>点我跳转</a> 。<br>"
    host = request.headers.get('Host')
    if host != 'classroom.matt-wang.me':
        hint += "你知道么？我们的域名是classroom.matt-wang.me哦！ <a href = 'https://classroom.matt-wang.me'>点我跳转</a> .  此链接可以支持校外网络访问哦~"
        ip = request.remote_addr
    with open("./static/data/userip.json", "a") as f:
        f.write('\n'+dt+"--"+hm+"--"+ip)
    try:
        with open("./static/data/frequent.json", "r") as f:
            ip_list = f.readlines()
            ip_list = [x.strip() for x in ip_list]
            if ip in ip_list:
                hint+= "<br>是老朋友啊！如果觉得好用的话欢迎推荐给朋友哦~"
    except:
        pass
    # logger.warning(ip)

    return render_template("index.html",exam_day=exam_day,weeks=weeks,week_i=week_i,dt=dt,hm=hm ,av_seat_list=av_seat_list,un_seat_list=un_seat_list,seat_sign=seat_sign,visit_people=mancount,hint_a = hint)





@app.route("/get")
def get():
    #data["url"] = request.url
    # get方法获取到的参数
    #name = request.args.get('name','zhangsan')

    #request.args
    #data["remote_addr"] = request.remote_addr

    return render_template("index.html")
    


@app.route("/post", methods=["POST"])
def post():
    dt, hm = get_time()
    is_today =1

    # 获取当前周数和星期
    weeks,week_i=school_schedule()
    weeks,week_i=str(weeks),str(week_i)
    available_room=['没有可用的教室，运气爆棚，hahaha!']

    # 捕获收到的表单
    dic_form= request.form
    course_i = request.form.getlist('test[]')
    bro_agent=request.user_agent
    # print('%s %s\n从%s\n收到的表单为：\n'%(dt, hm,bro_agent),dic_form,course_i,'\n')
    ip = request.headers.get('CF-Connecting-IP')
    host = request.headers.get('Host')
    if host != 'classroom.matt-wang.me':
        ip = request.remote_addr
    logger.warning(ip+' '+dic_form['weeks']+' '+dic_form['week_i']+' '+str(course_i))

    # 判断是否为今天
    if dic_form['weeks']:
        weeks=dic_form['weeks']
        is_today = 0
    if dic_form['week_i']:
        week_i=dic_form['week_i']
        is_today = 0



    available_room=query_room(weeks,week_i,course_i)
    # 查询完后时间信息进行处理显示
    if is_today:
         today= '今天'
         weeks,week_i='',''
    else:
        today=''
        weeks='第'+weeks+'周'
        week_i='星期'+week_i



    co = "".join((lambda x: (x.sort(), x)[1])(course_i))
    course_i='第'
    for i in co:
        course_i=course_i+str(int(i)*2-1)+('' if int(i)*2==12 else str(int(i)*2))+','
    course_i=course_i[:-1]+'节课'

    # 获取时间和图书馆座位信息
    dt, hm, av_seat_list, un_seat_list,seat_sign=get_lib_seat()


    return render_template("result.html",dt=dt, hm=hm,weeks=weeks,week_i=week_i,course_i=course_i,today=today, available_room=available_room ,av_seat_list=av_seat_list,un_seat_list=un_seat_list,seat_sign=seat_sign)

@app.route("/get_pv")
def get_pv():
    today_man,today_ip,intranet_man = get_ip('today')
    all_man,all_ip,all_intranet_man = get_ip('all')
    executor.submit(refresh_frequent)
    return render_template("pvcount.html",visit_people=today_man,ip_count=today_ip,all_visit_people = all_man,all_ip_count = all_ip,intranet_visit_people = intranet_man,all_intranet_visit_people = all_intranet_man)

@app.route("/status")
def get_status():
    return "Good"

def refresh_frequent():
    with open('./static/data/userip.json', 'r') as f:
        ip_list = f.readlines()
        ip_list = [x.strip() for x in ip_list]
        ip_list = [x.strip() for x in ip_list if x.strip()!='']
        final_ip_list = [i.split('--')[-1].strip() for i in ip_list]
        ip_count_total = Counter(final_ip_list)
        ip_count_total = sorted(ip_count_total.items(), key=lambda x: x[1], reverse=True)
        ip_count_total = [(i[0], i[1]) for i in ip_count_total]
    with open('./static/data/frequent.json', 'w+') as f:
        for i in ip_count_total[:5]:
            f.write(i[0]+'\n')

def get_ip(model = 'today',hide = True):
    ip_Intranet = []
    dt, hm = get_time()
    with open('./static/data/userip.json', 'r') as f:
        ip_list = f.readlines()
        ip_list = [x.strip() for x in ip_list]
        ip_list = [x.strip() for x in ip_list if x.strip()!='']
        # time_list = [i.split('--')[0].strip() for i in ip_list]
        if model == 'today':
            ip_list = [i.split('--')[-1].strip() for i in ip_list if i.split('--')[0].strip()==dt]
        else :
            ip_list = [i.split('--')[-1].strip() for i in ip_list]
        # 判断ip为ipv4还是ipv6

        mancount = len(ip_list)
        ip_count2 = Counter(ip_list)
        ip_count2 = sorted(ip_count2.items(), key=lambda x: x[1], reverse=True)
        ip_count2 = [(i[0], i[1]) for i in ip_count2]
        if hide:
            for i in ip_count2:
                if len(i[0].split('.')) == 4:
                    index = ip_count2.index(i)
                    ip_count2[index] = (i[0].split('.')[0]+'.'+i[0].split('.')[1]+'.*.*', i[1])
                    if i[0].split('.')[0] in ['10','172','192','127']:
                        ip_Intranet.append([i[0],i[1]])
                        ip_count2[index] = ('内网用户，ip不展示', i[1])

                else:
                    ip_count2[ip_count2.index(i)] = (i[0].split(':')[0]+':'+i[0].split(':')[1]+':'+i[0].split(':')[2]+':*:*:*:*:*', i[1])
    intranet_man = len(ip_Intranet)
    return mancount,ip_count2,intranet_man

if __name__ == '__main__':
    server = pywsgi.WSGIServer(('0.0.0.0',5000),app)
    server.serve_forever()
    

