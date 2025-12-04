if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$9 = {
    data() {
      return {
        grades: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
        currentGrade: "一年级",
        lastIndex: 0,
        slideDirection: "",
        modules: {
          // 一二年级题型已替换为用户提供的清单（与后端 ProblemService 对应）
          一年级: [
            { name: "10以内加法", difficulty: "简单" },
            { name: "10以内减法", difficulty: "简单" },
            { name: "20以内加法（带进位）", difficulty: "中等" },
            { name: "20以内减法（带借位）", difficulty: "中等" },
            { name: "100以内加减法混合运算", difficulty: "困难" },
            { name: "元角分换算", difficulty: "中等" }
          ],
          二年级: [
            { name: "9以内乘法口诀", difficulty: "简单" },
            { name: "9以内除法", difficulty: "简单" },
            { name: "9以内乘法与加法混合", difficulty: "中等" },
            { name: "10以内整数连续乘法", difficulty: "中等" },
            { name: "除数9以内带余数除法", difficulty: "中等" },
            { name: "时间换算", difficulty: "中等" }
          ],
          三年级: [
            { name: "三位数加减法", difficulty: "简单" },
            { name: "两位数乘法", difficulty: "中等" },
            { name: "长方形、正方形周长的计算", difficulty: "简单" },
            { name: "长方形、正方形面积的计算", difficulty: "中等" },
            { name: "百以内的加减乘除法大小比较", difficulty: "困难" },
            { name: "重量单位换算", difficulty: "简单" },
            { name: "时间计算", difficulty: "困难" },
            { name: "余数除法（大数）", difficulty: "困难" }
          ],
          四年级: [
            { name: "小数的加法和减法", difficulty: "简单" },
            { name: "小数的保留", difficulty: "简单" },
            { name: "两位数的四则运算", difficulty: "中等" },
            { name: "千以内含括号的四则运算", difficulty: "中等" },
            { name: "巧用交换律与结合律", difficulty: "困难" },
            { name: "巧用乘法分配律", difficulty: "困难" },
            { name: "比较千以内的算式大小比较", difficulty: "困难" },
            { name: "近似数认识", difficulty: "中等" }
          ],
          五年级: [
            { name: "10以内小数乘法", difficulty: "中等" },
            { name: "10以内小数除法", difficulty: "中等" },
            { name: "小数除法(商保留一位小数)", difficulty: "中等" },
            { name: "平行四边形面积计算", difficulty: "简单" },
            { name: "三角形面积的计算", difficulty: "简单" },
            { name: "梯形面积的计算", difficulty: "中等" },
            { name: "圆面积的计算", difficulty: "中等" },
            { name: "简单方程练习", difficulty: "中等" }
          ],
          六年级: [
            { name: "圆柱的体积计算", difficulty: "中等" },
            { name: "球体积计算", difficulty: "中等" },
            { name: "带分数的加减法", difficulty: "中等" },
            { name: "带分数的乘法", difficulty: "中等" }
          ]
        }
      };
    },
    computed: {
      currentModules() {
        return this.modules[this.currentGrade] || [];
      },
      // 将模块按每页 4 个分组，便于水平分页（每页 2x2 网格）
      modulePages() {
        const pages = [];
        const items = this.currentModules;
        for (let i = 0; i < items.length; i += 4) {
          pages.push(items.slice(i, i + 4));
        }
        if (pages.length === 0)
          pages.push([]);
        return pages;
      }
    },
    onShow() {
      this.checkLogin();
      const hour = (/* @__PURE__ */ new Date()).getHours();
      if (hour < 12)
        this.greetingMessage = "🌞 早上好，欢迎回来！";
      else if (hour < 18)
        this.greetingMessage = "🌤 下午好，继续加油学习！";
      else
        this.greetingMessage = "🌙 晚上好，今天也要坚持一下哦～";
    },
    methods: {
      /** ✅ 检查登录状态 */
      checkLogin() {
        const token = uni.getStorageSync("token");
        if (!token) {
          uni.showModal({
            title: "提示",
            content: "请先登录后使用",
            showCancel: false,
            success: () => {
              uni.switchTab({
                url: "/pages/tabbar/me/me"
              });
            }
          });
          return false;
        }
        return true;
      },
      /** ✅ 切换年级 */
      selectGrade(grade, index) {
        this.slideDirection = index > this.lastIndex ? "slide-left" : "slide-right";
        this.lastIndex = index;
        this.currentGrade = grade;
      },
      /** ✅ 进入模块（统一跳转exam.vue） */
      enterModule(module) {
        if (!this.checkLogin())
          return;
        const grade = this.currentGrade;
        const name = module.name;
        const difficulty = module.difficulty;
        uni.navigateTo({
          url: `/pages/exam/exam?grade=${encodeURIComponent(grade)}&module=${encodeURIComponent(name)}&difficulty=${encodeURIComponent(difficulty)}`
        });
      },
      /** ✅ 难度图标选择 */
      getDifficultyIcon(level) {
        if (level === "简单")
          return "/static/icons/easy.png";
        if (level === "中等")
          return "/static/icons/medium.png";
        if (level === "困难")
          return "/static/icons/hard.png";
        return "/static/icons/medium.png";
      }
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "greeting-section" }, [
        vue.createElementVNode(
          "text",
          { class: "greeting-text" },
          vue.toDisplayString(_ctx.greetingMessage),
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("scroll-view", {
        "scroll-x": "",
        "show-scrollbar": "false",
        class: "grade-scroll"
      }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.grades, (grade, index) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: index,
              class: vue.normalizeClass(["grade-item", { active: $data.currentGrade === grade }]),
              onClick: ($event) => $options.selectGrade(grade, index)
            }, vue.toDisplayString(grade), 11, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ]),
      vue.createElementVNode("view", { class: "module-wrapper" }, [
        vue.createElementVNode("scroll-view", {
          class: "module-scroll",
          "scroll-x": "",
          "show-scrollbar": "false"
        }, [
          vue.createElementVNode("view", { class: "module-scroll-inner" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($options.modulePages, (page, pIndex) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: "page_" + pIndex,
                  class: "module-page"
                }, [
                  vue.createElementVNode("view", { class: "module-page-grid" }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(page, (module, index) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          key: "m_" + pIndex + "_" + index,
                          class: "module-card-grid"
                        }, [
                          vue.createElementVNode("view", { class: "module-content" }, [
                            vue.createElementVNode(
                              "text",
                              { class: "module-title" },
                              vue.toDisplayString(module.name),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode("view", { class: "difficulty" }, [
                              vue.createElementVNode("image", {
                                src: $options.getDifficultyIcon(module.difficulty),
                                class: "difficulty-icon"
                              }, null, 8, ["src"]),
                              vue.createElementVNode(
                                "text",
                                { class: "module-subtitle" },
                                "难度：" + vue.toDisplayString(module.difficulty),
                                1
                                /* TEXT */
                              )
                            ]),
                            vue.createElementVNode("button", {
                              class: "module-btn",
                              onClick: ($event) => $options.enterModule(module)
                            }, "进入练习", 8, ["onClick"])
                          ])
                        ]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    )),
                    page.length < 4 ? (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      { key: 0 },
                      vue.renderList(4 - page.length, (n) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          class: "module-card-grid placeholder",
                          key: "ph_" + pIndex + "_" + n
                        }, [
                          vue.createElementVNode("view", { class: "module-content" })
                        ]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    )) : vue.createCommentVNode("v-if", true)
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]),
        vue.createElementVNode("view", { class: "swipe-tip" }, [
          vue.createElementVNode("text", { class: "tip-icon" }, "👉"),
          vue.createElementVNode("text", { class: "tip-text" }, "滑动选择更多题型")
        ])
      ])
    ]);
  }
  const PagesTabbarIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$8], ["__scopeId", "data-v-184b8d5d"], ["__file", "D:/MySoftWare/MySoftWare/bzd/pages/tabbar/index/index.vue"]]);
  const BASE_URL$2 = "http://116.62.125.154:5000";
  const api = {
    login: `${BASE_URL$2}/api/auth/login`,
    me: `${BASE_URL$2}/api/auth/me`,
    register: `${BASE_URL$2}/api/auth/register`,
    problems: `${BASE_URL$2}/api/problems`,
    problemsSubmit: `${BASE_URL$2}/api/problems/submit`,
    wrongProblems: `${BASE_URL$2}/api/problems/wrong`,
    profile: `${BASE_URL$2}/api/auth/profile`,
    aiStatus: `${BASE_URL$2}/api/ai/status`,
    aiChat: `${BASE_URL$2}/api/ai/chat`,
    aiExplain: `${BASE_URL$2}/api/ai/explain`,
    avatarUpload: `${BASE_URL$2}/api/auth/avatar`
  };
  function request({ url, method = "GET", data = {}, auth = false, headers = {} }) {
    return new Promise((resolve, reject) => {
      const header = { "Content-Type": "application/json", ...headers };
      if (auth) {
        const token = uni.getStorageSync("token");
        if (token)
          header["Authorization"] = `Bearer ${token}`;
      }
      const doRequest = (targetUrl) => new Promise((resResolve, resReject) => {
        uni.request({
          url: targetUrl,
          method,
          data,
          header,
          success: (res) => {
            const { statusCode, data: data2 } = res;
            if (statusCode >= 200 && statusCode < 300)
              return resResolve({ ok: true, data: data2 });
            if (statusCode === 401)
              uni.removeStorageSync("token");
            return resResolve({ ok: false, data: data2 || { message: "Request failed", statusCode }, statusCode });
          },
          fail: (err) => resReject(err)
        });
      });
      doRequest(url).then(async (r) => {
        if (r.ok)
          return resolve(r.data);
        return reject(r.data);
      }).catch(async (firstErr) => {
        try {
          const tried = [url];
          if (url.includes("localhost")) {
            const alternates = [
              url.replace("localhost", "10.0.2.2"),
              // Android emulator (AVD)
              url.replace("localhost", "10.0.3.2"),
              // Genymotion
              url.replace("localhost", "127.0.0.1")
              // explicit loopback
            ];
            for (const alt of alternates) {
              if (tried.includes(alt))
                continue;
              tried.push(alt);
              try {
                const r2 = await doRequest(alt);
                if (r2.ok)
                  return resolve(r2.data);
                return reject(r2.data);
              } catch (e) {
              }
            }
          }
        } catch (e) {
        }
        return reject(firstErr);
      });
    });
  }
  const _imports_0$3 = "/static/icons/ai.png";
  const _sfc_main$8 = {
    data() {
      return {
        messages: [
          {
            role: "ai",
            text: "你好！我是马神 🦌，你的数学学习助手 🤖，可以帮你出题、讲解错题或推荐学习计划。"
          }
        ],
        inputText: "",
        scrollToId: "",
        quickQuestions: []
      };
    },
    onShow() {
      this.checkLogin();
    },
    methods: {
      /** ✅ 检查登录状态 */
      checkLogin() {
        const token = uni.getStorageSync("token");
        if (!token) {
          uni.showModal({
            title: "提示",
            content: "请先登录后使用AI助手",
            showCancel: false,
            success: () => {
              uni.switchTab({
                url: "/pages/tabbar/me/me"
              });
            }
          });
          return false;
        }
        return true;
      },
      // 将 Markdown 字符串渲染为 HTML（再交给 rich-text）
      renderMarkdown(md) {
        const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (!md)
          return "";
        let text = String(md);
        text = text.replace(/```([\s\S]*?)```/g, (m, p1) => `
<pre><code>${esc(p1)}</code></pre>
`);
        text = text.replace(/`([^`]+)`/g, (m, p1) => `<code>${esc(p1)}</code>`);
        text = text.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>").replace(/^##\s+(.*)$/gm, "<h2>$1</h2>").replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");
        text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
        text = text.replace(/(^|\n)(?:[-*]\s+.+)(?:\n[-*]\s+.+)+/g, (block) => {
          const items = block.trim().split(/\n/).map((line) => line.replace(/^[-*]\s+/, ""));
          return "\n<ul>" + items.map((i) => `<li>${i}</li>`).join("") + "</ul>";
        });
        text = text.replace(/(^|\n)(?:\d+\.\s+.+)(?:\n\d+\.\s+.+)+/g, (block) => {
          const items = block.trim().split(/\n/).map((line) => line.replace(/^\d+\.\s+/, ""));
          return "\n<ol>" + items.map((i) => `<li>${i}</li>`).join("") + "</ol>";
        });
        text = text.replace(/^(>\s+.*)$/gm, (m, p1) => `<blockquote>${p1.replace(/^>\s+/, "")}</blockquote>`);
        text = text.replace(/\n\n+/g, "</p><p>");
        text = text.replace(/\n/g, "<br/>");
        text = `<p>${text}</p>`;
        return text;
      },
      // 1) 学情分析：发送学习进度 + 未掌握错题给 AI 分析
      async handleAnalysis() {
        var _a, _b;
        try {
          this.messages.push({ role: "user", text: "学情分析" });
          this.messages.push({ role: "ai", text: "正在汇总你的学习情况并分析，请稍等……" });
          const [meRes, wrongRes] = await Promise.all([
            request({ url: api.me, method: "GET", auth: true }),
            request({ url: `${api.wrongProblems}?isMastered=false&limit=50`, method: "GET", auth: true })
          ]);
          const lp = ((_a = meRes == null ? void 0 : meRes.user) == null ? void 0 : _a.learningProgress) || {};
          const wrongList = Array.isArray(wrongRes == null ? void 0 : wrongRes.data) ? wrongRes.data : [];
          const system = "你是一位小学数学老师，请用温暖、关怀、鼓励的口吻，用简洁的中文做学情分析。请使用 Markdown 分点输出，面向小学生和家长都能看懂：1) 学情总结 2) 主要薄弱点（按类型/难度）3) 3-5条针对性建议（简短）4) 一周练习计划（每天1-2句话建议）。";
          const content = {
            learningProgress: lp,
            wrongProblems: wrongList.map((w) => ({
              expression: w.expression,
              type: w.type,
              difficulty: w.difficulty,
              correctAnswer: w.correctAnswer,
              userAnswer: w.userAnswer,
              grade: w.grade,
              wrongCount: w.wrongCount,
              lastAttemptDate: w.lastAttemptDate
            }))
          };
          const res = await request({
            url: api.aiChat,
            method: "POST",
            auth: true,
            data: {
              messages: [
                { role: "system", content: system },
                { role: "user", content: `以下是学习数据（JSON）：
${JSON.stringify(content, null, 2)}
请按照上面的要求输出，注意：语气友好、鼓励；条目清晰；尽量给出可执行的小建议。` }
              ],
              temperature: 0.3,
              maxTokens: 800
            }
          });
          const replyText = ((_b = res == null ? void 0 : res.data) == null ? void 0 : _b.content) || "（AI助手）暂时无法完成学情分析，请稍后重试。";
          this.messages.splice(this.messages.length - 1, 1, { role: "ai", text: replyText });
        } catch (err) {
          this.messages.splice(this.messages.length - 1, 1, { role: "ai", text: "出错啦 😥 无法获取学情分析。" });
        } finally {
          this.$nextTick(() => {
            this.scrollToId = "msg" + (this.messages.length - 1);
          });
        }
      },
      // 2) 讲解错题：选择错题并调用后端 /api/ai/explain
      async handleExplainWrong() {
        var _a, _b;
        try {
          const [meRes, wrongRes] = await Promise.all([
            request({ url: api.me, method: "GET", auth: true }),
            request({ url: `${api.wrongProblems}?isMastered=false&limit=50`, method: "GET", auth: true })
          ]);
          const wrongList = Array.isArray(wrongRes == null ? void 0 : wrongRes.data) ? wrongRes.data : [];
          if (!wrongList.length) {
            return uni.showToast({ title: "暂无未掌握错题", icon: "none" });
          }
          const itemList = wrongList.slice(0, 10).map((w) => w.expression);
          const action = await new Promise((resolve) => {
            uni.showActionSheet({ itemList, success: resolve, fail: () => resolve(null) });
          });
          if (!action || action.cancel)
            return;
          const idx = action.tapIndex;
          const chosen = wrongList[idx];
          const gradeStr = ((_b = (_a = meRes == null ? void 0 : meRes.user) == null ? void 0 : _a.learningProgress) == null ? void 0 : _b.grade) || "一年级";
          const gradeNum = this.gradeToNumber(gradeStr);
          this.messages.push({ role: "user", text: `讲解错题：${chosen.expression}` });
          this.messages.push({ role: "ai", text: "正在为你讲解这道题，请稍等……" });
          const res = await request({
            url: api.aiExplain,
            method: "POST",
            auth: true,
            data: {
              expression: chosen.expression,
              correctAnswer: chosen.correctAnswer,
              userAnswer: chosen.userAnswer,
              grade: gradeNum,
              language: "zh"
            }
          });
          const replyText = (res == null ? void 0 : res.explanation) || "（AI助手）暂时无法讲解该题，请稍后重试。";
          this.messages.splice(this.messages.length - 1, 1, { role: "ai", text: replyText });
        } catch (err) {
          this.messages.splice(this.messages.length - 1, 1, { role: "ai", text: "出错啦 😥 无法讲解错题。" });
        } finally {
          this.$nextTick(() => {
            this.scrollToId = "msg" + (this.messages.length - 1);
          });
        }
      },
      // 3) 智能出题：基于薄弱点生成 3 道日常情景题（含讲解与答案）
      async handleSmartQuiz() {
        var _a, _b;
        try {
          this.messages.push({ role: "user", text: "智能出题（基于我的薄弱点）" });
          this.messages.push({ role: "ai", text: "正在分析薄弱点并生成试题，请稍等……" });
          const [meRes, wrongRes] = await Promise.all([
            request({ url: api.me, method: "GET", auth: true }),
            request({ url: `${api.wrongProblems}?isMastered=false&limit=50`, method: "GET", auth: true })
          ]);
          const lp = ((_a = meRes == null ? void 0 : meRes.user) == null ? void 0 : _a.learningProgress) || {};
          const wrongList = Array.isArray(wrongRes == null ? void 0 : wrongRes.data) ? wrongRes.data : [];
          const system = "你是一位小学数学老师。请根据学生的薄弱点，结合小学生日常生活情景（如买文具、分苹果、乘公交、分糖果等），生成3道有趣的口算题，并在每道题之后给出简短清晰的讲解和标准答案。确保不超纲、数字适中、语气友好。用中文 Markdown 输出。";
          const payload = {
            learningProgress: lp,
            wrongProblems: wrongList.map((w) => ({ expression: w.expression, type: w.type, difficulty: w.difficulty }))
          };
          const res = await request({
            url: api.aiChat,
            method: "POST",
            auth: true,
            data: {
              messages: [
                { role: "system", content: system },
                { role: "user", content: `学生数据（JSON）：
${JSON.stringify(payload, null, 2)}
请输出共3道题，严格按如下结构（每题一个情景）：

1. **情景**：一句话描述（贴近日常，例如在文具店买铅笔）
   **题目**：口算表达式或情景题问题本身（尽量口语化）
   **思路讲解**：2-4句讲解（必要时给简单对齐/进位提示，不展开长过程）
   **答案**：明确写出

2. **情景**：...
   **题目**：...
   **思路讲解**：...
   **答案**：...

3. **情景**：...
   **题目**：...
   **思路讲解**：...
   **答案**：...` }
              ],
              temperature: 0.4,
              maxTokens: 900
            }
          });
          const replyText = ((_b = res == null ? void 0 : res.data) == null ? void 0 : _b.content) || "（AI助手）暂时无法生成题目，请稍后重试。";
          this.messages.splice(this.messages.length - 1, 1, { role: "ai", text: replyText });
        } catch (err) {
          this.messages.splice(this.messages.length - 1, 1, { role: "ai", text: "出错啦 😥 无法生成智能出题。" });
        } finally {
          this.$nextTick(() => {
            this.scrollToId = "msg" + (this.messages.length - 1);
          });
        }
      },
      gradeToNumber(gradeStr) {
        if (typeof gradeStr !== "string")
          return 1;
        const m = gradeStr.match(/(\d+)/);
        return m ? parseInt(m[1]) : 1;
      },
      async sendMessage() {
        var _a;
        if (!this.inputText.trim())
          return;
        const userMsg = { role: "user", text: this.inputText };
        this.messages.push(userMsg);
        this.inputText = "";
        this.$nextTick(() => {
          this.scrollToId = "msg" + (this.messages.length - 1);
        });
        this.messages.push({ role: "ai", text: "正在思考中，请稍等……" });
        try {
          const res = await request({
            url: api.aiChat,
            method: "POST",
            data: {
              messages: [
                {
                  role: "system",
                  content: "你是一位小学数学老师，与小学生对话时请使用温暖、关怀、鼓励性的中文语气，表达清晰简洁，必要时给一个很小的例子帮助孩子理解。所有回答使用 Markdown 表达，避免生硬的专业术语。"
                },
                { role: "user", content: userMsg.text }
              ],
              temperature: 0.5,
              maxTokens: 600
            },
            auth: true
          });
          const replyText = ((_a = res == null ? void 0 : res.data) == null ? void 0 : _a.content) || (res == null ? void 0 : res.explanation) || "（AI助手）暂时无法回答这个问题，请稍后重试。";
          this.messages.splice(this.messages.length - 1, 1, {
            role: "ai",
            text: replyText
          });
        } catch (err) {
          this.messages.splice(this.messages.length - 1, 1, {
            role: "ai",
            text: "出错啦 😥 网络异常或AI服务暂不可用。"
          });
        }
        this.$nextTick(() => {
          this.scrollToId = "msg" + (this.messages.length - 1);
        });
      }
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("image", {
          src: _imports_0$3,
          class: "ai-icon"
        }),
        vue.createElementVNode("text", { class: "title" }, "AI 学习助手")
      ]),
      vue.createElementVNode("scroll-view", {
        "scroll-y": "",
        class: "chat-box",
        "scroll-into-view": $data.scrollToId
      }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.messages, (msg, index) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: index,
              id: "msg" + index,
              class: vue.normalizeClass(["message", msg.role])
            }, [
              vue.createElementVNode("image", {
                src: msg.role === "user" ? "/static/icons/student.png" : "/static/icons/robot.png",
                class: "avatar"
              }, null, 8, ["src"]),
              vue.createElementVNode("view", { class: "bubble" }, [
                msg.role === "user" ? (vue.openBlock(), vue.createElementBlock(
                  "text",
                  { key: 0 },
                  vue.toDisplayString(msg.text),
                  1
                  /* TEXT */
                )) : (vue.openBlock(), vue.createElementBlock("rich-text", {
                  key: 1,
                  nodes: $options.renderMarkdown(msg.text)
                }, null, 8, ["nodes"]))
              ])
            ], 10, ["id"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ], 8, ["scroll-into-view"]),
      vue.createElementVNode("view", { class: "bottom-box" }, [
        vue.createElementVNode("view", { class: "quick-ask" }, [
          vue.createElementVNode("view", { class: "quick-row" }, [
            vue.createElementVNode("button", {
              class: "quick-btn",
              onClick: _cache[0] || (_cache[0] = (...args) => $options.handleAnalysis && $options.handleAnalysis(...args))
            }, "1. 学情分析"),
            vue.createElementVNode("button", {
              class: "quick-btn",
              onClick: _cache[1] || (_cache[1] = (...args) => $options.handleExplainWrong && $options.handleExplainWrong(...args))
            }, "2. 讲解错题"),
            vue.createElementVNode("button", {
              class: "quick-btn",
              onClick: _cache[2] || (_cache[2] = (...args) => $options.handleSmartQuiz && $options.handleSmartQuiz(...args))
            }, "3. 智能出题")
          ])
        ]),
        vue.createElementVNode("view", { class: "input-area" }, [
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.inputText = $event),
              class: "chat-input",
              placeholder: "请输入问题，例如：帮我出10道三年级加减法题",
              "confirm-type": "send",
              onConfirm: _cache[4] || (_cache[4] = (...args) => $options.sendMessage && $options.sendMessage(...args))
            },
            null,
            544
            /* NEED_HYDRATION, NEED_PATCH */
          ), [
            [vue.vModelText, $data.inputText]
          ]),
          vue.createElementVNode("button", {
            class: "send-btn",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.sendMessage && $options.sendMessage(...args))
          }, "发送")
        ])
      ])
    ]);
  }
  const PagesTabbarAiAi = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__scopeId", "data-v-d575a73a"], ["__file", "D:/MySoftWare/MySoftWare/bzd/pages/tabbar/ai/ai.vue"]]);
  const _imports_0$2 = "/static/1.jpg";
  const _imports_1$2 = "/static/2.jpg";
  const _sfc_main$7 = {
    data() {
      return {
        step: 1,
        // 当前阶段：1选择模式，2创建房间，3加入房间
        questionCounts: [5, 10, 20, 30],
        types: ["混合运算", "加减法", "乘除法"],
        timeLimits: [15, 30, 60, 90, 120],
        countIndex: 1,
        typeIndex: 0,
        timeIndex: 1,
        roomCode: ""
      };
    },
    onShow() {
      this.checkLogin();
    },
    methods: {
      /** ✅ 检查登录状态 */
      checkLogin() {
        const token = uni.getStorageSync("token");
        if (!token) {
          uni.showModal({
            title: "提示",
            content: "请先登录后使用PK功能",
            showCancel: false,
            success: () => {
              uni.switchTab({
                url: "/pages/tabbar/me/me"
              });
            }
          });
          return false;
        }
        return true;
      },
      chooseCreate() {
        this.step = 2;
      },
      chooseJoin() {
        this.step = 3;
      },
      reset() {
        this.step = 1;
        this.roomCode = "";
      },
      onCountChange(e) {
        this.countIndex = e.detail.value;
      },
      onTypeChange(e) {
        this.typeIndex = e.detail.value;
      },
      onTimeChange(e) {
        this.timeIndex = e.detail.value;
      },
      createRoom() {
        const code = Math.floor(1e5 + Math.random() * 9e5).toString();
        const params = {
          mode: "create",
          roomCode: code,
          questionCount: this.questionCounts[this.countIndex],
          type: this.types[this.typeIndex],
          timeLimit: this.timeLimits[this.timeIndex],
          seed: Math.floor(Math.random() * 1e6)
        };
        uni.navigateTo({
          url: `/pages/room/room?data=${encodeURIComponent(JSON.stringify(params))}`
        });
      },
      joinRoom() {
        if (!this.roomCode) {
          return uni.showToast({ title: "请输入房间号", icon: "none" });
        }
        const params = {
          mode: "join",
          roomCode: this.roomCode
        };
        uni.navigateTo({
          url: `/pages/room/room?data=${encodeURIComponent(JSON.stringify(params))}`
        });
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      $data.step === 1 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "background-wrapper"
      }, [
        vue.createElementVNode("image", {
          src: _imports_0$2,
          class: "bg-left",
          mode: "aspectFill"
        }),
        vue.createElementVNode("image", {
          src: _imports_1$2,
          class: "bg-right",
          mode: "aspectFill"
        })
      ])) : vue.createCommentVNode("v-if", true),
      $data.step === 1 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "mode-select"
      }, [
        vue.createElementVNode("button", {
          class: "create-btn",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.chooseCreate && $options.chooseCreate(...args))
        }, "创建房间"),
        vue.createElementVNode("button", {
          class: "join-btn",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.chooseJoin && $options.chooseJoin(...args))
        }, "加入房间")
      ])) : vue.createCommentVNode("v-if", true),
      $data.step === 2 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "create-room-card"
      }, [
        vue.createElementVNode("text", { class: "subtitle" }, "设置对战参数"),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "题目数量："),
          vue.createElementVNode("picker", {
            range: $data.questionCounts,
            value: $data.countIndex,
            onChange: _cache[2] || (_cache[2] = (...args) => $options.onCountChange && $options.onCountChange(...args))
          }, [
            vue.createElementVNode(
              "view",
              { class: "picker-box" },
              vue.toDisplayString($data.questionCounts[$data.countIndex]),
              1
              /* TEXT */
            )
          ], 40, ["range", "value"])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "题目类型："),
          vue.createElementVNode("picker", {
            range: $data.types,
            value: $data.typeIndex,
            onChange: _cache[3] || (_cache[3] = (...args) => $options.onTypeChange && $options.onTypeChange(...args))
          }, [
            vue.createElementVNode(
              "view",
              { class: "picker-box" },
              vue.toDisplayString($data.types[$data.typeIndex]),
              1
              /* TEXT */
            )
          ], 40, ["range", "value"])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "时间限制(秒)："),
          vue.createElementVNode("picker", {
            range: $data.timeLimits,
            value: $data.timeIndex,
            onChange: _cache[4] || (_cache[4] = (...args) => $options.onTimeChange && $options.onTimeChange(...args))
          }, [
            vue.createElementVNode(
              "view",
              { class: "picker-box" },
              vue.toDisplayString($data.timeLimits[$data.timeIndex]),
              1
              /* TEXT */
            )
          ], 40, ["range", "value"])
        ]),
        vue.createElementVNode("button", {
          class: "confirm-btn",
          onClick: _cache[5] || (_cache[5] = (...args) => $options.createRoom && $options.createRoom(...args))
        }, "创建房间"),
        vue.createElementVNode("button", {
          class: "back-btn",
          onClick: _cache[6] || (_cache[6] = (...args) => $options.reset && $options.reset(...args))
        }, "返回")
      ])) : vue.createCommentVNode("v-if", true),
      $data.step === 3 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "join-room-card"
      }, [
        vue.createElementVNode("text", { class: "subtitle" }, "加入房间"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $data.roomCode = $event),
            placeholder: "请输入房间代码",
            class: "input-box"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.roomCode]
        ]),
        vue.createElementVNode("button", {
          class: "confirm-btn",
          onClick: _cache[8] || (_cache[8] = (...args) => $options.joinRoom && $options.joinRoom(...args))
        }, "加入"),
        vue.createElementVNode("button", {
          class: "back-btn",
          onClick: _cache[9] || (_cache[9] = (...args) => $options.reset && $options.reset(...args))
        }, "返回")
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesTabbarPkPk = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__scopeId", "data-v-b88d0f02"], ["__file", "D:/MySoftWare/MySoftWare/bzd/pages/tabbar/pk/pk.vue"]]);
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const _imports_0$1 = "/static/icons/fail.png";
  const _sfc_main$6 = {
    data() {
      return {
        email: "",
        password: "",
        user: null,
        defaultAvatar: "https://javaweb-learn-heliuyue.oss-cn-beijing.aliyuncs.com/Default_Image.png",
        grades: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
        gradeIndex: 0,
        showEditModal: false,
        editData: { username: "", email: "", grade: "" },
        editGradeIndex: 0
      };
    },
    onShow() {
      this.loadUser();
    },
    methods: {
      async login() {
        if (!this.email || !this.password) {
          return uni.showToast({ title: "请输入账号和密码", icon: "none" });
        }
        uni.showLoading({ title: "登录中..." });
        try {
          const res = await request({
            url: api.login,
            method: "POST",
            data: { email: this.email, password: this.password }
          });
          uni.setStorageSync("token", res.token);
          uni.setStorageSync("user", res.user);
          this.user = res.user;
          uni.showToast({ title: "登录成功", image: "/static/icons/success.png" });
        } catch (err) {
          uni.showToast({ title: "登录失败，请检查账号或网络", icon: "none", image: "/static/icons/fail.png" });
        } finally {
          uni.hideLoading();
        }
      },
      async loadUser() {
        const token = uni.getStorageSync("token");
        if (!token) {
          this.user = null;
          return;
        }
        try {
          const res = await request({
            url: api.me,
            method: "GET",
            auth: true
          });
          this.user = res.user;
          uni.setStorageSync("user", res.user);
        } catch (err) {
          this.user = null;
        }
      },
      async onGradeChange(e) {
        this.gradeIndex = e.detail.value;
        const newGrade = this.grades[this.gradeIndex];
        if (!this.user)
          return;
        this.user.learningProgress.grade = newGrade;
        try {
          uni.showLoading({ title: "保存中..." });
          const res = await request({
            url: api.profile,
            method: "PUT",
            auth: true,
            data: {
              learningProgress: this.user.learningProgress
            }
          });
          if (res.success) {
            uni.showToast({ title: "年级已更新", image: "/static/icons/success.png" });
          } else {
            uni.showToast({ title: "保存失败", icon: "none" });
          }
        } catch (err) {
          formatAppLog("error", "at pages/tabbar/me/me.vue:216", "请求出错:", err);
          uni.showToast({ title: "请求出错", icon: "none", image: "/static/icons/fail.png" });
        } finally {
          uni.hideLoading();
        }
      },
      openEditModal() {
        var _a;
        this.editData.username = this.user.username;
        this.editData.email = this.user.email;
        this.editGradeIndex = this.grades.indexOf(((_a = this.user.learningProgress) == null ? void 0 : _a.grade) || "") || 0;
        this.showEditModal = true;
      },
      closeModal() {
        this.showEditModal = false;
      },
      onEditGradeChange(e) {
        this.editGradeIndex = e.detail.value;
      },
      // 选择并上传头像
      async chooseAvatar() {
        try {
          const picked = await new Promise((resolve) => {
            uni.chooseImage({ count: 1, sizeType: ["compressed"], sourceType: ["album", "camera"], success: resolve, fail: () => resolve(null) });
          });
          if (!picked || !picked.tempFilePaths || !picked.tempFilePaths[0])
            return;
          const filePath = picked.tempFilePaths[0];
          uni.showLoading({ title: "上传中..." });
          const token = uni.getStorageSync("token");
          const uploadRes = await new Promise((resolve, reject) => {
            uni.uploadFile({
              url: api.avatarUpload,
              filePath,
              name: "file",
              header: { "Authorization": `Bearer ${token}` },
              success: (res) => resolve(res),
              fail: (err) => reject(err)
            });
          });
          let data;
          try {
            data = JSON.parse(uploadRes.data);
          } catch {
            data = uploadRes.data;
          }
          if (data && data.success && data.url) {
            if (!this.user)
              this.user = {};
            this.user.avatarUrl = data.url;
            uni.setStorageSync("user", this.user);
            uni.showToast({ title: "头像已更新", icon: "none" });
          } else {
            uni.showToast({ title: "上传失败", icon: "none" });
          }
        } catch (e) {
          uni.showToast({ title: "上传失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      },
      // 提交修改
      async submitEdit() {
        uni.showLoading({ title: "保存中..." });
        try {
          const res = await request({
            url: api.profile,
            method: "PUT",
            auth: true,
            data: {
              username: this.editData.username,
              email: this.editData.email,
              learningProgress: {
                grade: this.grades[this.editGradeIndex]
              }
            }
          });
          if (res.success) {
            uni.showToast({ title: "修改成功", image: "/static/icons/success.png" });
            this.showEditModal = false;
            await this.loadUser();
          } else {
            uni.showToast({ title: "修改失败", icon: "none" });
          }
        } catch (err) {
          formatAppLog("error", "at pages/tabbar/me/me.vue:298", err);
          uni.showToast({ title: "请求出错", icon: "none", image: "/static/icons/fail.png" });
        } finally {
          uni.hideLoading();
        }
      },
      logout() {
        uni.removeStorageSync("token");
        this.user = null;
        uni.showToast({ title: "已退出登录", image: "/static/icons/success.png" });
      },
      goRegister() {
        uni.navigateTo({
          url: "/pages/register/register"
        });
      },
      goToWrongProblems() {
        uni.navigateTo({
          url: "/pages/wrongProblems/wrongProblems"
        });
      },
      formatPracticeTime(seconds) {
        if (!seconds)
          return "0分钟";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor(seconds % 3600 / 60);
        if (hours > 0) {
          return `${hours}小时${minutes}分钟`;
        }
        return `${minutes}分钟`;
      },
      roleName(role) {
        switch (role) {
          case "student":
            return "学生";
          case "parent":
            return "家长";
          case "teacher":
            return "老师";
          case "admin":
            return "管理员";
          default:
            return "用户";
        }
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    var _a, _b, _c, _d, _e, _f;
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("image", {
          src: ((_a = $data.user) == null ? void 0 : _a.avatarUrl) || $data.defaultAvatar,
          class: "avatar"
        }, null, 8, ["src"]),
        vue.createElementVNode("text", { class: "title" }, "我的账户")
      ]),
      !$data.user ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "login-card"
      }, [
        vue.createElementVNode("text", { class: "login-title" }, "🦌马神口算"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.email = $event),
            class: "input-box",
            placeholder: "请输入邮箱",
            type: "text"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.email]
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.password = $event),
            class: "input-box",
            placeholder: "请输入密码",
            type: "password"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.password]
        ]),
        vue.createElementVNode("button", {
          class: "login-btn",
          onClick: _cache[2] || (_cache[2] = (...args) => $options.login && $options.login(...args))
        }, "登录"),
        vue.createElementVNode("view", { class: "register-tip" }, [
          vue.createElementVNode("text", null, "还没有账号？"),
          vue.createElementVNode("text", {
            class: "link",
            onClick: _cache[3] || (_cache[3] = (...args) => $options.goRegister && $options.goRegister(...args))
          }, "立即注册")
        ])
      ])) : (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "profile-card"
      }, [
        vue.createElementVNode("view", { class: "user-info" }, [
          vue.createElementVNode("image", {
            src: ((_b = $data.user) == null ? void 0 : _b.avatarUrl) || $data.defaultAvatar,
            class: "profile-avatar"
          }, null, 8, ["src"]),
          vue.createElementVNode("view", { class: "info-text" }, [
            vue.createElementVNode(
              "text",
              { class: "name" },
              vue.toDisplayString($data.user.username),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "email" },
              vue.toDisplayString($data.user.email),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "role" },
              "角色：" + vue.toDisplayString($options.roleName($data.user.role)),
              1
              /* TEXT */
            )
          ])
        ]),
        vue.createElementVNode("view", { class: "grade-picker" }, [
          vue.createElementVNode("text", { class: "picker-label" }, "当前年级："),
          vue.createElementVNode("picker", {
            range: $data.grades,
            value: $data.gradeIndex,
            onChange: _cache[4] || (_cache[4] = (...args) => $options.onGradeChange && $options.onGradeChange(...args))
          }, [
            vue.createElementVNode(
              "view",
              { class: "picker-box" },
              vue.toDisplayString($data.grades[$data.gradeIndex] || "未设置"),
              1
              /* TEXT */
            )
          ], 40, ["range", "value"])
        ]),
        vue.createElementVNode("view", { class: "progress" }, [
          vue.createElementVNode("text", { class: "section-title" }, "学习进度"),
          vue.createElementVNode("view", { class: "progress-item" }, [
            vue.createElementVNode("view", { class: "progress-row" }, [
              vue.createElementVNode("text", { class: "progress-label" }, "练习总数："),
              vue.createElementVNode(
                "text",
                { class: "progress-value" },
                vue.toDisplayString(((_c = $data.user.learningProgress) == null ? void 0 : _c.totalExercises) || 0) + " 题",
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "progress-row" }, [
              vue.createElementVNode("text", { class: "progress-label" }, "正确题数："),
              vue.createElementVNode(
                "text",
                { class: "progress-value" },
                vue.toDisplayString(((_d = $data.user.learningProgress) == null ? void 0 : _d.correctAnswers) || 0) + " 题",
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "progress-row" }, [
              vue.createElementVNode("text", { class: "progress-label" }, "正确率："),
              vue.createElementVNode(
                "text",
                { class: "progress-value highlight" },
                vue.toDisplayString(((_e = $data.user.learningProgress) == null ? void 0 : _e.averageAccuracy) || 0) + "%",
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "progress-row" }, [
              vue.createElementVNode("text", { class: "progress-label" }, "练习时长："),
              vue.createElementVNode(
                "text",
                { class: "progress-value" },
                vue.toDisplayString($options.formatPracticeTime($data.user.totalPracticeTime)),
                1
                /* TEXT */
              )
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "menu-section" }, [
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.goToWrongProblems && $options.goToWrongProblems(...args))
          }, [
            vue.createElementVNode("view", { class: "menu-left" }, [
              vue.createElementVNode("image", {
                src: _imports_0$1,
                class: "menu-icon"
              }),
              vue.createElementVNode("text", { class: "menu-text" }, "我的错题集")
            ]),
            vue.createElementVNode("text", { class: "menu-arrow" }, "›")
          ])
        ]),
        vue.createElementVNode("button", {
          class: "edit-btn",
          onClick: _cache[6] || (_cache[6] = (...args) => $options.openEditModal && $options.openEditModal(...args))
        }, "修改信息"),
        vue.createElementVNode("button", {
          class: "logout-btn",
          onClick: _cache[7] || (_cache[7] = (...args) => $options.logout && $options.logout(...args))
        }, "退出登录")
      ])),
      $data.showEditModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "modal-mask",
        onClick: _cache[16] || (_cache[16] = (...args) => $options.closeModal && $options.closeModal(...args))
      }, [
        vue.createElementVNode("view", {
          class: "modal",
          onClick: _cache[15] || (_cache[15] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("text", { class: "modal-title" }, "修改个人信息"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $data.editData.username = $event),
              class: "modal-input",
              placeholder: "修改姓名"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.editData.username]
          ]),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $data.editData.email = $event),
              class: "modal-input",
              placeholder: "修改邮箱"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.editData.email]
          ]),
          vue.createElementVNode("picker", {
            range: $data.grades,
            value: $data.editGradeIndex,
            onChange: _cache[10] || (_cache[10] = (...args) => $options.onEditGradeChange && $options.onEditGradeChange(...args))
          }, [
            vue.createElementVNode(
              "view",
              { class: "modal-picker" },
              " 年级：" + vue.toDisplayString($data.grades[$data.editGradeIndex] || "未设置"),
              1
              /* TEXT */
            )
          ], 40, ["range", "value"]),
          vue.createElementVNode("view", { class: "avatar-upload" }, [
            vue.createElementVNode("text", { class: "avatar-label" }, "头像："),
            vue.createElementVNode("image", {
              src: ((_f = $data.user) == null ? void 0 : _f.avatarUrl) || $data.defaultAvatar,
              class: "modal-avatar",
              onClick: _cache[11] || (_cache[11] = (...args) => $options.chooseAvatar && $options.chooseAvatar(...args))
            }, null, 8, ["src"]),
            vue.createElementVNode("button", {
              class: "upload-btn",
              onClick: _cache[12] || (_cache[12] = (...args) => $options.chooseAvatar && $options.chooseAvatar(...args))
            }, "上传头像")
          ]),
          vue.createElementVNode("view", { class: "modal-actions" }, [
            vue.createElementVNode("button", {
              class: "cancel-btn",
              onClick: _cache[13] || (_cache[13] = (...args) => $options.closeModal && $options.closeModal(...args))
            }, "取消"),
            vue.createElementVNode("button", {
              class: "confirm-btn",
              onClick: _cache[14] || (_cache[14] = (...args) => $options.submitEdit && $options.submitEdit(...args))
            }, "保存")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesTabbarMeMe = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-624f69de"], ["__file", "D:/MySoftWare/MySoftWare/bzd/pages/tabbar/me/me.vue"]]);
  const _imports_1$1 = "/static/icons/success.png";
  const _imports_1 = "/static/icons/medium.png";
  const _sfc_main$5 = {
    data() {
      return {
        grade: "",
        moduleName: "",
        difficulty: "",
        questionCount: 5,
        timeLimit: 5,
        recommendedTime: 5,
        questionOptions: [5, 10, 15, 20],
        timeOptions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        questions: [],
        started: false,
        timer: null,
        remainingTime: 0,
        showResult: false,
        // 是否显示批改结果
        resultData: null
        // 批改结果数据
      };
    },
    onLoad(options) {
      if (!this.checkLogin())
        return;
      formatAppLog("log", "at pages/exam/exam.vue:193", "exam页面接收到的原始参数:", options);
      try {
        let grade = options.grade || "一年级";
        let moduleName = options.module || "加减训练";
        let difficulty = options.difficulty || "简单";
        if (grade.includes("%")) {
          grade = decodeURIComponent(grade);
          formatAppLog("log", "at pages/exam/exam.vue:204", "grade解码一次:", grade);
          if (grade.includes("%")) {
            grade = decodeURIComponent(grade);
            formatAppLog("log", "at pages/exam/exam.vue:208", "grade解码两次:", grade);
          }
        }
        if (moduleName.includes("%")) {
          moduleName = decodeURIComponent(moduleName);
          formatAppLog("log", "at pages/exam/exam.vue:214", "moduleName解码一次:", moduleName);
          if (moduleName.includes("%")) {
            moduleName = decodeURIComponent(moduleName);
            formatAppLog("log", "at pages/exam/exam.vue:217", "moduleName解码两次:", moduleName);
          }
        }
        if (difficulty.includes("%")) {
          difficulty = decodeURIComponent(difficulty);
          formatAppLog("log", "at pages/exam/exam.vue:223", "difficulty解码一次:", difficulty);
          if (difficulty.includes("%")) {
            difficulty = decodeURIComponent(difficulty);
            formatAppLog("log", "at pages/exam/exam.vue:226", "difficulty解码两次:", difficulty);
          }
        }
        this.grade = grade;
        this.moduleName = moduleName;
        this.difficulty = difficulty;
      } catch (e) {
        formatAppLog("error", "at pages/exam/exam.vue:235", "解码参数失败:", e, options);
        this.grade = options.grade || "一年级";
        this.moduleName = options.module || "加减训练";
        this.difficulty = options.difficulty || "简单";
      }
      formatAppLog("log", "at pages/exam/exam.vue:241", "exam页面最终参数:", {
        grade: this.grade,
        moduleName: this.moduleName,
        difficulty: this.difficulty,
        gradeNumber: this.gradeNumber,
        problemType: this.problemType
      });
      this.updateRecommendedTime();
    },
    computed: {
      formattedTime() {
        const min = Math.floor(this.remainingTime / 60);
        const sec = this.remainingTime % 60;
        return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
      },
      // 难度映射：简单->easy, 中等->medium, 困难->hard
      difficultyMap() {
        const map = {
          "简单": "easy",
          "中等": "medium",
          "困难": "hard"
        };
        return map[this.difficulty] || "easy";
      },
      // 年级数字（从"一年级"提取1）
      gradeNumber() {
        if (!this.grade)
          return 1;
        const arabic = String(this.grade).match(/(\d+)/);
        if (arabic)
          return parseInt(arabic[1]);
        const chineseMap = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6 };
        const zhMatch = String(this.grade).match(/([一二三四五六])/);
        if (zhMatch && chineseMap[zhMatch[1]])
          return chineseMap[zhMatch[1]];
        const lastDigit = String(this.grade).slice(-2).match(/(\d)/);
        if (lastDigit)
          return parseInt(lastDigit[1]);
        return 1;
      },
      // 模块名称到后端题型的映射
      problemType() {
        const moduleMap = {
          "加减训练": "mixed",
          // 加减混合
          // 一、二年级新增题型（与后端 ProblemService 对应）
          "10以内加法": "addition_10",
          "10以内减法": "subtraction_10",
          "20以内加法（带进位）": "addition_20_carry",
          "20以内减法（带借位）": "subtraction_20_borrow",
          "100以内加减混合": "mixed_100_add_sub",
          "100以内加减法混合运算": "mixed_100_add_sub",
          // 题型文本别名
          "元角分换算": "money_conversion",
          "元角分的换算": "money_conversion",
          "9x9 乘法口诀": "multiplication_9x9",
          "9以内乘法口诀": "multiplication_9x9",
          "9x9 除法": "division_9x9",
          "9以内除法": "division_9x9",
          "乘法与加法混合": "mixed_mul_add",
          "9以内乘法与加法混合": "mixed_mul_add",
          "连续乘法（3项）": "mixed_consecutive_mul",
          "10以内整数连续乘法": "mixed_consecutive_mul",
          "带余数除法": "division_with_remainder",
          "除数9以内带余数除法": "division_with_remainder",
          "时间换算": "time_conversion",
          // 三年级（13-20）
          "三位数加减法": "add_sub_3digit",
          "两位数乘法": "multiplication_2digit",
          "长方形、正方形周长的计算": "perimeter_calc",
          "长方形、正方形面积的计算": "area_calc",
          "百以内的加减乘除法大小比较": "comparison_100",
          "重量单位换算": "weight_conversion",
          "时间计算": "time_duration",
          "余数除法（大数）": "division_with_remainder_large",
          // 四年级（21-28）
          "小数的加法和减法": "decimal_add_sub",
          "小数的保留": "decimal_rounding",
          "两位数的四则运算": "mixed_ops_2digit",
          "千以内含括号的四则运算": "mixed_ops_parenthesis",
          "巧用交换律与结合律": "associative_law",
          "巧用乘法分配律": "distributive_law",
          "比较千以内的算式大小比较": "advanced_comparison",
          "近似数认识": "number_rounding_unit",
          // 五年级（29-35） & 六年级（36-40）
          "10以内小数乘法": "decimal_multiplication_10",
          "10以内小数除法": "decimal_division_10",
          "小数除法(保留一位小数)": "decimal_division_round_1",
          // 兼容首页 tabbar 中使用的命名（包含“商”字样）
          "小数除法(商保留一位小数)": "decimal_division_round_1",
          "平行四边形面积计算": "parallelogram_area",
          "三角形面积的计算": "triangle_area",
          "梯形面积的计算": "trapezoid_area",
          "圆面积的计算": "circle_area",
          "简单方程练习": "simple_equation",
          "圆柱的体积计算": "cylinder_volume",
          "球体积计算": "sphere_volume",
          "带分数的加减法": "fraction_add_sub",
          "带分数的乘法": "fraction_mul",
          // 其他旧模块映射（保留）
          "数字认读": "comparison",
          // 暂用比较题代替
          "图形认识": "fill_blank",
          // 暂用填空题代替
          "比多少": "comparison",
          "进位加减": "mixed",
          "乘法口诀": "multiplication",
          "长度单位": "fill_blank",
          "时间认读": "fill_blank",
          "乘除混合": "mixed",
          "余数除法": "division",
          "简单应用题": "mixed",
          "分数初步": "fill_blank",
          "多位数运算": "mixed",
          "图表统计": "fill_blank",
          "图形面积": "fill_blank",
          "分数运算": "fill_blank",
          "小数运算": "fill_blank",
          "比例与比": "fill_blank",
          "百分数初步": "fill_blank",
          "综合运算": "mixed",
          "图形变换": "fill_blank",
          "比例尺应用": "fill_blank",
          "数据与概率": "fill_blank"
        };
        return moduleMap[this.moduleName] || "mixed";
      }
    },
    methods: {
      /** ✅ 检查登录状态 */
      checkLogin() {
        const token = uni.getStorageSync("token");
        if (!token) {
          uni.showModal({
            title: "提示",
            content: "请先登录后进行练习",
            showCancel: false,
            success: () => {
              uni.switchTab({
                url: "/pages/tabbar/me/me"
              });
            }
          });
          return false;
        }
        return true;
      },
      // ✅ 更新推荐时长
      updateRecommendedTime() {
        let base = 0;
        switch (this.difficulty) {
          case "简单":
            base = 0.3;
            break;
          case "中等":
            base = 0.5;
            break;
          case "困难":
            base = 0.8;
            break;
          default:
            base = 0.5;
        }
        const recommended = Math.ceil(this.questionCount * base);
        this.recommendedTime = Math.min(recommended, 20);
        this.timeLimit = this.recommendedTime;
      },
      // ✅ 选择题目数量
      onQuestionChange(e) {
        this.questionCount = this.questionOptions[e.detail.value];
        this.updateRecommendedTime();
      },
      // ✅ 选择时长
      onTimeChange(e) {
        this.timeLimit = this.timeOptions[e.detail.value];
      },
      // ✅ 开始出题
      startExam() {
        this.started = true;
        this.generateQuestions();
        this.startTimer();
      },
      // ✅ 倒计时
      startTimer() {
        this.remainingTime = this.timeLimit * 60;
        this.timer = setInterval(() => {
          if (this.remainingTime > 0) {
            this.remainingTime--;
          } else {
            clearInterval(this.timer);
            this.autoSubmit();
          }
        }, 1e3);
      },
      // ✅ 时间到自动提交
      autoSubmit() {
        uni.showModal({
          title: "时间到",
          content: "时间已到，系统自动提交答案。",
          showCancel: false,
          success: () => this.submitAnswers()
        });
      },
      // ✅ 出题逻辑 - 调用后端 API
      async generateQuestions() {
        uni.showLoading({ title: "正在生成题目...", mask: true });
        try {
          const res = await request({
            url: `${api.problems}?type=${this.problemType}&difficulty=${this.difficultyMap}&count=${this.questionCount}&grade=${this.gradeNumber}`,
            method: "GET",
            auth: true
          });
          let problems = [];
          try {
            if (Array.isArray(res)) {
              problems = res;
            } else if (res && Array.isArray(res.data)) {
              problems = res.data;
            } else if (res && Array.isArray(res.problems)) {
              problems = res.problems;
            } else if (res && res.count && Array.isArray(res.data)) {
              problems = res.data;
            }
          } catch (e) {
            formatAppLog("warn", "at pages/exam/exam.vue:477", "解析后端出题响应时出现异常", e, res);
          }
          if (problems && problems.length > 0) {
            this.questions = problems.map((p) => {
              let normalizedType = p.type || p.problemType || "mixed";
              const ntStr = String(normalizedType);
              if (ntStr.indexOf("division_with_remainder") !== -1) {
                normalizedType = "division_with_remainder";
              } else if (ntStr.indexOf("comparison") !== -1) {
                normalizedType = "comparison";
              }
              const equalTypes = /* @__PURE__ */ new Set([
                "addition",
                "subtraction",
                "multiplication",
                "division",
                "mixed",
                "addition_10",
                "subtraction_10",
                "addition_20_carry",
                "subtraction_20_borrow",
                "mixed_100_add_sub",
                "multiplication_9x9",
                "division_9x9",
                "mixed_mul_add",
                "mixed_consecutive_mul",
                "add_sub_3digit",
                "multiplication_2digit",
                "mixed_ops_2digit",
                "mixed_ops_parenthesis",
                "decimal_add_sub",
                "decimal_multiplication_10",
                "decimal_division_10",
                "decimal_division_round_1",
                "fraction_add_sub",
                "fraction_mul"
              ]);
              let rawQuestion = p.expression || p.question || "";
              let renderedQuestion = rawQuestion;
              if (normalizedType !== "comparison" && equalTypes.has(normalizedType)) {
                const trimmed = String(rawQuestion).trim();
                if (!/[=？?]$/.test(trimmed)) {
                  renderedQuestion = trimmed + " =";
                } else {
                  renderedQuestion = trimmed;
                }
              }
              return {
                id: p.id,
                question: normalizedType === "comparison" ? p.expression : renderedQuestion,
                answer: "",
                // 带余数题目把 remainder 一并保存
                correctRemainder: p.remainder !== void 0 ? p.remainder : void 0,
                // 注意：answer 可能为 0，不能用 `||` 否则会被误判为 undefined
                correctAnswer: p.answer !== void 0 && p.answer !== null ? p.answer : p.correctAnswer !== void 0 && p.correctAnswer !== null ? p.correctAnswer : p.answerValue,
                remainder: p.remainder !== void 0 ? p.remainder : void 0,
                type: normalizedType,
                difficulty: p.difficulty || this.difficultyMap,
                expression: p.expression || p.expr || "",
                options: p.options,
                // 初始化双输入字段（带余数）
                answerQuotient: "",
                answerRemainder: ""
              };
            });
            uni.hideLoading();
          } else {
            formatAppLog("warn", "at pages/exam/exam.vue:542", "后端出题返回非预期格式或空数据：", res);
            throw new Error("后端返回数据为空或格式不支持");
          }
        } catch (err) {
          formatAppLog("error", "at pages/exam/exam.vue:546", "获取题目失败:", err);
          uni.hideLoading();
          uni.showModal({
            title: "提示",
            content: "网络异常，将使用本地出题模式",
            showCancel: false,
            success: () => {
              this.generateQuestionsLocal();
            }
          });
        }
      },
      // 本地出题（降级方案）
      generateQuestionsLocal() {
        const level = this.difficulty === "简单" ? 10 : this.difficulty === "中等" ? 50 : 100;
        if (this.moduleName === "10以内加法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * 11);
            const b = Math.floor(Math.random() * (11 - a));
            return { question: `${a} + ${b} =`, answer: "" };
          });
        } else if (this.moduleName === "10以内减法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * 11);
            const b = Math.floor(Math.random() * (a + 1));
            return { question: `${a} - ${b} =`, answer: "" };
          });
        } else if (this.moduleName === "20以内加法（带进位）" || this.moduleName === "20以内减法（带借位）" || this.moduleName === "100以内加减混合" || this.moduleName === "100以内加减法混合运算") {
          const range = this.moduleName.includes("100") ? 100 : 20;
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * (range - 1)) + 1;
            const b = Math.floor(Math.random() * (range - 1)) + 1;
            const op = Math.random() > 0.5 ? "+" : "-";
            return { question: `${a} ${op} ${b} =`, answer: "" };
          });
        } else if (this.moduleName === "元角分换算" || this.moduleName === "元角分的换算" || this.moduleName === "时间换算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            if (this.moduleName === "元角分换算") {
              const j = Math.floor(Math.random() * 9) + 1;
              const f = Math.floor(Math.random() * 9) + 1;
              return { question: `${j}角${f}分 = ? 分`, answer: "" };
            } else {
              const m = Math.floor(Math.random() * 9) + 1;
              const s = Math.floor(Math.random() * 59) + 1;
              return { question: `${m}分${s}秒 = ? 秒`, answer: "" };
            }
          });
        } else if (this.moduleName === "9x9 乘法口诀" || this.moduleName === "9以内乘法口诀") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * 9) + 1;
            const b = Math.floor(Math.random() * 9) + 1;
            return { question: `${a} × ${b} =`, answer: "" };
          });
        } else if (this.moduleName === "9x9 除法" || this.moduleName === "9以内除法" || this.moduleName === "带余数除法" || this.moduleName === "除数9以内带余数除法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const b = Math.floor(Math.random() * 9) + 1;
            const q = Math.floor(Math.random() * 9) + 1;
            const a = b * q + Math.floor(Math.random() * b);
            return { question: `${a} ÷ ${b} =`, answer: "" };
          });
        } else if (this.moduleName === "乘法与加法混合" || this.moduleName === "9以内乘法与加法混合" || this.moduleName === "连续乘法（3项）" || this.moduleName === "10以内整数连续乘法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            if (this.moduleName === "连续乘法（3项）") {
              const a2 = Math.floor(Math.random() * 9) + 1;
              const b2 = Math.floor(Math.random() * 9) + 1;
              const c2 = Math.floor(Math.random() * 9) + 1;
              return { question: `${a2} × ${b2} × ${c2} =`, answer: "" };
            }
            const a = Math.floor(Math.random() * 9) + 1;
            const b = Math.floor(Math.random() * 9) + 1;
            const c = Math.floor(Math.random() * 20) + 1;
            if (Math.random() > 0.5)
              return { question: `${a} × ${b} + ${c} =`, answer: "" };
            return { question: `${a} + ${b} × ${c} =`, answer: "" };
          });
        } else {
          if (this.moduleName.includes("加减")) {
            this.questions = this.createAddSubQuestions(level);
          } else if (this.moduleName.includes("乘除")) {
            this.questions = this.createMulDivQuestions(level);
          } else {
            this.questions = this.createAddSubQuestions(level);
          }
        }
        if (this.moduleName === "三位数加减法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const op = Math.random() > 0.5 ? "+" : "-";
            let a = Math.floor(Math.random() * 900) + 100;
            let b = Math.floor(Math.random() * 900) + 100;
            if (op === "-" && b > a)
              [a, b] = [b, a];
            return { question: `${a} ${op} ${b} =`, answer: "" };
          });
        }
        if (this.moduleName === "两位数乘法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * 90) + 10;
            const b = Math.floor(Math.random() * 90) + 10;
            return { question: `${a} × ${b} =`, answer: "" };
          });
        }
        if (this.moduleName === "长方形、正方形周长的计算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            if (Math.random() > 0.5) {
              const l = Math.floor(Math.random() * 50) + 1;
              const w = Math.floor(Math.random() * 50) + 1;
              return { question: `长方形长${l}cm, 宽${w}cm, 周长是? cm`, answer: "" };
            } else {
              const s = Math.floor(Math.random() * 50) + 1;
              return { question: `正方形边长${s}cm, 周长是? cm`, answer: "" };
            }
          });
        }
        if (this.moduleName === "长方形、正方形面积的计算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            if (Math.random() > 0.5) {
              const l = Math.floor(Math.random() * 50) + 1;
              const w = Math.floor(Math.random() * 50) + 1;
              return { question: `长方形长${l}cm, 宽${w}cm, 面积是? cm²`, answer: "" };
            } else {
              const s = Math.floor(Math.random() * 50) + 1;
              return { question: `正方形边长${s}cm, 面积是? cm²`, answer: "" };
            }
          });
        }
        if (this.moduleName === "百以内的加减乘除法大小比较") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * 99) + 1;
            const b = Math.floor(Math.random() * 99) + 1;
            const ops = ["+", "-", "×", "÷"];
            const op = ops[Math.floor(Math.random() * ops.length)];
            let leftExpr = `${a} ${op} ${b}`;
            if (op === "÷") {
              const divisor = Math.floor(Math.random() * 9) + 1;
              const q = Math.floor(Math.random() * 9) + 1;
              const dividend = divisor * q;
              leftExpr = `${dividend} ÷ ${divisor}`;
            }
            const right = Math.floor(Math.random() * 200) + 1;
            let leftVal = 0;
            try {
              leftVal = new Function(`return ${leftExpr.replace(/×/g, "*").replace(/÷/g, "/")}`)();
            } catch (e) {
              leftVal = 0;
            }
            const comp = leftVal > right ? ">" : leftVal < right ? "<" : "=";
            return { question: `${leftExpr} ? ${right}`, answer: "", type: "comparison", options: [">", "<", "="], correctAnswer: comp };
          });
        }
        if (this.moduleName === "重量单位换算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const t = Math.floor(Math.random() * 99) + 1;
            return { question: `${t}吨 = ? 千克`, answer: "" };
          });
        }
        if (this.moduleName === "时间计算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const h1 = Math.floor(Math.random() * 23);
            const m1 = Math.floor(Math.random() * 60);
            const addMinutes = Math.floor(Math.random() * 8) * 15 + Math.floor(Math.random() * 4) + 1;
            let total1 = h1 * 60 + m1;
            let total2 = total1 + addMinutes;
            if (total2 >= 24 * 60)
              total2 = (total1 + addMinutes % (24 * 60)) % (24 * 60);
            const h2 = Math.floor(total2 / 60);
            const m2 = total2 % 60;
            const t1 = `${String(h1).padStart(2, "0")}:${String(m1).padStart(2, "0")}`;
            const t2 = `${String(h2).padStart(2, "0")}:${String(m2).padStart(2, "0")}`;
            return { question: `${t1}到${t2}是 ? 分钟`, answer: "" };
          });
        }
        if (this.moduleName === "余数除法" || this.moduleName === "余数除法（大数）") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const b = Math.floor(Math.random() * 99) + 1;
            const q = Math.floor(Math.random() * 20) + 1;
            const a = b * q + Math.floor(Math.random() * b);
            const correctQuotient = Math.floor(a / b);
            const correctRemainder = a % b;
            return {
              question: `${a} ÷ ${b} =`,
              answer: "",
              type: "division_with_remainder",
              correctAnswer: correctQuotient,
              remainder: correctRemainder,
              answerQuotient: "",
              answerRemainder: ""
            };
          });
        }
        if (this.moduleName === "小数的加法和减法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = (Math.floor(Math.random() * 1e3) / 100).toFixed(2);
            const b = (Math.floor(Math.random() * 1e3) / 100).toFixed(2);
            return { question: `${a} ${Math.random() > 0.5 ? "+" : "-"} ${b} =`, answer: "" };
          });
        }
        if (this.moduleName === "小数的保留") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const num = (Math.random() * 100).toFixed(3);
            const d = Math.random() > 0.5 ? 1 : 2;
            return { question: `${num} (保留${d}位小数)`, answer: "" };
          });
        }
        if (this.moduleName === "两位数的四则运算" || this.moduleName === "千以内含括号的四则运算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * 90) + 10;
            const b = Math.floor(Math.random() * 90) + 10;
            const c = Math.floor(Math.random() * 90) + 10;
            if (this.moduleName === "千以内含括号的四则运算") {
              return { question: `${a} × (${b} - ${Math.floor(Math.random() * b)}) =`, answer: "" };
            }
            const op1 = Math.random() > 0.5 ? "×" : "÷";
            const op2 = Math.random() > 0.5 ? "+" : "-";
            if (op1 === "÷") {
              const divisor = Math.floor(Math.random() * 9) + 1;
              const q = Math.floor(Math.random() * 9) + 1;
              const dividend = divisor * q;
              return { question: `${dividend} ÷ ${divisor} ${op2} ${c} =`, answer: "" };
            }
            return { question: `${a} ${op1} ${b} ${op2} ${c} =`, answer: "" };
          });
        }
        if (this.moduleName === "巧用交换律与结合律" || this.moduleName === "巧用乘法分配律" || this.moduleName === "比较千以内的算式大小比较" || this.moduleName === "近似数认识") {
          this.questions = Array.from({ length: this.questionCount }, () => ({ question: "请写出计算结果", answer: "" }));
        }
        if (this.moduleName === "10以内小数乘法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = (Math.floor(Math.random() * 100) / 10).toFixed(1);
            const b = (Math.floor(Math.random() * 100) / 10).toFixed(1);
            return { question: `${a} × ${b} =`, answer: "" };
          });
        }
        if (this.moduleName === "10以内小数除法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = (Math.floor(Math.random() * 990) / 100 + 0.1).toFixed(2);
            const b = (Math.floor(Math.random() * 99) / 10 + 0.1).toFixed(1);
            return { question: `${a} ÷ ${b} =`, answer: "" };
          });
        }
        if (this.moduleName === "小数除法(保留一位小数)" || this.moduleName === "小数除法(商保留一位小数)") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = (Math.random() * 19 + 1).toFixed(2);
            const b = (Math.random() * 9 + 1).toFixed(2);
            return { question: `${a} ÷ ${b} ≈ ? (保留一位小数)`, answer: "" };
          });
        }
        if (this.moduleName === "平行四边形面积计算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const base = Math.floor(Math.random() * 100) + 1;
            const height = Math.floor(Math.random() * 100) + 1;
            return { question: `平行四边形的底是${base}cm, 高是${height}cm, 面积是? cm²`, answer: "" };
          });
        }
        if (this.moduleName === "三角形面积的计算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const base = Math.floor(Math.random() * 100) + 1;
            const height = Math.floor(Math.random() * 100) + 1;
            return { question: `三角形的底边是${base}cm, 高是${height}cm, 面积是? cm²`, answer: "" };
          });
        }
        if (this.moduleName === "梯形面积的计算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const top = Math.floor(Math.random() * 80) + 1;
            const bottom = Math.floor(Math.random() * 80) + top;
            const height = Math.floor(Math.random() * 50) + 1;
            return { question: `梯形的上底是${top}cm, 下底是${bottom}cm, 高是${height}cm, 面积是? cm²`, answer: "" };
          });
        }
        if (this.moduleName === "圆面积的计算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const r = Math.floor(Math.random() * 30) + 1;
            return { question: `圆的半径是${r}cm, 面积是? cm² (π取3.14)`, answer: "" };
          });
        }
        if (this.moduleName === "简单方程练习") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * 8) + 2;
            const x = Math.floor(Math.random() * 10) + 1;
            const b = Math.floor(Math.random() * 20) + 1;
            const c = a * x + b;
            return { question: `${a}x + ${b} = ${c}, x=?`, answer: "" };
          });
        }
        if (this.moduleName === "圆柱的体积计算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const r = Math.floor(Math.random() * 20) + 1;
            const h = Math.floor(Math.random() * 20) + 1;
            return { question: `圆柱的半径是${r}cm, 高是${h}cm, 体积是? cm³ (π取3.14)`, answer: "" };
          });
        }
        if (this.moduleName === "球体积计算") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const r = Math.floor(Math.random() * 20) + 1;
            return { question: `球的半径是${r}cm, 体积是? cm³ (π取3.14)`, answer: "" };
          });
        }
        if (this.moduleName === "带分数的加减法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const n1 = Math.floor(Math.random() * 8) + 1;
            const d1 = Math.floor(Math.random() * 9) + 2;
            const n2 = Math.floor(Math.random() * 8) + 1;
            const d2 = Math.floor(Math.random() * 9) + 2;
            const op = Math.random() > 0.5 ? "+" : "-";
            return { question: `${n1}/${d1} ${op} ${n2}/${d2} =`, answer: "" };
          });
        }
        if (this.moduleName === "带分数的乘法") {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const n1 = Math.floor(Math.random() * 8) + 1;
            const d1 = Math.floor(Math.random() * 9) + 2;
            const n2 = Math.floor(Math.random() * 8) + 1;
            const d2 = Math.floor(Math.random() * 9) + 2;
            return { question: `${n1}/${d1} × ${n2}/${d2} =`, answer: "" };
          });
        }
      },
      createAddSubQuestions(range) {
        return Array.from({ length: this.questionCount }, () => {
          const a = Math.floor(Math.random() * range);
          const b = Math.floor(Math.random() * range);
          const op = Math.random() > 0.5 ? "+" : "-";
          return { question: `${a} ${op} ${b} =`, answer: "" };
        });
      },
      createMulDivQuestions(range) {
        return Array.from({ length: this.questionCount }, () => {
          const a = Math.floor(Math.random() * range);
          const b = Math.floor(Math.random() * (range / 10)) + 1;
          const op = Math.random() > 0.5 ? "×" : "÷";
          return { question: `${a} ${op} ${b} =`, answer: "" };
        });
      },
      // ✅ 提交答案 - 调用后端评分 API
      async submitAnswers() {
        clearInterval(this.timer);
        const empty = this.questions.some((q) => {
          if (q.type === "division_with_remainder") {
            return !(q.answerQuotient !== void 0 && q.answerQuotient !== "" && q.answerRemainder !== void 0 && q.answerRemainder !== "");
          }
          if (q.type === "comparison") {
            return !(q.answer !== void 0 && q.answer !== "");
          }
          return !(q.answer !== void 0 && q.answer !== "");
        });
        if (empty) {
          uni.showToast({ title: "请填写所有答案", icon: "none" });
          return;
        }
        this.saveProgress(false);
        uni.showLoading({ title: "评分中...", mask: true });
        try {
          const problems = this.questions.map((q) => {
            if (q.type === "division_with_remainder") {
              return {
                id: q.id,
                expression: q.expression || q.question.replace(" =", ""),
                answer: q.correctAnswer,
                // 商
                remainder: q.remainder || q.correctRemainder || void 0,
                userAnswer: {
                  quotient: Number(q.answerQuotient),
                  remainder: Number(q.answerRemainder)
                },
                type: q.type || "division_with_remainder",
                difficulty: q.difficulty || this.difficultyMap,
                timeSpent: 0
              };
            }
            return {
              id: q.id,
              expression: q.expression || q.question.replace(" =", ""),
              answer: q.correctAnswer,
              userAnswer: q.answer,
              type: q.type || "mixed",
              difficulty: q.difficulty || this.difficultyMap,
              timeSpent: 0
              // 可以后续优化为单题计时
            };
          });
          const totalTime = this.timeLimit * 60 - this.remainingTime;
          const res = await request({
            url: api.problemsSubmit,
            method: "POST",
            auth: true,
            data: {
              problems,
              totalTime,
              grade: this.gradeNumber,
              module: this.moduleName
            }
          });
          uni.hideLoading();
          const ok = res && res.success || res && res.summary && Array.isArray(res.details);
          if (ok) {
            this.resultData = res;
            this.showResult = true;
            const details = res.details || [];
            this.questions = this.questions.map((q, index) => {
              var _a, _b, _c, _d;
              return {
                ...q,
                isCorrect: (_a = details[index]) == null ? void 0 : _a.isCorrect,
                correctAnswer: (_b = details[index]) == null ? void 0 : _b.correctAnswer,
                // 如果后端返回 remainder，则保存到本地题目信息
                correctRemainder: ((_c = details[index]) == null ? void 0 : _c.remainder) ?? ((_d = details[index]) == null ? void 0 : _d.correctRemainder) ?? q.correctRemainder ?? q.remainder
              };
            });
          } else {
            formatAppLog("warn", "at pages/exam/exam.vue:1047", "提交评分时后端返回非预期格式或错误：", res);
            throw new Error(res && res.message || "评分失败");
          }
        } catch (err) {
          formatAppLog("error", "at pages/exam/exam.vue:1051", "提交答案失败:", err);
          uni.hideLoading();
          uni.showModal({
            title: "提示",
            content: "网络异常，无法提交到服务器。是否返回首页？",
            success: (res) => {
              if (res.confirm) {
                uni.switchTab({ url: "/pages/tabbar/index/index" });
              }
            }
          });
        }
      },
      // 返回首页
      backToHome() {
        uni.switchTab({ url: "/pages/tabbar/index/index" });
      },
      // 查看错题集
      viewWrongProblems() {
        uni.navigateTo({ url: "/pages/wrongProblems/wrongProblems" });
      },
      goBack() {
        clearInterval(this.timer);
        this.saveProgress(true);
        uni.switchTab({
          url: "/pages/tabbar/index/index"
        });
      },
      // ✅ 新增保存进度方法
      saveProgress(isUnfinished) {
        const progress = {
          grade: this.grade,
          module: this.moduleName,
          difficulty: this.difficulty,
          questionCount: this.questionCount,
          timeLimit: this.timeLimit,
          remainingTime: this.remainingTime,
          unfinished: isUnfinished,
          timestamp: Date.now()
        };
        uni.setStorageSync("lastProgress", progress);
      },
      // ✅ 难度图标
      // ✅ 导出本次题目与批改结果为 TXT
      exportTxt() {
        if (!this.showResult || !this.resultData) {
          return uni.showToast({ title: "请先完成并批改试卷", icon: "none" });
        }
        const summary = this.resultData.summary || {};
        const details = this.resultData.details || [];
        const pad = (n) => n < 10 ? "0" + n : "" + n;
        const now = /* @__PURE__ */ new Date();
        const filename = `口算练习_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;
        const lines = [];
        lines.push("【口算练习导出】");
        lines.push(`时间：${now.toLocaleString()}`);
        lines.push(`年级：${this.grade}  模块：${this.moduleName}  难度：${this.difficulty}`);
        lines.push(`总题数：${summary.total}  正确：${summary.correct}  正确率：${summary.accuracy}%`);
        const usedMin = Math.floor((summary.totalTime || 0) / 60);
        const usedSec = (summary.totalTime || 0) % 60;
        lines.push(`用时：${usedMin}分${usedSec}秒`);
        lines.push("");
        lines.push("—— 题目详情 ——");
        details.forEach((d, i) => {
          var _a, _b, _c;
          const idx = i + 1;
          const expr = d.expression || ((_a = this.questions[i]) == null ? void 0 : _a.expression) || ((_c = (_b = this.questions[i]) == null ? void 0 : _b.question) == null ? void 0 : _c.replace(" =", "")) || "";
          const ua = this.formatUserAnswer(d, i);
          const ca = this.formatCorrectAnswer(d, i);
          const correctMark = d.isCorrect ? "正确" : "错误";
          lines.push(`${idx}. ${expr}`);
          lines.push(`   你的答案：${ua}    结果：${correctMark}`);
          if (!d.isCorrect) {
            lines.push(`   正确答案：${ca}`);
          }
        });
        const content = lines.join("\n");
        try {
          const isAndroid = uni.getSystemInfoSync().platform === "android";
          if (isAndroid && typeof plus !== "undefined" && plus.android) {
            try {
              const main = plus.android.runtimeMainActivity();
              const Environment = plus.android.importClass("android.os.Environment");
              const File = plus.android.importClass("java.io.File");
              const FileOutputStream = plus.android.importClass("java.io.FileOutputStream");
              const downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
              const targetFile = new File(downloadsDir, filename);
              const fos = new FileOutputStream(targetFile);
              fos.write(new java.lang.String(content).getBytes("UTF-8"));
              fos.flush();
              fos.close();
              const absPath = targetFile.getAbsolutePath();
              uni.showModal({ title: "导出成功", content: `文件已保存：
${absPath}`, showCancel: false });
            } catch (androidErr) {
              const targetDir = "_downloads";
              plus.io.requestFileSystem(plus.io.PUBLIC_DOWNLOADS, (fs) => {
                fs.root.getDirectory(targetDir, { create: true }, (dir) => {
                  dir.getFile(filename, { create: true }, (fileEntry) => {
                    fileEntry.createWriter((writer) => {
                      writer.onwrite = () => {
                        const localPath = plus.io.convertLocalFileSystemURL(fileEntry.fullPath);
                        uni.showModal({ title: "导出成功", content: `文件已保存：
${localPath}`, showCancel: false });
                      };
                      writer.seek(0);
                      writer.write(content);
                    }, () => uni.showToast({ title: "写入失败", icon: "none" }));
                  }, () => uni.showToast({ title: "创建文件失败", icon: "none" }));
                }, () => uni.showToast({ title: "创建目录失败", icon: "none" }));
              }, () => {
                plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
                  fs.root.getDirectory("exports", { create: true }, (dir) => {
                    dir.getFile(filename, { create: true }, (fileEntry) => {
                      fileEntry.createWriter((writer) => {
                        writer.onwrite = () => {
                          const localPath = plus.io.convertLocalFileSystemURL(fileEntry.fullPath);
                          uni.showModal({
                            title: "已保存到应用目录",
                            content: `文件路径：
${localPath}
（可通过分享或文件管理器移动到Download）`,
                            showCancel: false
                          });
                        };
                        writer.seek(0);
                        writer.write(content);
                      }, () => uni.showToast({ title: "写入失败", icon: "none" }));
                    });
                  });
                });
              });
            }
          } else {
            const targetDir = "_downloads";
            plus.io.requestFileSystem(plus.io.PUBLIC_DOWNLOADS, (fs) => {
              fs.root.getDirectory(targetDir, { create: true }, (dir) => {
                dir.getFile(filename, { create: true }, (fileEntry) => {
                  fileEntry.createWriter((writer) => {
                    writer.onwrite = () => {
                      const localPath = plus.io.convertLocalFileSystemURL(fileEntry.fullPath);
                      uni.showModal({ title: "导出成功", content: `文件已保存：
${localPath}`, showCancel: false });
                    };
                    writer.seek(0);
                    writer.write(content);
                  }, () => uni.showToast({ title: "写入失败", icon: "none" }));
                }, () => uni.showToast({ title: "创建文件失败", icon: "none" }));
              }, () => uni.showToast({ title: "创建目录失败", icon: "none" }));
            }, () => uni.showToast({ title: "无法访问存储", icon: "none" }));
          }
        } catch (e) {
          uni.showToast({ title: "导出失败", icon: "none" });
        }
      },
      getDifficultyIcon(level) {
        if (level === "简单")
          return "/static/icons/easy.png";
        if (level === "中等")
          return "/static/icons/medium.png";
        if (level === "困难")
          return "/static/icons/hard.png";
        return "/static/icons/medium.png";
      },
      // 格式化用户答案显示（处理带余数除法的对象格式）
      formatUserAnswer(detail, index) {
        var _a, _b, _c, _d;
        try {
          const qType = detail.type || ((_a = this.questions[index]) == null ? void 0 : _a.type);
          const ua = detail.userAnswer ?? ((_b = this.questions[index]) == null ? void 0 : _b.userAnswer) ?? ((_c = this.questions[index]) == null ? void 0 : _c.answer);
          if (qType === "division_with_remainder" || ((_d = this.questions[index]) == null ? void 0 : _d.type) === "division_with_remainder") {
            if (!ua)
              return "";
            if (typeof ua === "object") {
              const qu = ua.quotient ?? ua.q ?? ua.quot;
              const rem = ua.remainder ?? ua.r ?? ua.rem;
              return `${qu} 余 ${rem}`;
            }
            const nums = String(ua).match(/-?\d+/g);
            if (nums && nums.length >= 1) {
              const qu = nums[0];
              const rem = nums[1] ?? "";
              return rem !== "" ? `${qu} 余 ${rem}` : `${qu}`;
            }
            return String(ua);
          }
          return typeof ua === "object" ? JSON.stringify(ua) : String(ua);
        } catch (e) {
          formatAppLog("warn", "at pages/exam/exam.vue:1295", "formatUserAnswer error", e, detail);
          return detail.userAnswer ?? "";
        }
      },
      // 格式化正确答案显示（处理带余数除法的 remainder）
      formatCorrectAnswer(detail, index) {
        var _a, _b, _c, _d, _e;
        try {
          const qType = detail.type || ((_a = this.questions[index]) == null ? void 0 : _a.type);
          const ca = detail.correctAnswer ?? ((_b = this.questions[index]) == null ? void 0 : _b.correctAnswer);
          const rem = detail.remainder ?? detail.correctRemainder ?? ((_c = this.questions[index]) == null ? void 0 : _c.correctRemainder) ?? ((_d = this.questions[index]) == null ? void 0 : _d.remainder);
          if (qType === "division_with_remainder" || ((_e = this.questions[index]) == null ? void 0 : _e.type) === "division_with_remainder") {
            if (rem !== void 0 && rem !== null && rem !== "")
              return `${ca} 余 ${rem}`;
            return String(ca);
          }
          return String(ca);
        } catch (e) {
          formatAppLog("warn", "at pages/exam/exam.vue:1313", "formatCorrectAnswer error", e, detail);
          return detail.correctAnswer ?? "";
        }
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "exam-container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "exam-header" }, [
        vue.createElementVNode(
          "text",
          { class: "exam-grade" },
          vue.toDisplayString($data.grade),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          { class: "exam-module" },
          vue.toDisplayString($data.moduleName),
          1
          /* TEXT */
        ),
        vue.createElementVNode("view", { class: "difficulty" }, [
          vue.createElementVNode("image", {
            src: $options.getDifficultyIcon($data.difficulty),
            class: "difficulty-icon"
          }, null, 8, ["src"]),
          vue.createElementVNode(
            "text",
            { class: "exam-difficulty" },
            "难度：" + vue.toDisplayString($data.difficulty),
            1
            /* TEXT */
          )
        ])
      ]),
      !$data.started ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "config-panel"
      }, [
        vue.createElementVNode("view", { class: "config-item" }, [
          vue.createElementVNode("text", null, "题目数量："),
          vue.createElementVNode("picker", {
            range: $data.questionOptions,
            onChange: _cache[0] || (_cache[0] = (...args) => $options.onQuestionChange && $options.onQuestionChange(...args))
          }, [
            vue.createElementVNode(
              "view",
              { class: "picker" },
              vue.toDisplayString($data.questionCount) + " 题",
              1
              /* TEXT */
            )
          ], 40, ["range"])
        ]),
        vue.createElementVNode("view", { class: "config-item" }, [
          vue.createElementVNode("text", null, "答题时长："),
          vue.createElementVNode("picker", {
            range: $data.timeOptions,
            onChange: _cache[1] || (_cache[1] = (...args) => $options.onTimeChange && $options.onTimeChange(...args))
          }, [
            vue.createElementVNode("view", { class: "picker" }, [
              vue.createTextVNode(
                vue.toDisplayString($data.timeLimit) + " 分钟 ",
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "recommend-text" },
                "(推荐: " + vue.toDisplayString($data.recommendedTime) + " 分钟)",
                1
                /* TEXT */
              )
            ])
          ], 40, ["range"])
        ]),
        vue.createElementVNode("view", { class: "config-buttons" }, [
          vue.createElementVNode("button", {
            class: "start-btn",
            onClick: _cache[2] || (_cache[2] = (...args) => $options.startExam && $options.startExam(...args))
          }, "开始练习"),
          vue.createElementVNode("button", {
            class: "back-btn",
            onClick: _cache[3] || (_cache[3] = (...args) => $options.goBack && $options.goBack(...args))
          }, "返回主页")
        ])
      ])) : $data.started && !$data.showResult ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "exam-content"
      }, [
        vue.createElementVNode("view", { class: "timer" }, [
          vue.createElementVNode(
            "text",
            null,
            "剩余时间：" + vue.toDisplayString($options.formattedTime),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("scroll-view", {
          "scroll-y": "",
          class: "question-area"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.questions, (q, index) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: index,
                class: "question-card"
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "question-text" },
                  vue.toDisplayString(index + 1) + ". " + vue.toDisplayString(q.question),
                  1
                  /* TEXT */
                ),
                q.type === "comparison" ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "option-group"
                }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(q.options || [">", "<", "="], (opt) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        key: opt,
                        class: vue.normalizeClass(["option-item", q.answer === opt ? "selected" : ""]),
                        onClick: ($event) => q.answer = opt
                      }, vue.toDisplayString(opt), 11, ["onClick"]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])) : q.type && q.type.indexOf("division_with_remainder") !== -1 || q.remainder !== void 0 || q.correctRemainder !== void 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 1,
                  class: "division-remainder"
                }, [
                  vue.createElementVNode("view", { class: "division-inputs" }, [
                    vue.withDirectives(vue.createElementVNode("input", {
                      "onUpdate:modelValue": ($event) => q.answerQuotient = $event,
                      type: "number",
                      class: "answer-input",
                      placeholder: "商"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vue.vModelText, q.answerQuotient]
                    ]),
                    vue.createElementVNode("text", { style: { "margin": "0 10rpx", "font-size": "28rpx", "align-self": "center" } }, "余"),
                    vue.withDirectives(vue.createElementVNode("input", {
                      "onUpdate:modelValue": ($event) => q.answerRemainder = $event,
                      type: "number",
                      class: "answer-input",
                      placeholder: "余数"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vue.vModelText, q.answerRemainder]
                    ])
                  ])
                ])) : vue.withDirectives((vue.openBlock(), vue.createElementBlock("input", {
                  key: 2,
                  "onUpdate:modelValue": ($event) => q.answer = $event,
                  type: "text",
                  class: "answer-input",
                  placeholder: "请输入答案"
                }, null, 8, ["onUpdate:modelValue"])), [
                  [vue.vModelText, q.answer]
                ])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "exam-footer" }, [
          vue.createElementVNode("button", {
            class: "submit-btn",
            onClick: _cache[4] || (_cache[4] = (...args) => $options.submitAnswers && $options.submitAnswers(...args))
          }, "提交答案"),
          vue.createElementVNode("button", {
            class: "back-btn",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.goBack && $options.goBack(...args))
          }, "返回主页")
        ])
      ])) : $data.showResult ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "result-container"
      }, [
        vue.createElementVNode("view", { class: "result-header" }, [
          $data.resultData.summary.accuracy >= 80 ? (vue.openBlock(), vue.createElementBlock("image", {
            key: 0,
            src: _imports_1$1,
            class: "result-icon"
          })) : $data.resultData.summary.accuracy >= 60 ? (vue.openBlock(), vue.createElementBlock("image", {
            key: 1,
            src: _imports_1,
            class: "result-icon"
          })) : (vue.openBlock(), vue.createElementBlock("image", {
            key: 2,
            src: _imports_0$1,
            class: "result-icon"
          })),
          vue.createElementVNode("text", { class: "result-title" }, "批改完成"),
          vue.createElementVNode("view", { class: "score-summary" }, [
            vue.createElementVNode("view", { class: "score-item" }, [
              vue.createElementVNode("text", { class: "score-label" }, "正确率"),
              vue.createElementVNode(
                "text",
                { class: "score-value" },
                vue.toDisplayString($data.resultData.summary.accuracy) + "%",
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "score-item" }, [
              vue.createElementVNode("text", { class: "score-label" }, "正确题数"),
              vue.createElementVNode(
                "text",
                { class: "score-value" },
                vue.toDisplayString($data.resultData.summary.correct) + "/" + vue.toDisplayString($data.resultData.summary.total),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "score-item" }, [
              vue.createElementVNode("text", { class: "score-label" }, "用时"),
              vue.createElementVNode(
                "text",
                { class: "score-value" },
                vue.toDisplayString(Math.floor($data.resultData.summary.totalTime / 60)) + "分" + vue.toDisplayString($data.resultData.summary.totalTime % 60) + "秒",
                1
                /* TEXT */
              )
            ])
          ])
        ]),
        vue.createElementVNode("scroll-view", {
          "scroll-y": "",
          class: "result-list"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.resultData.details, (detail, index) => {
              return vue.openBlock(), vue.createElementBlock(
                "view",
                {
                  key: index,
                  class: vue.normalizeClass(["result-card", detail.isCorrect ? "correct" : "wrong"])
                },
                [
                  vue.createElementVNode("view", { class: "result-card-header" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "question-number" },
                      "第 " + vue.toDisplayString(index + 1) + " 题",
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("view", { class: "result-badge" }, [
                      detail.isCorrect ? (vue.openBlock(), vue.createElementBlock("image", {
                        key: 0,
                        src: _imports_1$1,
                        class: "badge-icon"
                      })) : (vue.openBlock(), vue.createElementBlock("image", {
                        key: 1,
                        src: _imports_0$1,
                        class: "badge-icon"
                      })),
                      vue.createElementVNode(
                        "text",
                        {
                          class: vue.normalizeClass(detail.isCorrect ? "correct-text" : "wrong-text")
                        },
                        vue.toDisplayString(detail.isCorrect ? "✓ 正确" : "✗ 错误"),
                        3
                        /* TEXT, CLASS */
                      )
                    ])
                  ]),
                  vue.createElementVNode("view", { class: "question-content" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "expression" },
                      vue.toDisplayString(detail.expression),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "answer-row" }, [
                    vue.createElementVNode("text", { class: "answer-label" }, "你的答案："),
                    vue.createElementVNode(
                      "text",
                      {
                        class: vue.normalizeClass(["answer-value", detail.isCorrect ? "correct-answer" : "wrong-answer"])
                      },
                      vue.toDisplayString($options.formatUserAnswer(detail, index)),
                      3
                      /* TEXT, CLASS */
                    )
                  ]),
                  !detail.isCorrect ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "answer-row"
                  }, [
                    vue.createElementVNode("text", { class: "answer-label" }, "正确答案："),
                    vue.createElementVNode(
                      "text",
                      { class: "correct-answer" },
                      vue.toDisplayString($options.formatCorrectAnswer(detail, index)),
                      1
                      /* TEXT */
                    )
                  ])) : vue.createCommentVNode("v-if", true)
                ],
                2
                /* CLASS */
              );
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "result-footer" }, [
          vue.createElementVNode("button", {
            class: "action-btn export",
            onClick: _cache[6] || (_cache[6] = (...args) => $options.exportTxt && $options.exportTxt(...args))
          }, "导出TXT"),
          vue.createElementVNode("button", {
            class: "action-btn primary",
            onClick: _cache[7] || (_cache[7] = (...args) => $options.backToHome && $options.backToHome(...args))
          }, "返回首页"),
          vue.createElementVNode("button", {
            class: "action-btn secondary",
            onClick: _cache[8] || (_cache[8] = (...args) => $options.viewWrongProblems && $options.viewWrongProblems(...args))
          }, "查看错题集")
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesExamExam = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-970fed46"], ["__file", "D:/MySoftWare/MySoftWare/bzd/pages/exam/exam.vue"]]);
  const _imports_0 = "/static/icons/register.png";
  const _sfc_main$4 = {
    data() {
      return {
        username: "",
        email: "",
        password: "",
        roles: ["student", "parent", "teacher"],
        roleIndex: 0
      };
    },
    methods: {
      onRoleChange(e) {
        this.roleIndex = e.detail.value;
      },
      async register() {
        if (!this.username || !this.email || !this.password) {
          return uni.showToast({ title: "请填写完整信息", icon: "none", image: "/static/icons/fail.png" });
        }
        if (this.password.length < 6) {
          return uni.showToast({ title: "密码至少6位", icon: "none", image: "/static/icons/fail.png" });
        }
        uni.showLoading({ title: "注册中...", mask: true });
        try {
          const res = await request({
            url: api.register,
            method: "POST",
            data: {
              username: this.username,
              email: this.email,
              password: this.password,
              role: this.roles[this.roleIndex]
            }
          });
          uni.hideLoading();
          if (res.success) {
            uni.showToast({ title: "注册成功", icon: "success", image: "/static/icons/success.png" });
            uni.setStorageSync("token", res.token);
            setTimeout(() => {
              uni.switchTab({ url: "/pages/tabbar/me/me" });
            }, 800);
          } else {
            uni.showToast({ title: res.message || "注册失败", icon: "none", image: "/static/icons/fail.png" });
          }
        } catch (err) {
          uni.hideLoading();
          uni.showToast({ title: "网络异常或邮箱已存在", icon: "none", image: "/static/icons/fail.png" });
        }
      },
      goLogin() {
        uni.switchTab({ url: "/pages/tabbar/me/me" });
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("image", {
          src: _imports_0,
          class: "icon"
        }),
        vue.createElementVNode("text", { class: "title" }, "注册账户")
      ]),
      vue.createElementVNode("view", { class: "register-card" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.username = $event),
            class: "input-box",
            placeholder: "请输入用户名",
            type: "text"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.username]
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.email = $event),
            class: "input-box",
            placeholder: "请输入邮箱",
            type: "text"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.email]
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.password = $event),
            class: "input-box",
            placeholder: "请输入密码（至少6位）",
            type: "password"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.password]
        ]),
        vue.createElementVNode("picker", {
          range: $data.roles,
          value: $data.roleIndex,
          onChange: _cache[3] || (_cache[3] = (...args) => $options.onRoleChange && $options.onRoleChange(...args))
        }, [
          vue.createElementVNode("view", { class: "picker-box" }, [
            vue.createElementVNode(
              "text",
              null,
              "角色：" + vue.toDisplayString($data.roles[$data.roleIndex]),
              1
              /* TEXT */
            )
          ])
        ], 40, ["range", "value"]),
        vue.createElementVNode("button", {
          class: "register-btn",
          onClick: _cache[4] || (_cache[4] = (...args) => $options.register && $options.register(...args))
        }, "立即注册"),
        vue.createElementVNode("view", { class: "footer" }, [
          vue.createElementVNode("text", null, "已有账户？"),
          vue.createElementVNode("text", {
            class: "link",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.goLogin && $options.goLogin(...args))
          }, "去登录")
        ])
      ])
    ]);
  }
  const PagesRegisterRegister = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-bac4a35d"], ["__file", "D:/MySoftWare/MySoftWare/bzd/pages/register/register.vue"]]);
  const _sfc_main$3 = {
    data() {
      return {
        wrongProblems: [],
        // 年级筛选：包含“全部”项，默认选择全部（不传 grade 参数）
        gradeOptions: ["全部", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
        // 默认 0 -> 全部
        gradeIndex: 0,
        difficultyOptions: ["全部", "简单", "中等", "困难"],
        difficultyValues: ["", "easy", "medium", "hard"],
        difficultyIndex: 0,
        showMastered: false
      };
    },
    onLoad() {
      if (!this.checkLogin())
        return;
      this.loadWrongProblems();
    },
    methods: {
      /** ✅ 检查登录状态 */
      checkLogin() {
        const token = uni.getStorageSync("token");
        if (!token) {
          uni.showModal({
            title: "提示",
            content: "请先登录后查看错题集",
            showCancel: false,
            success: () => {
              uni.switchTab({
                url: "/pages/tabbar/me/me"
              });
            }
          });
          return false;
        }
        return true;
      },
      async loadWrongProblems() {
        uni.showLoading({ title: "加载中..." });
        try {
          const params = {
            isMastered: this.showMastered
          };
          if (this.gradeIndex > 0) {
            params.grade = this.gradeIndex;
          }
          if (this.difficultyIndex > 0) {
            params.difficulty = this.difficultyValues[this.difficultyIndex];
          }
          const queryString = Object.keys(params).map((key) => `${key}=${params[key]}`).join("&");
          const res = await request({
            url: `${api.wrongProblems}?${queryString}`,
            method: "GET",
            auth: true
          });
          if (res.success) {
            this.wrongProblems = res.data;
          }
        } catch (err) {
          formatAppLog("error", "at pages/wrongProblems/wrongProblems.vue:167", "加载错题失败:", err);
          uni.showToast({ title: "加载失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      },
      onGradeChange(e) {
        this.gradeIndex = e.detail.value;
        this.loadWrongProblems();
      },
      onDifficultyChange(e) {
        this.difficultyIndex = e.detail.value;
        this.loadWrongProblems();
      },
      toggleMastered() {
        this.showMastered = !this.showMastered;
        this.loadWrongProblems();
      },
      async markAsMastered(id) {
        try {
          const res = await request({
            url: `${api.wrongProblems}/${id}/master`,
            method: "PUT",
            auth: true
          });
          if (res.success) {
            uni.showToast({ title: "已标记为掌握", icon: "success" });
            this.loadWrongProblems();
          }
        } catch (err) {
          formatAppLog("error", "at pages/wrongProblems/wrongProblems.vue:202", "标记失败:", err);
          uni.showToast({ title: "操作失败", icon: "none" });
        }
      },
      async deleteProblem(id) {
        uni.showModal({
          title: "确认删除",
          content: "确定要删除这道错题吗？",
          success: async (modalRes) => {
            if (modalRes.confirm) {
              try {
                const res = await request({
                  url: `${api.wrongProblems}/${id}`,
                  method: "DELETE",
                  auth: true
                });
                if (res.success) {
                  uni.showToast({ title: "删除成功", icon: "success" });
                  this.loadWrongProblems();
                }
              } catch (err) {
                formatAppLog("error", "at pages/wrongProblems/wrongProblems.vue:225", "删除失败:", err);
                uni.showToast({ title: "删除失败", icon: "none" });
              }
            }
          }
        });
      },
      getTypeLabel(type) {
        const map = {
          // 常规类型
          "addition": "加法",
          "subtraction": "减法",
          "multiplication": "乘法",
          "division": "除法",
          "mixed": "混合运算",
          "comparison": "比较",
          "fill_blank": "填空",
          // 一二年级/常见别名
          "addition_10": "10以内加法",
          "subtraction_10": "10以内减法",
          "addition_20_carry": "20以内加法（带进位）",
          "subtraction_20_borrow": "20以内减法（带借位）",
          "mixed_100_add_sub": "100以内加减混合",
          "money_conversion": "元角分换算",
          "multiplication_9x9": "9x9 乘法",
          "division_9x9": "9x9 除法",
          "mixed_mul_add": "乘法与加法混合",
          "mixed_consecutive_mul": "连续乘法（3项）",
          "division_with_remainder": "带余数除法",
          "time_conversion": "时间换算",
          // 三年级
          "add_sub_3digit": "三位数加减法",
          "multiplication_2digit": "两位数乘法",
          "perimeter_calc": "周长计算",
          "area_calc": "面积计算",
          "comparison_100": "百以内比较",
          "weight_conversion": "重量单位换算",
          "time_duration": "时间计算",
          "division_with_remainder_large": "大数带余数除法",
          // 四年级
          "decimal_add_sub": "小数加减",
          "decimal_rounding": "小数的保留",
          "mixed_ops_2digit": "两位数四则运算",
          "mixed_ops_parenthesis": "含括号四则运算",
          "associative_law": "交换/结合律",
          "distributive_law": "乘法分配律",
          "advanced_comparison": "千以内比较",
          "number_rounding_unit": "近似数认识",
          // 五六年级
          "decimal_multiplication_10": "10以内小数乘法",
          "decimal_division_10": "10以内小数除法",
          "decimal_division_round_1": "小数除法（商保留一位）",
          "parallelogram_area": "平行四边形面积",
          "triangle_area": "三角形面积",
          "trapezoid_area": "梯形面积",
          "circle_area": "圆面积",
          "simple_equation": "简单方程",
          "cylinder_volume": "圆柱体积",
          "sphere_volume": "球体积",
          "fraction_add_sub": "带分数加减",
          "fraction_mul": "带分数乘法"
        };
        return map[type] || type || "";
      },
      getDifficultyLabel(difficulty) {
        const map = {
          "easy": "简单",
          "medium": "中等",
          "hard": "困难"
        };
        return map[difficulty] || difficulty;
      },
      formatDate(dateString) {
        const date = new Date(dateString);
        const now = /* @__PURE__ */ new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
        if (days === 0)
          return "今天";
        if (days === 1)
          return "昨天";
        if (days < 7)
          return `${days}天前`;
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      },
      goBack() {
        uni.switchTab({ url: "/pages/tabbar/index/index" });
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("image", {
          src: _imports_0$1,
          class: "header-icon"
        }),
        vue.createElementVNode("text", { class: "title" }, "我的错题集")
      ]),
      vue.createElementVNode("view", { class: "filter-bar" }, [
        vue.createElementVNode("picker", {
          range: $data.gradeOptions,
          value: $data.gradeIndex,
          onChange: _cache[0] || (_cache[0] = (...args) => $options.onGradeChange && $options.onGradeChange(...args))
        }, [
          vue.createElementVNode("view", { class: "filter-item" }, [
            vue.createElementVNode(
              "text",
              null,
              "年级：" + vue.toDisplayString($data.gradeOptions[$data.gradeIndex]),
              1
              /* TEXT */
            )
          ])
        ], 40, ["range", "value"]),
        vue.createElementVNode("picker", {
          range: $data.difficultyOptions,
          value: $data.difficultyIndex,
          onChange: _cache[1] || (_cache[1] = (...args) => $options.onDifficultyChange && $options.onDifficultyChange(...args))
        }, [
          vue.createElementVNode("view", { class: "filter-item" }, [
            vue.createElementVNode(
              "text",
              null,
              "难度：" + vue.toDisplayString($data.difficultyOptions[$data.difficultyIndex]),
              1
              /* TEXT */
            )
          ])
        ], 40, ["range", "value"]),
        vue.createElementVNode("view", {
          class: "filter-item",
          onClick: _cache[2] || (_cache[2] = (...args) => $options.toggleMastered && $options.toggleMastered(...args))
        }, [
          vue.createElementVNode(
            "text",
            null,
            vue.toDisplayString($data.showMastered ? "已掌握" : "未掌握"),
            1
            /* TEXT */
          )
        ])
      ]),
      $data.wrongProblems.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "list-wrapper"
      }, [
        vue.createElementVNode("scroll-view", {
          "scroll-y": "",
          class: "problem-list"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.wrongProblems, (problem, index) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: problem.id,
                class: "problem-card"
              }, [
                vue.createElementVNode("view", { class: "problem-header" }, [
                  vue.createElementVNode("view", { class: "problem-meta" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "problem-type" },
                      vue.toDisplayString($options.getTypeLabel(problem.type)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "problem-difficulty" },
                      vue.toDisplayString($options.getDifficultyLabel(problem.difficulty)),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "problem-actions" }, [
                    !problem.isMastered ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 0,
                      class: "action-btn master",
                      onClick: ($event) => $options.markAsMastered(problem.id)
                    }, " 已掌握 ", 8, ["onClick"])) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode("button", {
                      class: "action-btn delete",
                      onClick: ($event) => $options.deleteProblem(problem.id)
                    }, " 删除 ", 8, ["onClick"])
                  ])
                ]),
                vue.createElementVNode("view", { class: "problem-content" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "expression" },
                    vue.toDisplayString(problem.expression),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "answer-section" }, [
                  vue.createElementVNode("view", { class: "answer-row" }, [
                    vue.createElementVNode("text", { class: "label" }, "正确答案："),
                    vue.createElementVNode(
                      "text",
                      { class: "correct-answer" },
                      vue.toDisplayString(problem.correctAnswer),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "answer-row" }, [
                    vue.createElementVNode("text", { class: "label" }, "你的答案："),
                    vue.createElementVNode(
                      "text",
                      { class: "wrong-answer" },
                      vue.toDisplayString(problem.userAnswer),
                      1
                      /* TEXT */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "problem-footer" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "date-text" },
                    "最后练习：" + vue.toDisplayString($options.formatDate(problem.lastAttemptDate)),
                    1
                    /* TEXT */
                  )
                ])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ])) : (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "empty-state"
      }, [
        vue.createElementVNode("image", {
          src: _imports_1$1,
          class: "empty-icon"
        }),
        vue.createElementVNode(
          "text",
          { class: "empty-text" },
          vue.toDisplayString($data.showMastered ? "暂无已掌握的题目" : "太棒了！暂无错题"),
          1
          /* TEXT */
        )
      ])),
      vue.createElementVNode("view", { class: "fixed-footer" }, [
        vue.createElementVNode("button", {
          class: "back-btn",
          onClick: _cache[3] || (_cache[3] = (...args) => $options.goBack && $options.goBack(...args))
        }, "返回首页")
      ])
    ]);
  }
  const PagesWrongProblemsWrongProblems = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-e65d6a22"], ["__file", "D:/MySoftWare/MySoftWare/bzd/pages/wrongProblems/wrongProblems.vue"]]);
  const BASE_URL$1 = "http://116.62.125.154:5000";
  const _sfc_main$2 = {
    data() {
      return {
        socket: null,
        roomData: {},
        players: [],
        selfIndex: -1,
        bothReady: false,
        countdown: 3,
        timer: null,
        socketTask: null
      };
    },
    computed: {
      selfReady() {
        var _a;
        return this.selfIndex >= 0 && ((_a = this.players[this.selfIndex]) == null ? void 0 : _a.ready);
      }
    },
    onLoad(option) {
      if (!this.checkLogin())
        return;
      this.user = uni.getStorageSync("user") || {};
      const data = JSON.parse(decodeURIComponent(option.data));
      this.roomData = data;
      formatAppLog("log", "at pages/room/room.vue:78", "初始化Socket连接，BASE_URL:", BASE_URL$1);
      formatAppLog("log", "at pages/room/room.vue:79", "房间数据:", this.roomData);
      formatAppLog("log", "at pages/room/room.vue:80", "用户信息:", this.user);
      this.initUniWebSocket();
    },
    methods: {
      initUniWebSocket() {
        const wsUrl = BASE_URL$1.replace("http://", "ws://").replace("https://", "wss://") + "/socket.io/?EIO=4&transport=websocket";
        formatAppLog("log", "at pages/room/room.vue:115", "APP端WebSocket连接地址:", wsUrl);
        this.socketTask = uni.connectSocket({
          url: wsUrl,
          success: () => {
            formatAppLog("log", "at pages/room/room.vue:120", "WebSocket连接请求已发送");
          },
          fail: (err) => {
            formatAppLog("error", "at pages/room/room.vue:123", "WebSocket连接失败:", err);
            uni.showToast({ title: "连接失败", icon: "none" });
          }
        });
        this.socketTask.onOpen(() => {
          formatAppLog("log", "at pages/room/room.vue:129", "WebSocket连接已打开");
          this.socketTask.send({
            data: "40",
            success: () => {
              formatAppLog("log", "at pages/room/room.vue:134", "发送握手消息成功");
              setTimeout(() => this.onSocketConnect(), 100);
            }
          });
        });
        this.socketTask.onMessage((res) => {
          formatAppLog("log", "at pages/room/room.vue:141", "收到WebSocket消息:", res.data);
          try {
            const data = res.data;
            if (data.startsWith("42")) {
              const jsonStr = data.substring(2);
              const [eventName, eventData] = JSON.parse(jsonStr);
              formatAppLog("log", "at pages/room/room.vue:148", "解析事件:", eventName, eventData);
              if (eventName === "roomCreated")
                this.onRoomCreated(eventData);
              else if (eventName === "playerJoined")
                this.onPlayerJoined(eventData);
              else if (eventName === "playerReady")
                this.onPlayerReady(eventData);
              else if (eventName === "startPK")
                this.startCountdown();
            }
          } catch (e) {
            formatAppLog("error", "at pages/room/room.vue:156", "解析消息失败:", e, res.data);
          }
        });
        this.socketTask.onError((err) => {
          formatAppLog("error", "at pages/room/room.vue:161", "WebSocket错误:", err);
          uni.showToast({ title: "连接错误", icon: "none" });
        });
        this.socketTask.onClose(() => {
          formatAppLog("log", "at pages/room/room.vue:166", "WebSocket连接已关闭");
        });
      },
      emitSocketEvent(eventName, data) {
        if (this.socketTask) {
          const message = `42${JSON.stringify([eventName, data])}`;
          formatAppLog("log", "at pages/room/room.vue:180", "发送事件:", eventName, "消息:", message);
          this.socketTask.send({ data: message });
        }
      },
      onSocketConnect() {
        var _a, _b, _c, _d;
        formatAppLog("log", "at pages/room/room.vue:188", "处理Socket连接成功事件");
        if (this.roomData.mode === "create") {
          const createData = {
            ...this.roomData,
            name: ((_a = this.user) == null ? void 0 : _a.name) || "房主",
            avatar: ((_b = this.user) == null ? void 0 : _b.avatarUrl) || "/static/icons/student.png"
          };
          formatAppLog("log", "at pages/room/room.vue:195", "发送createRoom事件，数据:", createData);
          this.emitSocketEvent("createRoom", createData);
        } else {
          const joinData = {
            name: ((_c = this.user) == null ? void 0 : _c.name) || "挑战者",
            avatar: ((_d = this.user) == null ? void 0 : _d.avatarUrl) || "/static/icons/robot.png"
          };
          formatAppLog("log", "at pages/room/room.vue:202", "发送joinRoom事件，房间号:", this.roomData.roomCode, "数据:", joinData);
          if (this.socketTask) {
            const message = `42${JSON.stringify(["joinRoom", this.roomData.roomCode, joinData])}`;
            formatAppLog("log", "at pages/room/room.vue:212", "发送joinRoom消息:", message);
            this.socketTask.send({ data: message });
          }
        }
      },
      // ✅ 接收房间创建成功事件
      onRoomCreated(res) {
        formatAppLog("log", "at pages/room/room.vue:221", "收到roomCreated事件:", res);
        this.roomData.roomCode = res.roomCode;
        this.roomData.config = res.config;
        this.players = res.players || [];
        this.selfIndex = 0;
        formatAppLog("log", "at pages/room/room.vue:226", "房间创建成功，玩家列表:", this.players);
        this.$forceUpdate();
      },
      // ✅ 接收玩家加入事件
      onPlayerJoined(res) {
        formatAppLog("log", "at pages/room/room.vue:233", "收到playerJoined事件:", res);
        if (res == null ? void 0 : res.config)
          this.roomData.config = res.config;
        this.players = res.players || [];
        if (this.roomData.mode === "join" && this.selfIndex === -1) {
          this.selfIndex = 1;
        }
        formatAppLog("log", "at pages/room/room.vue:240", "玩家加入，当前玩家列表:", this.players, "selfIndex:", this.selfIndex);
        this.$forceUpdate();
      },
      // ✅ 接收玩家准备状态更新
      onPlayerReady(res) {
        formatAppLog("log", "at pages/room/room.vue:247", "收到playerReady事件:", res);
        this.players = res.players || [];
        this.checkBothReady();
        formatAppLog("log", "at pages/room/room.vue:250", "准备状态更新，玩家列表:", this.players);
        this.$forceUpdate();
      },
      /** ✅ 检查登录状态 */
      checkLogin() {
        const token = uni.getStorageSync("token");
        if (!token) {
          uni.showModal({
            title: "提示",
            content: "请先登录后参与PK",
            showCancel: false,
            success: () => {
              uni.switchTab({
                url: "/pages/tabbar/me/me"
              });
            }
          });
          return false;
        }
        return true;
      },
      sendReady() {
        formatAppLog("log", "at pages/room/room.vue:275", "点击准备按钮，selfIndex:", this.selfIndex, "玩家列表:", this.players);
        if (this.selfIndex >= 0 && this.players[this.selfIndex]) {
          this.players[this.selfIndex].ready = true;
          formatAppLog("log", "at pages/room/room.vue:278", "更新本地准备状态:", this.players[this.selfIndex]);
        }
        formatAppLog("log", "at pages/room/room.vue:280", "发送playerReady事件，房间号:", this.roomData.roomCode);
        this.emitSocketEvent("playerReady", this.roomData.roomCode);
        this.$forceUpdate();
      },
      checkBothReady() {
        const allReady = this.players.length === 2 && this.players.every((p) => p.ready);
        if (allReady && !this.bothReady) {
          this.bothReady = true;
        }
      },
      startCountdown() {
        this.bothReady = true;
        this.timer = setInterval(() => {
          if (this.countdown > 1)
            this.countdown--;
          else {
            clearInterval(this.timer);
            this.gotoPK();
          }
        }, 1e3);
      },
      gotoPK() {
        const pkData = {
          ...this.roomData,
          players: this.players,
          selfIndex: this.selfIndex
        };
        uni.redirectTo({
          url: `/pages/comp/comp?data=${encodeURIComponent(JSON.stringify(pkData))}`
        });
      },
      exitRoom() {
        if (this.socketTask)
          this.socketTask.close();
        uni.switchTab({ url: "/pages/tabbar/pk/pk" });
      }
    },
    onUnload() {
      if (this.socketTask)
        this.socketTask.close();
      clearInterval(this.timer);
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "room-info" }, [
        vue.createElementVNode(
          "text",
          { class: "room-title" },
          "🏠 房间号：" + vue.toDisplayString($data.roomData.roomCode),
          1
          /* TEXT */
        )
      ]),
      !$data.bothReady ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "waiting-box"
      }, [
        !$options.selfReady ? (vue.openBlock(), vue.createElementBlock("text", {
          key: 0,
          class: "waiting-text"
        }, "请点击准备")) : (vue.openBlock(), vue.createElementBlock("text", {
          key: 1,
          class: "waiting-text"
        }, "已准备，等待对方...")),
        vue.createElementVNode("view", { class: "players" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.players, (p, i) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: "player-card",
                key: i
              }, [
                vue.createElementVNode("image", {
                  src: p.avatar,
                  class: "avatar"
                }, null, 8, ["src"]),
                vue.createElementVNode(
                  "text",
                  { class: "player-name" },
                  vue.toDisplayString(p.name),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  {
                    class: vue.normalizeClass(["ready-status", p.ready ? "ready" : "not-ready"])
                  },
                  vue.toDisplayString(p.ready ? "✅ 已准备" : "⏳ 未准备"),
                  3
                  /* TEXT, CLASS */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("button", {
          class: "ready-btn",
          disabled: $options.selfReady,
          onClick: _cache[0] || (_cache[0] = (...args) => $options.sendReady && $options.sendReady(...args))
        }, vue.toDisplayString($options.selfReady ? "已准备" : "点击准备"), 9, ["disabled"]),
        vue.createElementVNode("button", {
          class: "back-btn",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.exitRoom && $options.exitRoom(...args))
        }, "退出房间"),
        vue.createElementVNode("view", { class: "tip-box" }, [
          vue.createElementVNode("text", { class: "tip-text" }, "⚠️ 未等到匹配者请勿点击准备，若误触，请退出重建房间")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $data.bothReady ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "countdown-box"
      }, [
        vue.createElementVNode(
          "text",
          { class: "countdown" },
          "PK 即将开始：" + vue.toDisplayString($data.countdown) + " 秒",
          1
          /* TEXT */
        )
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesRoomRoom = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-49055c66"], ["__file", "D:/MySoftWare/MySoftWare/bzd/pages/room/room.vue"]]);
  const BASE_URL = "http://116.62.125.154:5000";
  const _sfc_main$1 = {
    data() {
      return {
        socket: null,
        roomData: {},
        players: [],
        selfIndex: -1,
        problems: [],
        index: 0,
        answer: "",
        myScore: 0,
        otherScore: 0,
        currentProblem: null,
        timeLeft: 15,
        timer: null,
        isOver: false,
        countdown: 3,
        resultText: "",
        rematchTimer: null,
        selfId: "",
        socketTask: null
      };
    },
    computed: {
      selfPlayer() {
        return this.selfIndex >= 0 ? this.players[this.selfIndex] : null;
      },
      otherPlayer() {
        if (this.selfIndex < 0 || this.players.length < 2)
          return null;
        return this.players[this.selfIndex === 0 ? 1 : 0];
      }
    },
    onLoad(option) {
      if (!this.checkLogin())
        return;
      this.user = uni.getStorageSync("user") || {};
      const data = JSON.parse(decodeURIComponent(option.data));
      this.roomData = data;
      this.players = data.players || [];
      this.selfIndex = data.selfIndex >= 0 ? data.selfIndex : -1;
      formatAppLog("log", "at pages/comp/comp.vue:91", "PK页面初始化，selfIndex:", this.selfIndex, "players:", this.players);
      this.initUniWebSocket();
      this.generateProblems();
      this.startPK();
    },
    methods: {
      initUniWebSocket() {
        const wsUrl = BASE_URL.replace("http://", "ws://").replace("https://", "wss://") + "/socket.io/?EIO=4&transport=websocket";
        formatAppLog("log", "at pages/comp/comp.vue:154", "PK APP端WebSocket连接地址:", wsUrl);
        this.socketTask = uni.connectSocket({
          url: wsUrl,
          success: () => {
            formatAppLog("log", "at pages/comp/comp.vue:159", "PK WebSocket连接请求已发送");
          }
        });
        this.socketTask.onOpen(() => {
          formatAppLog("log", "at pages/comp/comp.vue:164", "PK WebSocket连接已打开");
          this.socketTask.send({
            data: "40",
            success: () => {
              formatAppLog("log", "at pages/comp/comp.vue:168", "PK 发送握手消息成功");
              setTimeout(() => {
                this.socketTask.send({
                  data: `42${JSON.stringify(["joinComp", this.roomData.roomCode])}`,
                  success: () => {
                    formatAppLog("log", "at pages/comp/comp.vue:173", "PK 发送joinComp成功");
                  }
                });
              }, 100);
            }
          });
        });
        this.socketTask.onMessage((res) => {
          formatAppLog("log", "at pages/comp/comp.vue:182", "PK 收到WebSocket消息:", res.data);
          try {
            const data = res.data;
            if (data.startsWith("40")) {
              const jsonStr = data.substring(2);
              const sessionData = JSON.parse(jsonStr);
              this.selfId = sessionData.sid;
              formatAppLog("log", "at pages/comp/comp.vue:191", "PK 获取到socket ID:", this.selfId);
              return;
            }
            if (data.startsWith("42")) {
              const jsonStr = data.substring(2);
              const [eventName, eventData] = JSON.parse(jsonStr);
              formatAppLog("log", "at pages/comp/comp.vue:198", "PK 解析事件:", eventName, eventData);
              if (eventName === "updateScore") {
                formatAppLog("log", "at pages/comp/comp.vue:201", "PK 收到updateScore，selfId:", this.selfId, "data:", eventData);
                if (eventData.socketId !== this.selfId) {
                  this.otherScore = eventData.score;
                  formatAppLog("log", "at pages/comp/comp.vue:204", "PK 更新对方分数为:", eventData.score);
                }
              } else if (eventName === "finalResult") {
                formatAppLog("log", "at pages/comp/comp.vue:208", "PK 收到finalResult:", eventData);
                this.endPK(eventData);
              } else if (eventName === "receiveRematchInvite") {
                uni.showModal({
                  title: "再战邀请",
                  content: "对方邀请你再战！是否接受？",
                  confirmText: "接受",
                  cancelText: "拒绝",
                  success: (res2) => {
                    if (res2.confirm) {
                      this.socketTask.send({ data: `42${JSON.stringify(["acceptRematch", this.roomData.roomCode])}` });
                    } else {
                      this.socketTask.send({ data: `42${JSON.stringify(["declineRematch", this.roomData.roomCode])}` });
                    }
                  }
                });
              } else if (eventName === "startRematch") {
                this.resultText = "🕒 再战即将开始...";
                this.startRematchCountdown();
              } else if (eventName === "rematchDeclined") {
                uni.showToast({ title: "对方拒绝了再战", icon: "none" });
              }
            }
          } catch (e) {
            formatAppLog("error", "at pages/comp/comp.vue:235", "PK 解析消息失败:", e, res.data);
          }
        });
        this.socketTask.onError((err) => {
          formatAppLog("error", "at pages/comp/comp.vue:240", "PK WebSocket错误:", err);
        });
        this.socketTask.onClose(() => {
          formatAppLog("log", "at pages/comp/comp.vue:244", "PK WebSocket连接已关闭");
        });
      },
      emitSocketEvent(eventName, data) {
        formatAppLog("log", "at pages/comp/comp.vue:249", "PK 发送事件:", eventName, data);
        if (this.socketTask) {
          const message = `42${JSON.stringify([eventName, data])}`;
          formatAppLog("log", "at pages/comp/comp.vue:259", "PK 发送消息:", message);
          this.socketTask.send({ data: message });
        }
      },
      /** ✅ 检查登录状态 */
      checkLogin() {
        const token = uni.getStorageSync("token");
        if (!token) {
          uni.showModal({
            title: "提示",
            content: "请先登录后参与PK",
            showCancel: false,
            success: () => {
              uni.switchTab({
                url: "/pages/tabbar/me/me"
              });
            }
          });
          return false;
        }
        return true;
      },
      generateProblems() {
        var _a, _b;
        const seed = ((_a = this.roomData.config) == null ? void 0 : _a.seed) || this.roomData.seed || Date.now();
        formatAppLog("log", "at pages/comp/comp.vue:286", "生成题目，使用seed:", seed);
        const random = this.seededRandom(seed);
        const count = ((_b = this.roomData.config) == null ? void 0 : _b.questionCount) || 10;
        const problems = [];
        for (let i = 0; i < count; i++) {
          const a = Math.floor(random() * 9) + 1;
          const b = Math.floor(random() * 9) + 1;
          const ops = ["+", "-", "×"];
          const op = ops[Math.floor(random() * 3)];
          const question = `${a} ${op} ${b}`;
          let answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
          problems.push({ question, answer });
          if (i < 3) {
            formatAppLog("log", "at pages/comp/comp.vue:301", `题目${i + 1}: ${question} = ${answer}`);
          }
        }
        this.problems = problems;
        this.index = 0;
        this.currentProblem = this.problems[0];
        this.isOver = false;
        formatAppLog("log", "at pages/comp/comp.vue:309", "生成了", problems.length, "道题目，第一题:", this.currentProblem);
      },
      seededRandom(seed) {
        let s = seed;
        return function() {
          s = Math.sin(s) * 1e4;
          return s - Math.floor(s);
        };
      },
      submitAnswer() {
        if (this.isOver)
          return;
        const correct = parseInt(this.answer) === this.currentProblem.answer;
        if (correct) {
          this.myScore++;
          formatAppLog("log", "at pages/comp/comp.vue:323", "答对了，我的分数:", this.myScore, "selfId:", this.selfId);
          this.emitSocketEvent("updateScore", {
            roomCode: this.roomData.roomCode,
            score: this.myScore,
            socketId: this.selfId
          });
        }
        this.answer = "";
        this.nextProblem();
      },
      nextProblem() {
        if (this.index < this.problems.length - 1) {
          this.index++;
          this.currentProblem = this.problems[this.index];
        } else {
          clearInterval(this.timer);
          this.isOver = true;
          this.resultText = "正在结算...";
          formatAppLog("log", "at pages/comp/comp.vue:341", "题目做完，发送playerFinished，我的分数:", this.myScore, "selfId:", this.selfId);
          this.emitSocketEvent("playerFinished", {
            roomCode: this.roomData.roomCode,
            score: this.myScore,
            socketId: this.selfId
          });
        }
      },
      startPK() {
        var _a;
        this.timeLeft = ((_a = this.roomData.config) == null ? void 0 : _a.timeLimit) || 15;
        clearInterval(this.timer);
        this.isOver = false;
        this.resultText = "";
        this.timer = setInterval(() => {
          if (this.timeLeft > 0)
            this.timeLeft--;
          else {
            clearInterval(this.timer);
            this.isOver = true;
            this.resultText = "正在结算...";
            formatAppLog("log", "at pages/comp/comp.vue:361", "时间到，发送playerFinished，我的分数:", this.myScore, "selfId:", this.selfId);
            this.emitSocketEvent("playerFinished", {
              roomCode: this.roomData.roomCode,
              score: this.myScore,
              socketId: this.selfId
            });
          }
        }, 1e3);
      },
      endPK(data) {
        formatAppLog("log", "at pages/comp/comp.vue:371", "PK结束，结算数据:", data);
        clearInterval(this.timer);
        this.isOver = true;
        this.myScore = data.myScore;
        this.otherScore = data.otherScore;
        this.resultText = data.result;
        formatAppLog("log", "at pages/comp/comp.vue:377", "最终分数 - 我:", this.myScore, "对方:", this.otherScore);
      },
      inviteRematch() {
        this.emitSocketEvent("inviteRematch", this.roomData.roomCode);
        uni.showToast({ title: "邀请已发送", icon: "none" });
      },
      startRematchCountdown() {
        this.countdown = 3;
        clearInterval(this.rematchTimer);
        this.rematchTimer = setInterval(() => {
          if (this.countdown > 0) {
            this.resultText = `🕒 再战即将开始：${this.countdown}s`;
            this.countdown--;
          } else {
            clearInterval(this.rematchTimer);
            this.resetGame();
            this.resultText = "";
            this.startPK();
          }
        }, 1e3);
      },
      resetGame() {
        this.myScore = 0;
        this.otherScore = 0;
        this.isOver = false;
        this.answer = "";
        this.generateProblems();
      },
      exit() {
        if (this.socketTask)
          this.socketTask.close();
        uni.switchTab({ url: "/pages/tabbar/pk/pk" });
      }
    },
    onUnload() {
      clearInterval(this.timer);
      clearInterval(this.rematchTimer);
      if (this.socketTask)
        this.socketTask.close();
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    var _a, _b;
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "status-bar" }),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode(
          "text",
          { class: "room" },
          "🏠 房间号：" + vue.toDisplayString($data.roomData.roomCode),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          { class: "timer" },
          "⏱️ " + vue.toDisplayString($data.timeLeft) + "s",
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "players" }, [
        vue.createElementVNode("view", { class: "player" }, [
          vue.createElementVNode(
            "text",
            { class: "name" },
            vue.toDisplayString(((_a = $options.selfPlayer) == null ? void 0 : _a.name) || "我"),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            null,
            vue.toDisplayString($data.myScore) + " 分",
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "player" }, [
          vue.createElementVNode(
            "text",
            { class: "name" },
            vue.toDisplayString(((_b = $options.otherPlayer) == null ? void 0 : _b.name) || "对手"),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", null, "?")
        ])
      ]),
      $data.currentProblem && !$data.isOver ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "problem-box"
      }, [
        vue.createElementVNode(
          "text",
          { class: "problem" },
          vue.toDisplayString($data.currentProblem.question),
          1
          /* TEXT */
        ),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            type: "number",
            class: "answer-input",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.answer = $event),
            onConfirm: _cache[1] || (_cache[1] = (...args) => $options.submitAnswer && $options.submitAnswer(...args)),
            placeholder: "输入答案回车"
          },
          null,
          544
          /* NEED_HYDRATION, NEED_PATCH */
        ), [
          [vue.vModelText, $data.answer]
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $data.isOver ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "result-box"
      }, [
        vue.createElementVNode(
          "text",
          { class: "result-title" },
          vue.toDisplayString($data.resultText),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          { class: "score-line" },
          "我方：" + vue.toDisplayString($data.myScore) + " | 对方：" + vue.toDisplayString($data.otherScore),
          1
          /* TEXT */
        ),
        vue.createElementVNode("button", {
          class: "btn invite",
          onClick: _cache[2] || (_cache[2] = (...args) => $options.inviteRematch && $options.inviteRematch(...args))
        }, "邀请再战"),
        vue.createElementVNode("button", {
          class: "btn exit",
          onClick: _cache[3] || (_cache[3] = (...args) => $options.exit && $options.exit(...args))
        }, "退出")
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesCompComp = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-47c2b3b6"], ["__file", "D:/MySoftWare/MySoftWare/bzd/pages/comp/comp.vue"]]);
  __definePage("pages/tabbar/index/index", PagesTabbarIndexIndex);
  __definePage("pages/tabbar/ai/ai", PagesTabbarAiAi);
  __definePage("pages/tabbar/pk/pk", PagesTabbarPkPk);
  __definePage("pages/tabbar/me/me", PagesTabbarMeMe);
  __definePage("pages/exam/exam", PagesExamExam);
  __definePage("pages/register/register", PagesRegisterRegister);
  __definePage("pages/wrongProblems/wrongProblems", PagesWrongProblemsWrongProblems);
  __definePage("pages/room/room", PagesRoomRoom);
  __definePage("pages/comp/comp", PagesCompComp);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
      this.checkLoginStatus();
      this.setStatusBarHeight();
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:11", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:14", "App Hide");
    },
    methods: {
      checkLoginStatus() {
        const token = uni.getStorageSync("token");
        if (!token) {
          formatAppLog("log", "at App.vue:21", "未登录，将在页面跳转时拦截");
        }
      },
      setStatusBarHeight() {
        uni.getSystemInfo({
          success: (res) => {
            const statusBarHeight = res.statusBarHeight || 25;
            getApp().globalData = getApp().globalData || {};
            getApp().globalData.statusBarHeight = statusBarHeight;
            formatAppLog("log", "at App.vue:32", "状态栏高度:", statusBarHeight + "px");
            try {
              const pages = getCurrentPages();
              if (pages.length > 0) {
                const page = pages[pages.length - 1];
                page.$el.style.setProperty("--status-bar-height", statusBarHeight + "px");
              }
            } catch (e) {
              formatAppLog("log", "at App.vue:43", "设置状态栏高度失败:", e);
            }
          }
        });
      }
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/MySoftWare/MySoftWare/bzd/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
