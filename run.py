
from collections import Counter
import time
from flask import (
    Flask,
    redirect,
    render_template,
    request,
    jsonify,
    send_from_directory,
    url_for,
    make_response,
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
import geoip2.database
from flask_cors import CORS
reader = geoip2.database.Reader('GeoLite2-City.mmdb')
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


def count_pv(dt,hm,adddd = True):
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
            if adddd :
                mancount=int(pv[2])+1
            else:
                mancount = int(pv[2])   
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
CORS(app)

@app.route("/")
def newindex():
    return redirect(url_for('new',dark='light'))

@app.route("/old")
def index():
    hint = ''
    weeks,week_i=school_schedule()
    
    dt, hm = get_time()
    mancount = count_pv(dt, hm)
    # 获取时间和图书馆座位信息
    dt, hm, av_seat_list, un_seat_list,seat_sign=get_lib_seat()
    if len(av_seat_list) == 0:
        av_seat_list = [{ 'area_name': '---', 'available_num': '---'}]
    if len(un_seat_list) == 0:
        un_seat_list = [{ 'area_name': '---', 'available_num': '---'}]
    #2024考研倒计时
    exam_day = exam_remain_day()
    ip = request.headers.get('CF-Connecting-IP')
    Proto = request.headers.get('X-Forwarded-Proto')
    regoin = None

    try:
        regoin,city = ip_get_location(str(ip))
    except Exception as e:
        pass
    if regoin == 'CN' or regoin == 'None':
        if (city == 'Jinan') or (city == 'None') :
            pass
        else:
            hint += "oops,我们是齐鲁工业大学（长清校区）的空教室查询工具，如果您需要查询你们大学的空教室的话，可以参考下方的github仓库自行部署 。<br>"
    elif regoin is None:
        pass
    else:
        hint += "尽管内网穿透服务提供商是cloudflare，但是我们还是建议您使用直连的方式访问本站哦~（超小声）直连其实更快的<br>"\

    if Proto == 'http':
        hint += "你知道么？其实我们支持https访问哦！ <a href = 'https://classroom.matt-wang.me'>点我跳转</a> 。<br>"
    host = request.headers.get('Host')
    ua = request.headers.get('User-Agent')

    if host != 'classroom.matt-wang.me':
        hint += "你知道么？我们的域名是classroom.matt-wang.me哦！ <a href = 'https://classroom.matt-wang.me'>点我跳转</a> .  此链接可以支持校外网络访问哦~"
        ip = request.remote_addr
    with open("./static/data/userip.json", "a") as f:
        f.write('\n'+dt+"--"+hm+"--"+ip)
    if ua.find('MicroMessenger') != -1:
        hint += "亲，这边建议您不要使用微信直接点击链接访问本站哦，复制链接到浏览器访问性能更好呦~   https://classroom.matt-wang.me 。<br>"
        logger.warning('微信访问'+ip)
    try:
        with open("./static/data/frequent.json", "r") as f:
            ip_list = f.readlines()
            ip_list = [x.strip() for x in ip_list]
            if ip in ip_list:
                hint+= "<br>是老朋友啊！如果觉得好用的话欢迎推荐给朋友哦~"
    except:
        pass
    # logger.warning(ip)
    res = render_template("index.html",exam_day=exam_day,weeks=weeks,week_i=week_i,dt=dt,hm=hm ,av_seat_list=av_seat_list,un_seat_list=un_seat_list,seat_sign=seat_sign,visit_people=mancount,hint_a = hint,title='QLU教室查询')
    return res

@app.route("/serviceworker.js")
def sw():
    response = make_response(send_from_directory(path = 'serviceworker.js',directory='./static/JavaScript') )
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Service-Worker-Allowed'] = '/'
    return response
    
@app.route("/sw.js")
def sw2():
    response = make_response(send_from_directory(path = 'sw.js',directory='./static/JavaScript') )
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Service-Worker-Allowed'] = '/'
    return response

@app.route("/manifest.json")
def manifest():
    response = make_response(send_from_directory(path = 'manifest.json',directory='./static') )
    response.headers['Content-Type'] = 'application/json'
    return response

@app.route("/offline.html")
def offline():
    return render_template("offline.html",time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))

