const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const videoMap = {
  pregnancy: {
    early: ["j3tG-R5E2xA", "g8pxOZCnj54", "pY8jaGsEwBQ"],
    mid: ["lTz9aPZELkA", "Tx6NSkOpwIo", "DFnN8Nz7nbw"],
    late: ["z6whSkL_BNo", "vQnsx1F3oVo", "lA1GZOrcq30"]
  },
  birth: ["aQpCtAHKBOc", "IDWifSKKZYk", "8-EiYPdFMYg"],
  baby: {
    0: ["vpF4Q-y3rY4", "LUfnKqsJzT0", "gxU6OmBY1U0"],
    1: ["gxU6OmBY1U0", "5jUnI3JQyss", "bMpHLv7_IXo"],
    3: ["2LM2dJqNya8", "sZCzFeInbNQ", "tIo63KovNdM"],
    6: ["3CSTkQUG7H8", "bPNzDbmMyHE", "eq2PX0XSKnE"],
    12: ["L7Q0H8v3qqA", "I_HrXlyzmPY", "fUNkIl9rTEg"]
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
      content: "너는 임신과 출산, 육아에 대해 친근하고 따뜻하게 조언을 주는 AI 챗봇이야."
    },
    {
      role: "user",
      content: userPrompt
    }
  ];

  try {
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

    if (!response.ok) {
      throw new Error(`API 호출 오류: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    const paragraph = document.createElement("p");
    paragraph.innerHTML = reply.replace(/\n/g, "<br>");
    resultBox.appendChild(paragraph);

    // ▶ 유튜브 영상 삽입
    let videoIds = [];
    if (!isNaN(week) && week > 0) {
      if (week < 12) videoIds = videoMap.pregnancy.early;
      else if (week < 28) videoIds = videoMap.pregnancy.mid;
      else videoIds = videoMap.pregnancy.late;
    } else if (dueDate) {
      videoIds = videoMap.birth;
    } else if (!isNaN(babyAge) && babyAge > 0) {
      videoIds = getClosestBabyVideos(babyAge);
    }

    if (videoIds.length > 0) {
      const videoContainer = document.createElement("div");
      videoContainer.style.marginTop = "2rem";
      videoContainer.innerHTML = "<h3>관련 영상 추천</h3>";
      resultBox.appendChild(videoContainer);

      videoIds.forEach(id => {
        const iframe = document.createElement("iframe");
        // 핵심 수정: 유튜브 임베드 URL 형식 변경
        iframe.src = `https://www.youtube.com/embed/${id}`;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.style.marginTop = "1rem";
        iframe.style.width = "100%";
        iframe.style.height = "315px";
        iframe.style.borderRadius = "10px";
        iframe.style.border = "none";
        videoContainer.appendChild(iframe);
      });
    }

  } catch (error) {
    console.error("오류 발생:", error);
    resultBox.innerText = `조언을 가져오는 중 오류가 발생했습니다: ${error.message}`;
  }
});