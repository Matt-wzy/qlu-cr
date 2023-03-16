const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/serviceworker.js", {
        scope: "/",
      });
      if (registration.installing) {
        console.log("正在安装 Service worker");
      } else if (registration.waiting) {
        console.log("已安装 Service worker installed");
      } else if (registration.active) {
        console.log("激活 Service worker");
      }
    } catch (error) {
      console.error(`注册失败：${error}`);
    }
  }
};


registerServiceWorker();


// 定义常量
const submitButton = document.getElementById('submit-button');
const resetButton = document.getElementById('reset-button');
const checkboxes = Array.from(document.querySelectorAll('.test'));
let responseData = null;
let isQuerying = false;

// 定义一个元素ID数组
const elementIds = ['hint', 'result-container', 'title'];

// 将元素ID批量声明为常量
const [hint, resultContainer, title] = elementIds.map(id => document.getElementById(id));

// 批量控制元素显示和隐藏的函数
const toggleDisplay = (elements, displayStyle) => {
  elements.forEach(element => {
    element.style.display = displayStyle;
  });
}

// 提交表单事件监听
submitButton.addEventListener('click', async () => {
  await submitForm();
});

// 重置表单事件监听
resetButton.addEventListener('click', () => {
  resetForm();
});

// 提交表单函数
const submitForm = async () => {
  // 如果正在查询中，直接返回
  if (isQuerying) {
    return;
  }
  // 禁止再次提交
  isQuerying = true;
  submitButton.innerText = '查询中...';
  // 获取表单数据
  const weeksInput = document.getElementById('weeks');
  const weekIInput = document.getElementById('week_i');
  if (weeksInput.value && isNaN(weeksInput.value)) {
    alert('周数必须为数字');
    isQuerying = false;
    submitButton.innerText = '提交';
    return;
  }
  if (weekIInput.value && isNaN(weekIInput.value)) {
    alert('星期必须为数字');
    isQuerying = false;
    submitButton.innerText = '提交';
    return;
  }
  let test = [];
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      test.push(checkbox.value);
    }
  });
  if (test.length === 0) {
    alert('请至少选择一个');
    isQuerying = false;
    submitButton.innerText = '提交';
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
  submitButton.innerText = '提交';
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
      checkbox.checked = false;
    });
    // 批量显示元素
    toggleDisplay([resultContainer, resetButton], 'block');
    // 批量隐藏元素
    toggleDisplay([hint, title], 'none');
    weeksInput.value = '';
    weekIInput.value = '';
    resetButton.style.margin = '0 auto';

  }
};

// 重置表单函数
const resetForm = () => {
  const resultElement = document.getElementById('result');
  resultElement.innerHTML = '';
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  responseData = null;
  // 批量隐藏元素
  toggleDisplay([resultContainer, resetButton], 'none');
  // 批量显示元素
  toggleDisplay([hint, title], 'block');
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
    }, 1000);
    return null;
  }
};

// 重试按钮事件监听
const retryButton = document.getElementById('retry-button');
retryButton.addEventListener('click', async () => {
  isQuerying = false;
  const checkbox = document.getElementById('checkbox');
  const input = document.getElementById('input');
  const data = {
    checkbox: checkbox.checked,
    input: input.value
  };
  const responseData = await postData('/api/data', data);
  if (responseData) {
    const resultElement = document.getElementById('result');
    const liElement = document.createElement('li');
    liElement.innerHTML = responseData.data;
    resultElement.appendChild(liElement);
    checkbox.checked = false;
    input.value = '';
    retryButton.style.display = 'none';
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'none';
  }
});




