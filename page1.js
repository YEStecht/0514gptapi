/* page1.js */
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const videoMap = {
  pregnancy: {
    early: ["9NnDBxG_7lA", "XsRwzAVO8Aw", "8n5EEMbG2Ac"],
    mid: ["Mmn1eJ31rUI", "YJXSG13Pa7g", "Oln3K59qR_o"],
    late: ["8cnc_Ak6c2g", "0SVu7cLGvHY", "4_H3QBBke9k"]
  },
  birth: ["BndN-sykNGs", "e7RQ2R0nQ2M", "W1-HzhGcyRg"],
  baby: {
    0: ["f5YPyb9rEXo", "XK90o0dzPhk", "WclM4NQqydw"],
    1: ["NdXH4pRehNk", "JL7_FZ3nN14", "1vWJsnQpqb8"],
    3: ["vHwTZo0eK_k", "G7ylvTWyqTQ", "Xb9ToM7x9T8"],
    6: ["k5U4AKCSPTk", "0aM9NE8vI5c", "vd3wEUJdXhc"],
    12: ["K0BRrb2zEPU", "o2MZApZtYOo", "7W3sDTKuQCE"]
  }
};

function getClosestBabyVideos(month) {
  const keys = Object.keys(videoMap.baby).map(k => parseInt(k));
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - month) < Math.abs(prev - month) ? curr : prev
  );
  return videoMap.baby[closest];
}

document.getElementById('adviceForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const week = parseInt(document.getElementById('pregnancyWeek').value, 10);
  const dueDate = document.getElementById('dueDate').value;
  const babyAge = parseInt(document.getElementById('babyAge').value, 10);
  const resultBox = document.getElementById('result');
  resultBox.innerHTML = ""; // 기존 결과 초기화

  if (
    (isNaN(week) || week === 0) &&
    (!dueDate || dueDate === '') &&
    (isNaN(babyAge) || babyAge === 0)
  ) {
    resultBox.innerText = "하나 이상의 정보를 입력해 주세요.";
    return;
  }

  let userPrompt = "다음 정보 중 입력된 내용을 바탕으로 조언을 해줘.\n";
  if (!isNaN(week)) userPrompt += `임신 주수: ${week}주\n`;
  if (dueDate) userPrompt += `출산 예정일: ${dueDate}\n`;
  if (!isNaN(babyAge)) userPrompt += `아이의 개월 수: ${babyAge}개월\n`;

  const conversationHistory = [
    {
      role: "system",
      content: `너는 임신과 출산, 육아에 대해 친근하고 따뜻하게 조언을 주는 AI 챗봇이야.`
    },
    {
      role: "user",
      content: userPrompt
    }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: conversationHistory,
      temperature: 0.7
    })
  });

  const data = await response.json();
  const reply = data.choices[0].message.content;
  const paragraph = document.createElement("p");
  paragraph.innerHTML = reply.replace(/\n/g, "<br>");
  resultBox.appendChild(paragraph);

  // ▶ 유튜브 영상 삽입
  let videoIds = [];
  if (!isNaN(week)) {
    if (week < 12) videoIds = videoMap.pregnancy.early;
    else if (week < 28) videoIds = videoMap.pregnancy.mid;
    else videoIds = videoMap.pregnancy.late;
  } else if (dueDate) {
    videoIds = videoMap.birth;
  } else if (!isNaN(babyAge)) {
    videoIds = getClosestBabyVideos(babyAge);
  }

  videoIds.forEach(id => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${id}`;
    iframe.allowFullscreen = true;
    iframe.style.marginTop = "1rem";
    iframe.style.width = "100%";
    iframe.style.height = "315px";
    iframe.style.borderRadius = "10px";
    iframe.style.border = "none";
    resultBox.appendChild(iframe);
  });
});