@app.route("/api/data", methods=["POST"])
def api():
    dt, hm = get_time()
    is_today =1

    # 获取当前周数和星期
    weeks,week_i=school_schedule()
    weeks,week_i=str(weeks),str(week_i)
    available_room=['没有可用的教室，运气爆棚，hahaha!']

    # 捕获收到的表单
    dic_form= request.get_json()
    course_i = request.get_json().get('test')
    bro_agent=request.user_agent
    # print('%s %s\n从%s\n收到的表单为：\n'%(dt, hm,bro_agent),dic_form,course_i,'\n')
    # print(dic_form,course_i)
    # 判断是否为今天
    if dic_form['weeks']:
        weeks=dic_form['weeks']
        is_today = 0
    if dic_form['week_i']:
        week_i=dic_form['week_i']
        is_today = 0
    course_i = course_i.split(',')
    # print(course_i.split(','))
    available_room=query_room(weeks,week_i,course_i)
    # print(available_room)
    # 查询完后时间信息进行处理显示
    ip = request.headers.get('CF-Connecting-IP')
    host = request.headers.get('Host')
    if host != 'classroom.matt-wang.me':
        ip = request.remote_addr

    logger.warning(ip+' '+dic_form['weeks']+' '+dic_form['week_i']+' '+str(course_i))

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
    # print(available_room)
    # dt=dt, hm=hm,weeks=weeks,week_i=week_i,course_i=course_i,today=today, available_room=available_room
    res = jsonify({'status': 'success', 'available_room': available_room,'weeks':weeks,'week_i':week_i,'course_i':course_i,'today':today,'hint':'查询成功'})
    return res, 200, {"Content-Type":"application/json"}

@app.route('/api/libseat',methods=['GET','POST'])
def libseat():
    dt, hm, av_seat_list, un_seat_list,seat_sign=get_lib_seat()
    mancount = count_pv(dt, hm,False)
    if len(av_seat_list) == 0:
        av_seat_list = [{ 'area_name': '---', 'available_num': '---'}]
    if len(un_seat_list) == 0:
        un_seat_list = [{ 'area_name': '---', 'available_num': '---'}]

    res = jsonify({'status': 'success', 'av_seats': av_seat_list,'un_seats':un_seat_list,'dt':dt,'hm':hm,'visitcount':mancount,'hint':'查询成功'})
    return res, 200, {"Content-Type":"application/json"}


@app.route('/post', methods=['GET', 'POST'])
def get_f():
    # redict to index.html
    url=url_for('index')
    return redirect(url)

@app.route("/get_pv")
def get_pv():
    today_man,today_ip,intranet_man = get_ip('today')
    all_man,all_ip,all_intranet_man = get_ip('all')
    executor.submit(refresh_frequent)
    return render_template("pvcount.html",visit_people=today_man,ip_count=today_ip,all_visit_people = all_man,all_ip_count = all_ip,intranet_visit_people = intranet_man,all_intranet_visit_people = all_intranet_man,title='人数统计')

@app.route("/status")
def get_status():
    return "Good"

@app.route("/new")
def jump():
    return redirect("/new/light")

