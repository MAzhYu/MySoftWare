<template>
  <view class="pk-container">
    <view v-if="!matched" class="waiting">
      <text>正在匹配对手...</text>
      <button @click="cancelMatch">取消匹配</button>
    </view>

    <view v-else class="battle">
      <view class="info">
        <text>{{ self.name }} 🆚 {{ opponent.name }}</text>
      </view>

      <view v-if="countdown > 0">
        <text>倒计时：{{ countdown }}秒</text>
      </view>

      <view v-else>
        <view v-if="currentQuestion">
          <text>{{ currentQuestion.q }}</text>
          <input v-model="answer" placeholder="请输入答案" @confirm="submitAnswer" />
          <button @click="submitAnswer">提交</button>
        </view>
      </view>

      <view class="scoreboard">
        <text>你：{{ self.score }} 分</text>
        <text>对手：{{ opponent.score }} 分</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";

const matched = ref(false);
const countdown = ref(3);
const self = ref({ name: "我", score: 0 });
const opponent = ref({ name: "对手", score: 0 });
const answer = ref("");
const currentQuestion = ref(null);
let socket = null;
let roomId = "";

onMounted(() => {
  connectSocket();
});

function connectSocket() {
  socket = uni.connectSocket({
    url: "ws://localhost:3000", // 改为你的后端地址
    success: () => console.log("WebSocket连接成功"),
  });

  socket.onOpen(() => {
    console.log("WebSocket已打开");
    socket.send({
      data: JSON.stringify({ event: "joinPkQueue", user: { name: self.value.name } }),
    });
  });

  socket.onMessage((res) => {
    const msg = JSON.parse(res.data);
    if (msg.event === "matchSuccess") {
      matched.value = true;
      roomId = msg.roomId;
      opponent.value = msg.players.find((p) => p.name !== self.value.name);
      startCountdown();
    } else if (msg.event === "updateProgress") {
      if (msg.user !== self.value.name) {
        opponent.value.score = msg.score;
      }
    }
  });
}

function startCountdown() {
  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      getNextQuestion();
    }
  }, 1000);
}

function getNextQuestion() {
  currentQuestion.value = {
    q: `${Math.floor(Math.random() * 10)} + ${Math.floor(Math.random() * 10)} = ?`,
    ans: 0,
  };
}

function submitAnswer() {
  const correct = eval(currentQuestion.value.q.split("=")[0].trim());
  if (parseInt(answer.value) === correct) self.value.score += 10;
  socket.send({
    data: JSON.stringify({
      event: "submitAnswer",
      roomId,
      user: self.value.name,
      score: self.value.score,
    }),
  });
  answer.value = "";
  getNextQuestion();
}

function cancelMatch() {
  uni.navigateBack();
}
</script>

<style>
.pk-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx;
}
.waiting {
  text-align: center;
}
.battle {
  width: 100%;
  text-align: center;
}
.scoreboard {
  margin-top: 20rpx;
}
</style>
