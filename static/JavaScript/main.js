const resetBtn = document.getElementById('reset-btn');
const checkboxs = document.getElementsByClassName('test');
// const hint = document.getElementById('hint');
// const resultContainer = document.getElementById('result-container');
// const tittle = document.getElementById('tittle');
let responseData = null; // 用于保存返回的数据
var isQuerying = false;



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
}

const submitButton = document.getElementById('key');
submitButton.addEventListener('click', async () => {
    // const submitButton = document.getElementById('key');
      // 如果已经在查询中，则不执行
    if (isQuerying) {
        return;}
    const buttninner = submitButton.innerText;
    // 将标志设置为真
    isQuerying = true;
    submitButton.innerText = '查询中...';
    const input1 = document.getElementById('weeks');
    const input2 = document.getElementById('week_i');
    var sap = '';
    var relocation = '';
    $( ".test" ).each(function() {
        if($( this ).is(':checked')){
            relocation = relocation+''+sap+''+$( this ).val();
            sap = ',';
        }
    });
  const data = {
    weeks: input1.value,
    week_i: input2.value,
    test: relocation,
  };
  const responseData = await postData('/api/data', data);
  isQuerying = false;
  submitButton.innerText = buttninner;
  if (responseData) {
    
    const available_rooms = responseData.available_room;
    const resultElement = document.getElementById('result');
    const weeks = document.getElementById('wek');
    resultElement.innerHTML = '';
    weeks.innerHTML = responseData.weeks+' '+responseData.week_i+' '+responseData.today+'<br>'+responseData.course_i;
    available_rooms.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = item;
        resultElement.appendChild(li);
    });
    for (var i = 0; i < checkboxs.length; i++) {
      checkboxs[i].checked = false;
  }
    const hint = document.getElementById('hint');
    const resultContainer = document.getElementById('result-container');
    const tittle = document.getElementById('tittle');
    input1.value = '';
    input2.value = '';
    resultContainer.style.display = 'block';
    resetBtn.style.display = 'block';
    resetBtn.style.margin = '0 auto';
    hint.style.display = 'none';
    tittle.style.display = 'none';
  }
});

const useResponseData = () => {
  const responseData = window.responseData;
  if (responseData) {
    const timeElement = document.getElementById('time');
    timeElement.innerHTML = 'Time: ' + responseData.time;
  } else {
    console.error('Response data is null');
  }
}

// window.addEventListener('load', () => {
//   setInterval(() => {
//     postData('/api/heartbeat', {});
//   }, 5000);
// });

const retryButton = document.getElementById('retry');
retryButton.addEventListener('click', async () => {
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


// 绑定重置按钮点击事件
resetBtn.addEventListener('click', () => {
    // 删除所有li标签
    const result = document.getElementById('result');
    result.innerHTML = '';

    // get all checkbox
    for (var i = 0; i < checkboxs.length; i++) {
        checkboxs[i].checked = false;
    }
  
    // 重置返回的数据
    responseData = null;
    const hint = document.getElementById('hint');
    const resultContainer = document.getElementById('result-container');
    const tittle = document.getElementById('tittle');
    // 隐藏结果和重置按钮
    resultContainer.style.display = 'none';
    resetBtn.style.display = 'none';
    hint.style.display = 'block';
    tittle.style.display = 'block';
  });
