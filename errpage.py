from flask import (
    Flask,
    render_template,
    request,
    jsonify,
)
from gevent import pywsgi
app = Flask(__name__)

@app.route("/")
def index():
    return ("非常抱歉，我们遇上了暂时无法解决的问题，正在修复中……如需联系请发邮件至：wwwa_2012@126.com")

if __name__ == '__main__':
    server = pywsgi.WSGIServer(('0.0.0.0',5000),app)
    server.serve_forever()