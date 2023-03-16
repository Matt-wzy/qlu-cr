
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
        toggleDisplay([resultContainer], 'block');
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
    toggleDisplay([reqbox],'block');
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