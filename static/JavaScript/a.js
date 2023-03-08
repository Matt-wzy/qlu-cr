function libcheck()
{    const tz = "Asia/Shanghai"; // 东八区时区
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
    now.setDate(now.getDate() ); 
    const date = now.toISOString().split("T")[0]; // 获取请求日期
    fetch(`http://yuyue.lib.qlu.edu.cn/api.php/areas/0/date/${date}`)
    .then((response) => response.json())
    .then((data) => {
        let childArea = data.data.list.childArea
        .filter((e) => e.parentId > 1)
        .map((e) => {
            let totalCount = e.TotalCount || 0;
            let unavailableSpace = e.UnavailableSpace || 0;

            return { name: e.name, availableSpace: totalCount - unavailableSpace };
        });

        let av_list = [];
        let unav_list = [];

        for (let i = 0; i < childArea.length; i++) {
        if (childArea[i].availableSpace === 0) {
            unav_list.push(childArea[i]);
        } else {
            av_list.push(childArea[i]);
        }
        }

        if (av_list.length === 0) {
        av_list.push({ name: '--', availableSpace: '--' });
        }

        if (unav_list.length === 0) {
        unav_list.push({ name: '--', availableSpace: '--' });
        }

        // const avTable = document.createElement('table');
        const avTable = document.getElementById('av_list');
        avTable.innerHTML = '';
        const avTableHeader = document.createElement('tr');
        const avTableHeaderArea = document.createElement('th');
        const avTableHeaderAvailableSpace = document.createElement('th');
        avTableHeaderArea.innerText = '区域';
        avTableHeaderAvailableSpace.innerText = '剩余空座';
        avTableHeader.appendChild(avTableHeaderArea);
        avTableHeader.appendChild(avTableHeaderAvailableSpace);
        avTable.appendChild(avTableHeader);

        av_list.forEach((area) => {
        const row = document.createElement('tr');
        const areaName = document.createElement('td');
        const availableSpace = document.createElement('td');
        areaName.innerText = area.name;
        availableSpace.innerText = area.availableSpace;
        row.appendChild(areaName);
        row.appendChild(availableSpace);
        avTable.appendChild(row);
        });
        
        const unavTable = document.getElementById('un_list');
        unavTable.innerHTML = '';
        // const unavTable = document.createElement('table');
        const unavTableHeader = document.createElement('tr');
        const unavTableHeaderArea = document.createElement('th');
        const unavTableHeaderAvailableSpace = document.createElement('th');
        unavTableHeaderArea.innerText = '区域';
        unavTableHeaderAvailableSpace.innerText = '剩余空座';
        unavTableHeader.appendChild(unavTableHeaderArea);
        unavTableHeader.appendChild(unavTableHeaderAvailableSpace);
        unavTable.appendChild(unavTableHeader);

        unav_list.forEach((area) => {
        const row = document.createElement('tr');
        const areaName = document.createElement('td');
        const availableSpace = document.createElement('td');
        areaName.innerText = area.name;
        availableSpace.innerText = area.availableSpace;
        row.appendChild(areaName);
        row.appendChild(availableSpace);
        unavTable.appendChild(row);
        });
        const timeStr = now.toLocaleTimeString();
        document.getElementById('timeupdate').innerText = timeStr;
        // console.log('Av List:', av_list);
        // console.log('Unav List:', unav_list);

        // document.body.appendChild(avTable);
        // document.body.appendChild(unavTable);

    })
    .catch((error) => console.error(error));
}
libcheck();


// 定义一个函数，在 div 中显示时间
function showTime() {
      // 获取 id 为 time 的 div 元素
    const timeDiv = document.getElementById("time");
  // 获取当前时间
  const now = new Date();


  
  // 将时间格式化为字符串
  const timeStr = now.toLocaleTimeString();
  
  // 在 div 中显示时间
  timeDiv.textContent = timeStr;
}

// 每隔一秒钟更新一次时间
// setInterval(showTime, 1000);

setInterval(libcheck, 20000);