
// 定义常量
const submitButton = document.getElementById('submit-button');
const resetButton = document.getElementById('reset-button');
// 定义一个元素ID数组
const elementIds = ['hint', 'result-container', 'title','reqbox'];
// 将元素ID批量声明为常量
const [hint, resultContainer, title,reqbox] = elementIds.map(id => document.getElementById(id));

const checkboxes = Array.from(document.querySelectorAll('.classbtn'));
let responseData = null;
let isQuerying = false;
// 提交表单事件监听
submitButton.addEventListener('click', async () => {
    await submitForm();
});
// 重置表单事件监听
resetButton.addEventListener('click', () => {
    resetForm();
});

checkboxes.forEach(checkbox => {
    checkbox.addEventListener('click', () => {
        checkbox.classList.toggle('is-active');
        checkbox.classList.toggle('is-link');
    });
});
// 批量控制元素显示和隐藏的函数
const toggleDisplay = (elements, displayStyle) => {
    elements.forEach(element => {
        element.style.display = displayStyle;
    });
}
// 提交表单函数
const submitForm = async () => {
    // 如果正在查询中，直接返回
    if (isQuerying) {
        return;
    }
    // 禁止再次提交
    isQuerying = true;
    submitButton.classList.add("is-loading");
    // 获取表单数据
    const weeksInput = document.getElementById('weeks');
    const weekIInput = document.getElementById('week_i');
    if (weeksInput.value && isNaN(weeksInput.value)) {
        alert('周数必须为数字');
        isQuerying = false;
        submitButton.classList.remove("is-loading");
        return;
    }
    if (weekIInput.value && isNaN(weekIInput.value)) {
        alert('星期必须为数字');
        isQuerying = false;
        submitButton.classList.remove("is-loading");
        return;
    }
    let test = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.classList.contains('is-active')) {
            test.push(checkbox.value);
        }
    });
    if (test.length === 0) {
        alert('请至少选择一个');
        isQuerying = false;
        submitButton.classList.remove("is-loading");
        return;
    }
    const data = {
        weeks: weeksInput.value,
        week_i: weekIInput.value,
        test: test.join(','),
    };
    // 发送API请求
    responseData = await postData('/api/data', data);
    // 恢复按钮状态
    isQuerying = false;
    submitButton.classList.remove("is-loading");
    // 处理API响应
    if (responseData) {
        const availableRooms = responseData.available_room;
        const resultElement = document.getElementById('result');
        const weeksElement = document.getElementById('wek');
        resultElement.innerHTML = '';
        weeksElement.innerHTML = responseData.weeks + ' ' + responseData.week_i + ' ' + responseData.today + '<br>' + responseData.course_i;
        availableRooms.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = item;
            resultElement.appendChild(li);
        });
        checkboxes.forEach(checkbox => {
            checkbox.classList.remove('is-active');
            checkbox.classList.remove('is-link');
        });
        // 批量显示元素
        toggleDisplay([resultContainer], 'flex');
        // 批量隐藏元素
        // toggleDisplay([hint, title], 'none');
        toggleDisplay([reqbox],'none');
        weeksInput.value = '';
        weekIInput.value = '';

    }

};
// 重置表单函数
const resetForm = () => {
    const resultElement = document.getElementById('result');
    resultElement.innerHTML = '';
    checkboxes.forEach(checkbox => {
        checkbox.classList.remove('is-active')
        checkbox.classList.remove('is-link');
    });
    responseData = null;
    // 批量隐藏元素
    toggleDisplay([resultContainer], 'none');
    // 批量显示元素
    toggleDisplay([reqbox],'flex');
};

// 发送POST请求函数
const postData = async (url, data) => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const json = await response.json();
        return json;
    } catch (error) {
        isQuerying = false;
        console.error('Error:', error);
        const errorElement = document.getElementById('error');
        errorElement.innerHTML = 'Error: ' + error.message;
        errorElement.style.display = 'block';
        const retryButton = document.getElementById('retry');
        retryButton.style.display = 'block';
        setTimeout(() => {
            retryButton.style.display = 'none';
            errorElement.style.display = 'none';
        }, 2000);
        return null;
    }
};

// lib
let isFetchingData = false; // 标志变量，指示当前是否正在获取数据
let avSeats = null;
let unSeats = null;
let dt = null;
let hm = null;
let mancount = null;
const mancountElement = document.getElementById('man');
const avSeatsElement = document.getElementById('lib_av');
const unSeatsElement = document.getElementById('lib_un');
// const dtElement = document.getElementById('dt');
// const hmElement = document.getElementById('hm');

function getData() {
    if (isFetchingData) {
        console.log('上一个请求仍在处理，请稍后再试');
        return;
    }

    isFetchingData = true;

    fetch('/api/libseat')
        .then(response => response.json())
        .then(data => {
            avSeats = data.av_seats;
            unSeats = data.un_seats;
            dt = data.dt;
            hm = data.hm;
            mancount = data.visitcount;
            mancountElement.innerText = mancount;
            avSeatsElement.innerText = '';
            avSeats.forEach((area) => {
                const row = document.createElement('tr');
                const areaName = document.createElement('td');
                const availableSpace = document.createElement('td');
                areaName.innerText = area.area_name;
                availableSpace.innerText = area.available_num;
                row.appendChild(areaName);
                row.appendChild(availableSpace);
                avSeatsElement.appendChild(row);
            });
            unSeatsElement.innerText = '';
            unSeats.forEach((area) => {
                const row = document.createElement('tr');
                const areaName = document.createElement('td');
                const availableSpace = document.createElement('td');
                areaName.innerText = area.area_name;
                availableSpace.innerText = area.available_num;
                row.appendChild(areaName);
                row.appendChild(availableSpace);
                unSeatsElement.appendChild(row);
            });

            isFetchingData = false; // 请求完成，重置标志变量

        })
        .catch(error => {
            console.error(error);
            isFetchingData = false; // 请求失败，重置标志变量
        });

}

getData();
// 每隔15秒请求一次数据
setInterval(getData, 15000);
