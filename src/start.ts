import { doActions } from "./ActionManager";


const actions: Array<Action> = []; // 行为动作栈，表述当前动作或目标, 头部最新，尾部最老
// readline交互
// import readline from 'readline';

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// const getInput = async (prompt: string): Promise<string> => {
//     return new Promise((resolve) => {
//         rl.question(prompt, (answer) => {
//             resolve(answer);
//             rl.close();
//         });
//     });
// }

(async () => {
  console.log('start!')
  // const answer = await getInput("请输入你想要做的动作:\n");
  const answer = '列出当前文件夹下的所有文件名称'
  console.log(`你的输入是：${answer}`);
  actions.push({
    type: '拆解目标或代码实现',
    content: answer
  })
  await doActions(actions);
})();