@app.route("/new/<dark>")
def new(dark):
    hint = ""
    dt, hm = get_time()
    ip = request.headers.get('CF-Connecting-IP')
    Proto = request.headers.get('X-Forwarded-Proto')
    regoin = None

    try:
        regoin,city = ip_get_location(str(ip))
    except Exception as e:
        pass
    if regoin == 'CN' or regoin == 'None':
        if (city == 'Jinan') or (city == 'None') :
            pass
        else:
            hint += "oops,我们是齐鲁工业大学（长清校区）的空教室查询工具，如果您需要查询你们大学的空教室的话，可以参考下方的github仓库自行部署 。<br>"
    elif regoin is None:
        pass
    else:
        hint += "尽管内网穿透服务提供商是cloudflare，但是我们还是建议您使用直连的方式访问本站哦~（超小声）直连其实更快的<br>"\

    if Proto == 'http':
        hint += "你知道么？其实我们支持https访问哦！ <a href = 'https://classroom.matt-wang.me'>点我跳转</a> 。<br>"
    host = request.headers.get('Host')
    ua = request.headers.get('User-Agent')

    if host != 'classroom.matt-wang.me':
        hint += "你知道么？我们的域名是classroom.matt-wang.me哦！ <a href = 'https://classroom.matt-wang.me'>点我跳转</a> .  此链接可以支持校外网络访问哦~"
        ip = request.remote_addr
    with open("./static/data/userip.json", "a") as f:
        f.write('\n'+dt+"--"+hm+"--"+ip)
    if ua.find('MicroMessenger') != -1:
        hint += "亲，这边建议您不要使用微信直接点击链接访问本站哦，复制链接到浏览器访问性能更好呦~   https://classroom.matt-wang.me 。<br>"
        logger.warning('微信访问'+ip)
    try:
        with open("./static/data/frequent.json", "r") as f:
            ip_list = f.readlines()
            ip_list = [x.strip() for x in ip_list]
            if ip in ip_list:
                hint+= "<br>是老朋友啊！如果觉得好用的话欢迎推荐给朋友哦~"
    except:
        pass

    count_pv(dt,hm)
    weeks,week_i=school_schedule()
    if dark == 'dark':
        return render_template("new.html",dark=dark,def_week=weeks,def_day=week_i)
    else:
        return render_template("new.html",def_week=weeks,def_day=week_i)

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

        visitcount = len(ip_list)
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
    mancount = len(ip_count2)
    intranet_man = len(ip_Intranet)
    return mancount,ip_count2,intranet_man



# 查询IP地址对应的物理地址
def ip_get_location(ip_address):
    # 载入指定IP相关数据
    response = reader.city(ip_address)

    #读取国家代码
    Country_IsoCode = response.country.iso_code
    #读取国家名称
    Country_Name = response.country.name
    #读取国家名称(中文显示)
    Country_NameCN = response.country.names['zh-CN']
    #读取州(国外)/省(国内)名称
    Country_SpecificName = response.subdivisions.most_specific.name
    #读取州(国外)/省(国内)代码
    Country_SpecificIsoCode = response.subdivisions.most_specific.iso_code
    #读取城市名称
    City_Name = response.city.name
    #读取邮政编码
    City_PostalCode = response.postal.code
    #获取纬度
    Location_Latitude = response.location.latitude
    #获取经度
    Location_Longitude = response.location.longitude

    if(Country_IsoCode == None):
        Country_IsoCode = "None"
    if(Country_Name == None):
        Country_Name = "None"
    if(Country_NameCN == None):
        Country_NameCN = "None"
    if(Country_SpecificName == None):
        Country_SpecificName = "None"
    if(Country_SpecificIsoCode == None):
        Country_SpecificIsoCode = "None"
    if(City_Name == None):
        City_Name = "None"
    if(City_PostalCode == None):
        City_PostalCode = "None"
    if(Location_Latitude == None):
        Location_Latitude = "None"
    if(Location_Longitude == None):
        Location_Longitude = "None"

    # print('================Start===================')
    # print('[*] Target: ' + ip_address + ' GeoLite2-Located ')
    # print(u'  [+] 国家编码:        ' + Country_IsoCode)
    # print(u'  [+] 国家名称:        ' + Country_Name)
    # print(u'  [+] 国家中文名称:    ' + Country_NameCN)
    # print(u'  [+] 省份或州名称:    ' + Country_SpecificName)
    # print(u'  [+] 省份或州编码:    ' + Country_SpecificIsoCode)
    # print(u'  [+] 城市名称 :       ' + City_Name)
    # print(u'  [+] 城市邮编 :       ' + City_PostalCode)
    # print(u'  [+] 纬度:            ' + str(Location_Latitude))
    # print(u'  [+] 经度 :           ' + str(Location_Longitude))
    # print('===============End======================')
    return Country_IsoCode,City_Name


        
if __name__ == '__main__':
    server = pywsgi.WSGIServer(('0.0.0.0',5000),app)
    server.serve_forever()
    

